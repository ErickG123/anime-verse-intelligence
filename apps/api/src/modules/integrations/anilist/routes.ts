import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { AppHttpError } from '../../../plugins/problem-details.js';
import type { AniListIntegrationService } from './service.js';

const UuidParamSchema = Type.Object({ id: Type.String({ format: 'uuid' }) });
const PagedQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  perPage: Type.Optional(Type.Integer({ minimum: 1, maximum: 25, default: 15 })),
});

export async function registerAniListRoutes(
  app: FastifyInstance,
  service: AniListIntegrationService,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/anime/:id/external-status',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get AniList external link and integration status for an anime',
        params: UuidParamSchema,
      },
    },
    async (request) => {
      const res = await service.getExternalStatus(request.params.id);
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/external/anilist',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Query on-demand AniList overview metadata (not permanently stored)',
        params: UuidParamSchema,
      },
    },
    async (request) => {
      const res = await service.getMediaOverview(request.params.id);
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/characters',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Query on-demand paginated characters and voice actors from AniList',
        params: UuidParamSchema,
        querystring: PagedQuerySchema,
      },
    },
    async (request) => {
      const res = await service.getCharacters(
        request.params.id,
        request.query.page ?? 1,
        request.query.perPage ?? 15,
      );
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/staff',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Query on-demand paginated production staff and roles from AniList',
        params: UuidParamSchema,
        querystring: PagedQuerySchema,
      },
    },
    async (request) => {
      const res = await service.getStaff(
        request.params.id,
        request.query.page ?? 1,
        request.query.perPage ?? 15,
      );
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/studios',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Query on-demand studios and main-studio flags from AniList',
        params: UuidParamSchema,
      },
    },
    async (request) => {
      const res = await service.getStudios(request.params.id);
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/studio-graph-staff',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Expand StudioGraph with bounded on-demand AniList staff & studios',
        params: UuidParamSchema,
        querystring: Type.Object({
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 30, default: 20 })),
        }),
      },
    },
    async (request) => {
      const res = await service.getStudioGraphStaffExpansion(
        request.params.id,
        request.query.limit ?? 20,
      );
      if (!res) throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      return res;
    },
  );

  typedApp.get(
    '/api/v1/data-sources/anilist/metrics',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get real session metrics for AniList on-demand integration',
      },
    },
    async () => service.getMetrics(),
  );
}
