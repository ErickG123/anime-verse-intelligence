import { describe, expect, it } from 'vitest';
import type {
  AnimeDetailDto,
  AnimeSummaryDto,
  CompanySummaryDto,
  PaginatedResponse,
  RelatedAnimeItemDto,
  StatisticsOverviewDto,
} from '@animeverse/contracts';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import type { CatalogRepository } from '../src/modules/catalog/repository.js';

const SAMPLE_ANIME_ID = '11111111-1111-4111-8111-111111111111';
const SAMPLE_STUDIO_ID = '22222222-2222-4222-8222-222222222222';

function createStubCatalogRepo(): CatalogRepository {
  const summary: AnimeSummaryDto = {
    id: SAMPLE_ANIME_ID,
    title: 'Cowboy Bebop',
    type: 'TV',
    episodes: 26,
    status: 'FINISHED',
    season: 'SPRING',
    seasonYear: 1998,
    scoreArithmeticMean: 8.75,
    thumbnailUrl: null,
    studios: ['Sunrise'],
    tags: ['sci-fi'],
    updatedAt: '2026-11-23T00:00:00.000Z',
  };

  const detail: AnimeDetailDto = {
    ...summary,
    durationSeconds: 1440,
    scoreMedian: 8.8,
    pictureUrl: null,
    aliases: ['Bebop'],
    companies: [{ id: SAMPLE_STUDIO_ID, name: 'Sunrise', role: 'STUDIO' }],
    externalReferences: [
      {
        provider: 'myanimelist',
        externalId: '1',
        normalizedUrl: 'https://myanimelist.net/anime/1',
      },
    ],
    relatedCount: 1,
    provenance: {
      sourceSlug: 'anime-offline-database',
      sourceName: 'cedya77/anime-offline-database',
      license: 'ODbL 1.0 / DbCL 1.0',
      snapshotVersion: '2026-11-20',
      lastImportedAt: '2026-11-23T00:00:00.000Z',
    },
  };

  return {
    async searchAnime(params): Promise<PaginatedResponse<AnimeSummaryDto>> {
      const items = params.q === 'empty' ? [] : [summary];
      return {
        items,
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total: items.length,
          totalPages: items.length > 0 ? 1 : 0,
        },
      };
    },
    async getAnimeById(id) {
      return id === SAMPLE_ANIME_ID ? detail : null;
    },
    async getRelatedAnime(id): Promise<RelatedAnimeItemDto[] | null> {
      if (id !== SAMPLE_ANIME_ID) return null;
      return [
        {
          id: '33333333-3333-4333-8333-333333333333',
          title: 'Cowboy Bebop: Tengoku no Tobira',
          type: 'MOVIE',
          seasonYear: 2001,
          relationType: 'UNSPECIFIED',
        },
      ];
    },
    async listCompanies(params): Promise<PaginatedResponse<CompanySummaryDto>> {
      return {
        items: [
          { id: SAMPLE_STUDIO_ID, name: 'Sunrise', role: params.role ?? 'STUDIO', animeCount: 1 },
        ],
        pagination: { page: params.page, pageSize: params.pageSize, total: 1, totalPages: 1 },
      };
    },
    async getCompanyAnime(companyId, page, pageSize) {
      if (companyId !== SAMPLE_STUDIO_ID) return null;
      return { items: [summary], pagination: { page, pageSize, total: 1, totalPages: 1 } };
    },
    async getStatisticsOverview(): Promise<StatisticsOverviewDto> {
      return {
        totalAnime: 1,
        totalStudios: 1,
        totalProducers: 0,
        totalRelationships: 1,
        lastSnapshotVersion: '2026-11-20',
        lastImportedAt: '2026-11-23T00:00:00.000Z',
      };
    },
  };
}

describe('Catalog API (/api/v1/anime, /studios, /statistics)', () => {
  it('lists paginated anime, rejects invalid sortBy and pageSize > 100 with 400 Problem Details', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      catalogRepository: createStubCatalogRepo(),
    });

    const ok = await app.inject({
      method: 'GET',
      url: '/api/v1/anime?q=bebop&sortBy=year&sortOrder=desc',
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().items).toHaveLength(1);
    expect(ok.json().pagination.total).toBe(1);

    const invalidSort = await app.inject({ method: 'GET', url: '/api/v1/anime?sortBy=DROP_TABLE' });
    expect(invalidSort.statusCode).toBe(400);
    expect(invalidSort.json().code).toBe('VALIDATION_ERROR');

    const invalidSize = await app.inject({ method: 'GET', url: '/api/v1/anime?pageSize=500' });
    expect(invalidSize.statusCode).toBe(400);

    const empty = await app.inject({ method: 'GET', url: '/api/v1/anime?q=empty' });
    expect(empty.statusCode).toBe(200);
    expect(empty.json().items).toEqual([]);
    await app.close();
  });

  it('returns anime detail, UNSPECIFIED related works, 400 on bad UUID and 404 when missing', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      catalogRepository: createStubCatalogRepo(),
    });

    const detail = await app.inject({ method: 'GET', url: `/api/v1/anime/${SAMPLE_ANIME_ID}` });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().provenance.sourceSlug).toBe('anime-offline-database');

    const related = await app.inject({
      method: 'GET',
      url: `/api/v1/anime/${SAMPLE_ANIME_ID}/related`,
    });
    expect(related.statusCode).toBe(200);
    expect(related.json().items[0].relationType).toBe('UNSPECIFIED');

    const badUuid = await app.inject({ method: 'GET', url: '/api/v1/anime/not-a-uuid' });
    expect(badUuid.statusCode).toBe(400);

    const missing = await app.inject({
      method: 'GET',
      url: '/api/v1/anime/99999999-9999-4999-8999-999999999999',
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().code).toBe('ANIME_NOT_FOUND');
    await app.close();
  });

  it('returns studios, studio anime and overview statistics', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      catalogRepository: createStubCatalogRepo(),
    });

    const studios = await app.inject({ method: 'GET', url: '/api/v1/studios' });
    expect(studios.statusCode).toBe(200);
    expect(studios.json().items[0].name).toBe('Sunrise');

    const studioAnime = await app.inject({
      method: 'GET',
      url: `/api/v1/studios/${SAMPLE_STUDIO_ID}/anime`,
    });
    expect(studioAnime.statusCode).toBe(200);
    expect(studioAnime.json().items[0].title).toBe('Cowboy Bebop');

    const stats = await app.inject({ method: 'GET', url: '/api/v1/statistics/overview' });
    expect(stats.statusCode).toBe(200);
    expect(stats.json().totalAnime).toBe(1);
    await app.close();
  });
});
