import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { AniListClient } from '../src/modules/integrations/anilist/client.js';
import { evaluateTitleMatchSuggestions } from '../src/modules/integrations/anilist/identity-resolver.js';
import { sanitizeExternalText } from '../src/modules/integrations/anilist/mapper.js';
import { AniListIntegrationService } from '../src/modules/integrations/anilist/service.js';

const ANIME_ID = '11111111-1111-4111-8111-111111111111';
const UNLINKED_ID = '22222222-2222-4222-8222-222222222222';

function createMockResolver() {
  return {
    async resolveByAnimeId(id: string) {
      if (id === ANIME_ID) {
        return {
          animeId: ANIME_ID,
          animeTitle: 'Cowboy Bebop',
          anilistId: 1,
          siteUrl: 'https://anilist.co/anime/1',
          confidence: 'EXACT_EXTERNAL_ID' as const,
        };
      }
      if (id === UNLINKED_ID) {
        return {
          animeId: UNLINKED_ID,
          animeTitle: 'Unlinked Work',
          anilistId: null,
          siteUrl: null,
          confidence: 'UNLINKED' as const,
        };
      }
      return null;
    },
  };
}

describe('AniList GraphQL Integration — Identity, Mapping, Resilience & Endpoints', () => {
  it('flags remakes and ambiguous title matches instead of auto-linking', () => {
    const ambiguous = evaluateTitleMatchSuggestions(
      { title: 'Fullmetal Alchemist', type: 'TV', seasonYear: null },
      [
        { anilistId: 121, title: 'Fullmetal Alchemist', format: 'TV', seasonYear: 2003 },
        {
          anilistId: 5114,
          title: 'Fullmetal Alchemist: Brotherhood',
          format: 'TV',
          seasonYear: 2009,
        },
      ],
    );
    expect(ambiguous.status).toBe('AMBIGUOUS');

    const movieVsTv = evaluateTitleMatchSuggestions(
      { title: 'Cowboy Bebop', type: 'MOVIE', seasonYear: 2001 },
      [{ anilistId: 1, title: 'Cowboy Bebop', format: 'TV', seasonYear: 1998 }],
    );
    expect(movieVsTv.status).toBe('NO_MATCH');

    const single = evaluateTitleMatchSuggestions(
      { title: 'Cowboy Bebop', type: 'TV', seasonYear: 1998 },
      [{ anilistId: 1, title: 'Cowboy Bebop', format: 'TV', seasonYear: 1998 }],
    );
    expect(single.status).toBe('SUGGESTED');
  });

  it('sanitizes external HTML content to prevent XSS', () => {
    expect(sanitizeExternalText('<b>Spike</b> <script>alert(1)</script> Spiegel')).toBe(
      'Spike alert(1) Spiegel',
    );
  });

  it('returns DISABLED gracefully when ENRICHMENT_ANILIST_ENABLED=false without calling network', async () => {
    let called = false;
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', ENRICHMENT_ANILIST_ENABLED: 'false' }),
      checkDatabase: async () => true,
      anilistIdentityResolver: createMockResolver(),
      anilistFetchImpl: async () => {
        called = true;
        return new Response('{}', { status: 200 });
      },
    });

    const status = await app.inject({
      method: 'GET',
      url: `/api/v1/anime/${ANIME_ID}/external-status`,
    });
    expect(status.statusCode).toBe(200);
    expect(status.json().enabled).toBe(false);
    expect(status.json().storagePolicy).toBe('TRANSIENT_MEMORY_ONLY');

    const chars = await app.inject({ method: 'GET', url: `/api/v1/anime/${ANIME_ID}/characters` });
    expect(chars.statusCode).toBe(200);
    expect(chars.json().state).toBe('DISABLED');
    expect(called).toBe(false);

    await app.close();
  });

  it('maps characters, voice actors, staff roles, studios, StudioGraph expansion and caches transiently', async () => {
    let fetchCalls = 0;
    const mockFetch: typeof fetch = async (_url, init) => {
      fetchCalls += 1;
      const body = JSON.parse(String(init?.body ?? '{}')) as { query: string };

      if (body.query.includes('MediaCharacters')) {
        return new Response(
          JSON.stringify({
            data: {
              Media: {
                id: 1,
                characters: {
                  pageInfo: { currentPage: 1, perPage: 15, hasNextPage: true, total: 50 },
                  edges: [
                    {
                      role: 'MAIN',
                      node: { id: 1, name: { full: 'Spike Spiegel', alternative: ['Spikey'] } },
                      voiceActors: [
                        { id: 95011, name: { full: 'Kouichi Yamadera' }, languageV2: 'Japanese' },
                      ],
                    },
                  ],
                },
              },
            },
          }),
          { status: 200, headers: { 'x-ratelimit-remaining': '24' } },
        );
      }

      if (body.query.includes('MediaStaff')) {
        return new Response(
          JSON.stringify({
            data: {
              Media: {
                id: 1,
                staff: {
                  pageInfo: { currentPage: 1, perPage: 20, hasNextPage: false, total: 1 },
                  edges: [
                    {
                      role: 'Director',
                      node: { id: 97009, name: { full: 'Shinichirou Watanabe' } },
                    },
                  ],
                },
              },
            },
          }),
          { status: 200 },
        );
      }

      if (body.query.includes('MediaStudios')) {
        return new Response(
          JSON.stringify({
            data: {
              Media: {
                id: 1,
                studios: {
                  edges: [
                    { isMain: true, node: { id: 14, name: 'Sunrise', isAnimationStudio: true } },
                  ],
                },
              },
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            Media: {
              id: 1,
              siteUrl: 'https://anilist.co/anime/1',
              format: 'TV',
              status: 'FINISHED',
              description: '<i>Space bounty hunters</i>',
              isAdult: false,
              externalLinks: [{ site: 'Official Site', url: 'https://sunrise-inc.co.jp' }],
            },
          },
        }),
        { status: 200 },
      );
    };

    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', ENRICHMENT_ANILIST_ENABLED: 'true' }),
      checkDatabase: async () => true,
      anilistIdentityResolver: createMockResolver(),
      anilistFetchImpl: mockFetch,
    });

    const chars1 = await app.inject({ method: 'GET', url: `/api/v1/anime/${ANIME_ID}/characters` });
    expect(chars1.statusCode).toBe(200);
    expect(chars1.json().items[0].name).toBe('Spike Spiegel');
    expect(chars1.json().items[0].voiceActors[0].name).toBe('Kouichi Yamadera');
    expect(chars1.json().pageInfo.hasNextPage).toBe(true);

    // Second call hits transient memory cache
    const chars2 = await app.inject({ method: 'GET', url: `/api/v1/anime/${ANIME_ID}/characters` });
    expect(chars2.statusCode).toBe(200);
    expect(fetchCalls).toBe(1);

    const graph = await app.inject({
      method: 'GET',
      url: `/api/v1/anime/${ANIME_ID}/studio-graph-staff?limit=10`,
    });
    expect(graph.statusCode).toBe(200);
    expect(graph.json().nodes.some((n: { kind: string }) => n.kind === 'PERSON')).toBe(true);
    expect(graph.json().edges.some((e: { label: string }) => e.label === 'Director')).toBe(true);

    const unlinked = await app.inject({ method: 'GET', url: `/api/v1/anime/${UNLINKED_ID}/staff` });
    expect(unlinked.statusCode).toBe(200);
    expect(unlinked.json().state).toBe('UNLINKED');

    const metrics = await app.inject({
      method: 'GET',
      url: '/api/v1/data-sources/anilist/metrics',
    });
    expect(metrics.statusCode).toBe(200);
    expect(metrics.json().cacheHits).toBeGreaterThanOrEqual(1);
    expect(metrics.json().rateLimitRemaining).toBe(24);

    await app.close();
  });

  it('handles HTTP 429 Retry-After, 403, 500, GraphQL errors, malformed JSON, and circuit breaker cleanly', async () => {
    const baseCfg = {
      enabled: true,
      endpoint: 'https://graphql.anilist.co',
      timeoutMs: 1000,
      maxRequestsPerMinute: 25,
      maxConcurrent: 2,
      maxRetries: 0,
      cacheTtlMs: 10_000,
      cacheMaxEntries: 10,
    };

    const rateLimited = new AniListClient(
      baseCfg,
      async () => new Response(null, { status: 429, headers: { 'retry-after': '45' } }),
    );
    const r429 = await rateLimited.execute('k1', 'query {}', {});
    expect(r429.ok).toBe(false);
    if (!r429.ok) {
      expect(r429.kind).toBe('RATE_LIMITED');
      expect(r429.retryAfterSeconds).toBe(45);
    }

    const forbidden = new AniListClient(baseCfg, async () => new Response(null, { status: 403 }));
    const r403 = await forbidden.execute('k2', 'query {}', {});
    expect(r403.ok).toBe(false);
    if (!r403.ok) expect(r403.kind).toBe('FORBIDDEN');

    const gqlErr = new AniListClient(
      baseCfg,
      async () =>
        new Response(JSON.stringify({ errors: [{ message: 'Not Found' }] }), { status: 200 }),
    );
    const rGql = await gqlErr.execute('k3', 'query {}', {});
    expect(rGql.ok).toBe(false);
    if (!rGql.ok) expect(rGql.kind).toBe('GRAPHQL_ERROR');

    const badJson = new AniListClient(
      baseCfg,
      async () => new Response('{broken', { status: 200 }),
    );
    const rBad = await badJson.execute('k4', 'query {}', {});
    expect(rBad.ok).toBe(false);
    if (!rBad.ok) expect(rBad.kind).toBe('INVALID_PAYLOAD');

    const svc = new AniListIntegrationService(
      new AniListClient(baseCfg, async () => new Response(null, { status: 500 })),
      createMockResolver(),
    );
    const r500 = await svc.getMediaOverview(ANIME_ID);
    expect(r500?.state).toBe('UNAVAILABLE');
  });
});
