import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import type { ModuleStatusDto } from '@animeverse/contracts';
import { AppHttpError } from '../../plugins/problem-details.js';
import { filterLoreDataset, type LoreDataset } from './spoiler-engine.js';

export interface LoreRepository {
  getDataset(
    workId: string,
    media: 'ANIME' | 'MANGA',
    version: string,
  ): Promise<LoreDataset | null>;
}

const ModuleStatusSchema = Type.Object({
  module: Type.Union([Type.Literal('lore'), Type.Literal('adaptation')]),
  availability: Type.Union([
    Type.Literal('AVAILABLE'),
    Type.Literal('MISSING'),
    Type.Literal('CONFLICT'),
    Type.Literal('UNVERIFIED'),
    Type.Literal('UNAVAILABLE'),
  ]),
  message: Type.String(),
  curationMode: Type.Literal('CLI_ONLY'),
  recordsCount: Type.Integer(),
});

const LoreScopeQuerySchema = Type.Object({
  media: Type.Optional(Type.Union([Type.Literal('ANIME'), Type.Literal('MANGA')])),
  version: Type.Optional(Type.String({ minLength: 1, maxLength: 40 })),
  progress: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000 })),
  allowSpoilers: Type.Optional(Type.Boolean()),
});

export async function registerLoreAndAdaptationRoutes(
  app: FastifyInstance,
  loreRepo?: LoreRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/lore/status',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'LoreGraph module availability status (UNAVAILABLE in MVP without curated dataset)',
        response: { 200: ModuleStatusSchema },
      },
    },
    async (): Promise<ModuleStatusDto> => ({
      module: 'lore',
      availability: 'UNAVAILABLE',
      message:
        'LoreGraph engine & spoiler boundary are active; no fabricated narrative data is served in production until licensed/curated entries are published.',
      curationMode: 'CLI_ONLY',
      recordsCount: 0,
    }),
  );

  typedApp.get(
    '/api/v1/adaptation/status',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'AdaptationLab module availability status (UNAVAILABLE in MVP without curated dataset)',
        response: { 200: ModuleStatusSchema },
      },
    },
    async (): Promise<ModuleStatusDto> => ({
      module: 'adaptation',
      availability: 'UNAVAILABLE',
      message:
        'AdaptationLab engine & spoiler boundary are active; no automated scene or chapter alignment is fabricated in production.',
      curationMode: 'CLI_ONLY',
      recordsCount: 0,
    }),
  );

  typedApp.get(
    '/api/v1/lore/:workId/graph',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get spoiler-filtered LoreGraph for a work/media/version',
        params: Type.Object({ workId: Type.String({ minLength: 1, maxLength: 80 }) }),
        querystring: LoreScopeQuerySchema,
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) {
        return {
          workId: request.params.workId,
          media,
          version,
          appliedMaxPosition: request.query.progress ?? 0,
          spoilersUnlocked: Boolean(request.query.allowSpoilers),
          notice: 'No published LoreGraph data available for this work/media/version.',
          events: [],
          entities: [],
          relations: [],
        };
      }
      return filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
    },
  );

  typedApp.get(
    '/api/v1/lore/:workId/events/:eventId',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'Get a single LoreGraph event if published and within spoiler boundary (otherwise 404)',
        params: Type.Object({
          workId: Type.String({ minLength: 1, maxLength: 80 }),
          eventId: Type.String({ minLength: 1, maxLength: 80 }),
        }),
        querystring: LoreScopeQuerySchema,
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) {
        throw new AppHttpError(404, 'LORE_EVENT_NOT_FOUND', 'Not Found', 'Event not found.');
      }
      const filtered = filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
      const found = filtered.events.find((e) => e.id === request.params.eventId);
      if (!found) {
        throw new AppHttpError(404, 'LORE_EVENT_NOT_FOUND', 'Not Found', 'Event not found.');
      }
      return found;
    },
  );

  typedApp.get(
    '/api/v1/lore/:workId/search',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Search spoiler-filtered LoreGraph events without leaking future events',
        params: Type.Object({ workId: Type.String({ minLength: 1, maxLength: 80 }) }),
        querystring: Type.Intersect([
          LoreScopeQuerySchema,
          Type.Object({ q: Type.String({ minLength: 1, maxLength: 100 }) }),
        ]),
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) return { items: [] };
      const filtered = filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
      const needle = request.query.q.trim().toLowerCase();
      return {
        items: filtered.events.filter(
          (e) => e.title.toLowerCase().includes(needle) || e.summary.toLowerCase().includes(needle),
        ),
      };
    },
  );
}
