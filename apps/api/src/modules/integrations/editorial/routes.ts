import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import type { AnimeEditorialResponseDto, ExternalIntegrationState } from '@animeverse/contracts';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../../../db/client.js';
import { anime, externalReference } from '../../../db/schema.js';
import { AppHttpError } from '../../../plugins/problem-details.js';
import type { MangaUpdatesClient } from './mangaupdates-client.js';
import type { WikidataEditorialClient } from './wikidata-client.js';
import { ATTRIBUTE_PRECEDENCE_MATRIX, reconcileEditorialAssertions } from './reconciler.js';

export interface EditorialRoutesDeps {
  db?: AppDatabase;
  mangaUpdatesClient: MangaUpdatesClient;
  wikidataClient: WikidataEditorialClient;
}

export async function registerEditorialRoutes(
  app: FastifyInstance,
  deps: EditorialRoutesDeps,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/editorial/sources',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'Inspect editorial sources (MangaUpdates, Wikidata) status and attribute precedence matrix',
      },
    },
    async () => ({
      providers: [
        {
          sourceId: 'mangaupdates',
          enabled: deps.mangaUpdatesClient.isEnabled(),
          license: 'MangaUpdates API v1 Terms (attribution required, no bulk cloning)',
          policyDoc: 'docs/data-sources/MANGAUPDATES-SOURCE-POLICY.md',
        },
        {
          sourceId: 'wikidata',
          enabled: deps.wikidataClient.isEnabled(),
          license: 'CC0 1.0 (structured data only; Wikimedia Commons images excluded)',
          policyDoc: 'docs/data-sources/WIKIDATA-SOURCE-POLICY.md',
        },
      ],
      precedenceMatrix: ATTRIBUTE_PRECEDENCE_MATRIX,
    }),
  );

  typedApp.get(
    '/api/v1/anime/:id/editorial',
    {
      schema: {
        tags: ['Catalog'],
        summary:
          'Get editorial metadata (original media, manga authors/publishers, conflicts) with provenance',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        querystring: Type.Object({
          mangaUpdatesId: Type.Optional(Type.Integer({ minimum: 1 })),
          wikidataQid: Type.Optional(Type.String({ pattern: '^Q\\d+$' })),
        }),
      },
    },
    async (request): Promise<AnimeEditorialResponseDto> => {
      if (!deps.db) {
        throw new AppHttpError(
          503,
          'DATABASE_UNAVAILABLE',
          'Service Unavailable',
          'Database not configured.',
        );
      }

      const [animeRow] = await deps.db
        .select({ id: anime.id, title: anime.title })
        .from(anime)
        .where(eq(anime.id, request.params.id))
        .limit(1);

      if (!animeRow) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      }

      const refs = await deps.db
        .select()
        .from(externalReference)
        .where(eq(externalReference.animeId, animeRow.id));

      const muState: ExternalIntegrationState = deps.mangaUpdatesClient.isEnabled()
        ? request.query.mangaUpdatesId
          ? 'OK'
          : 'UNLINKED'
        : 'DISABLED';

      const wdState: ExternalIntegrationState = deps.wikidataClient.isEnabled()
        ? request.query.wikidataQid
          ? 'OK'
          : 'UNLINKED'
        : 'DISABLED';

      const assertions: AnimeEditorialResponseDto['assertions'] = [];
      let mangaTitle: string | null = null;
      let originalMediaType: string | null = null;
      const authors: string[] = [];
      const publishers: AnimeEditorialResponseDto['publishers'] = [];

      let finalMuState: ExternalIntegrationState = muState;
      if (deps.mangaUpdatesClient.isEnabled() && request.query.mangaUpdatesId) {
        const muRes = await deps.mangaUpdatesClient.fetchSeriesById(request.query.mangaUpdatesId);
        if (muRes.ok) {
          mangaTitle = muRes.data.title;
          originalMediaType = muRes.data.mediaType;
          for (const a of muRes.data.authors) authors.push(`${a.name} (${a.type})`);
          for (const p of muRes.data.publishers) {
            publishers.push({ name: p.name, context: p.type, source: 'mangaupdates' });
            assertions.push({
              property: 'manga_publisher',
              value: p.name,
              source: 'mangaupdates',
              sourceEntityId: String(muRes.data.seriesId),
              sourceUrl: muRes.data.url,
              license: 'MangaUpdates API v1 (attribution required)',
              verificationStatus: 'VERIFIED',
              capturedAt: new Date().toISOString(),
            });
          }
        } else {
          finalMuState = muRes.kind === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'UNAVAILABLE';
        }
      }

      let finalWdState: ExternalIntegrationState = wdState;
      if (deps.wikidataClient.isEnabled() && request.query.wikidataQid) {
        const wdRes = await deps.wikidataClient.fetchEntityByQid(request.query.wikidataQid);
        if (wdRes.ok) {
          assertions.push({
            property: 'wikidata_qid',
            value: wdRes.data.qid,
            source: 'wikidata',
            sourceEntityId: wdRes.data.qid,
            sourceUrl: wdRes.data.url,
            license: 'CC0 1.0',
            verificationStatus: 'VERIFIED',
            capturedAt: new Date().toISOString(),
          });
        } else {
          finalWdState = wdRes.kind === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'UNAVAILABLE';
        }
      }

      const { conflicts } = reconcileEditorialAssertions(assertions);

      return {
        animeId: animeRow.id,
        animeTitle: animeRow.title,
        originalMediaType,
        mangaTitle,
        authors,
        publishers,
        assertions,
        conflicts,
        providerStates: {
          mangaupdates: finalMuState,
          wikidata: finalWdState,
        },
        attributionNotice: `Local anime references: ${refs.length}. Editorial sources (MangaUpdates / Wikidata CC0) are queried on-demand without replicating full external catalogs.`,
      };
    },
  );
}
