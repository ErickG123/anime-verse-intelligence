import type { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { AppHttpError } from '../../plugins/problem-details.js';
import type { CatalogRepository } from './repository.js';
import {
  AnimeDetailSchema,
  CatalogQuerySchema,
  PaginatedAnimeSchema,
  PaginatedCompaniesSchema,
  RelatedAnimeResponseSchema,
  StatisticsOverviewSchema,
  StudiosQuerySchema,
  UuidParamSchema,
} from './schemas.js';
import { Type } from '@sinclair/typebox';

export async function registerCatalogRoutes(
  app: FastifyInstance,
  repo?: CatalogRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  const requireRepo = (): CatalogRepository => {
    if (!repo) {
      throw new AppHttpError(
        503,
        'DATABASE_UNAVAILABLE',
        'Service Unavailable',
        'Database connection is not configured for catalog queries.',
      );
    }
    return repo;
  };

  typedApp.get(
    '/api/v1/anime',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Search and filter imported anime catalog',
        querystring: CatalogQuerySchema,
        response: { 200: PaginatedAnimeSchema },
      },
    },
    async (request) => {
      const q = request.query;
      return requireRepo().searchAnime({
        q: q.q,
        type: q.type,
        status: q.status,
        season: q.season,
        year: q.year,
        tag: q.tag,
        studio: q.studio,
        producer: q.producer,
        sortBy: q.sortBy ?? 'title',
        sortOrder: q.sortOrder ?? 'asc',
        page: q.page ?? 1,
        pageSize: q.pageSize ?? 20,
      });
    },
  );

  typedApp.get(
    '/api/v1/anime/:id',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Get full anime details with provenance',
        params: UuidParamSchema,
        response: { 200: AnimeDetailSchema },
      },
    },
    async (request) => {
      const detail = await requireRepo().getAnimeById(request.params.id);
      if (!detail) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      }
      return detail;
    },
  );

  typedApp.get(
    '/api/v1/anime/:id/related',
    {
      schema: {
        tags: ['Relations'],
        summary: 'List related anime with UNSPECIFIED relation type',
        params: UuidParamSchema,
        response: { 200: RelatedAnimeResponseSchema },
      },
    },
    async (request) => {
      const items = await requireRepo().getRelatedAnime(request.params.id);
      if (!items) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      }
      return {
        animeId: request.params.id,
        notice:
          'Relationships are recorded as UNSPECIFIED because anime-offline-database does not classify relation direction or type.',
        items,
      };
    },
  );

  typedApp.get(
    '/api/v1/studios',
    {
      schema: {
        tags: ['Studios'],
        summary: 'List studios or producer companies with anime counts',
        querystring: StudiosQuerySchema,
        response: { 200: PaginatedCompaniesSchema },
      },
    },
    async (request) => {
      const q = request.query;
      return requireRepo().listCompanies({
        q: q.q,
        role: q.role ?? 'STUDIO',
        page: q.page ?? 1,
        pageSize: q.pageSize ?? 20,
      });
    },
  );

  typedApp.get(
    '/api/v1/studios/:id/anime',
    {
      schema: {
        tags: ['Studios'],
        summary: 'List anime associated with a studio/company',
        params: UuidParamSchema,
        querystring: Type.Object({
          page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
          pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        }),
        response: { 200: PaginatedAnimeSchema },
      },
    },
    async (request) => {
      const res = await requireRepo().getCompanyAnime(
        request.params.id,
        request.query.page ?? 1,
        request.query.pageSize ?? 20,
      );
      if (!res) {
        throw new AppHttpError(404, 'COMPANY_NOT_FOUND', 'Not Found', 'Company not found.');
      }
      return res;
    },
  );

  typedApp.get(
    '/api/v1/statistics/overview',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Get real overview counts of imported catalog',
        response: { 200: StatisticsOverviewSchema },
      },
    },
    async () => requireRepo().getStatisticsOverview(),
  );
}
