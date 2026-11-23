import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import type { AppEnv } from '../../config/env.js';

export async function registerEnrichmentRoutes(app: FastifyInstance, env: AppEnv): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/enrichment/providers',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Inspect optional enrichment provider flags (all disabled in MVP)',
        response: {
          200: Type.Object({
            providers: Type.Array(
              Type.Object({
                sourceId: Type.String(),
                enabled: Type.Boolean(),
                allowPersistentMirror: Type.Boolean(),
                notes: Type.String(),
              }),
            ),
          }),
        },
      },
    },
    async () => ({
      providers: [
        {
          sourceId: 'anilist',
          enabled: env.enrichmentFlags.anilist,
          allowPersistentMirror: false,
          notes: 'Disabled in MVP. Bulk mirroring prohibited by AniList TOS.',
        },
        {
          sourceId: 'wikidata',
          enabled: env.enrichmentFlags.wikidata,
          allowPersistentMirror: false,
          notes: 'Disabled by default. Opt-in single-item lookup only under CC0.',
        },
        {
          sourceId: 'mangaupdates',
          enabled: env.enrichmentFlags.mangaupdates,
          allowPersistentMirror: false,
          notes: 'Disabled in MVP pending post-MVP legal review.',
        },
        {
          sourceId: 'tmdb',
          enabled: env.enrichmentFlags.tmdb,
          allowPersistentMirror: false,
          notes: 'Disabled in MVP pending server token and attribution setup.',
        },
      ],
    }),
  );
}
