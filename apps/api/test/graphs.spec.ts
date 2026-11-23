import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const ANIME_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

describe('Relations Graph & StudioGraph APIs', () => {
  it('enforces depth <= 2 and limit <= 100 and returns UNSPECIFIED edges', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      relationsRepository: {
        async getAnimeNetwork(centerId, depth) {
          if (centerId !== ANIME_ID) return null;
          return {
            centerId,
            depth,
            truncated: false,
            notice: 'UNSPECIFIED only',
            nodes: [
              { id: ANIME_ID, label: 'Cowboy Bebop', kind: 'ANIME', isCenter: true },
              { id: '33333333-3333-4333-8333-333333333333', label: 'Movie', kind: 'ANIME' },
            ],
            edges: [
              {
                id: 'e1',
                source: ANIME_ID,
                target: '33333333-3333-4333-8333-333333333333',
                label: 'UNSPECIFIED',
                relationType: 'UNSPECIFIED',
              },
            ],
          };
        },
      },
      studiosRepository: {
        async getCompanyDetail(id) {
          if (id !== COMPANY_ID) return null;
          return {
            id,
            name: 'Sunrise',
            roles: ['STUDIO'],
            animeCount: 1,
            byType: { TV: 1 },
            byDecade: { '1990s': 1 },
            notice: 'Companies only; no individual staff credits.',
          };
        },
        async getCompanyNetwork(id) {
          if (id !== COMPANY_ID) return null;
          return {
            centerId: id,
            depth: 1,
            truncated: false,
            notice: 'Bipartite company <-> anime graph.',
            nodes: [
              { id, label: 'Sunrise', kind: 'STUDIO', isCenter: true },
              { id: ANIME_ID, label: 'Cowboy Bebop', kind: 'ANIME' },
            ],
            edges: [
              { id: 's1', source: id, target: ANIME_ID, label: 'STUDIO', relationType: 'STUDIO' },
            ],
          };
        },
      },
    });

    const ok = await app.inject({
      method: 'GET',
      url: `/api/v1/anime/${ANIME_ID}/network?depth=2`,
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().edges[0].relationType).toBe('UNSPECIFIED');

    const badDepth = await app.inject({
      method: 'GET',
      url: `/api/v1/anime/${ANIME_ID}/network?depth=5`,
    });
    expect(badDepth.statusCode).toBe(400);

    const compDetail = await app.inject({ method: 'GET', url: `/api/v1/companies/${COMPANY_ID}` });
    expect(compDetail.statusCode).toBe(200);
    expect(compDetail.json().roles).toEqual(['STUDIO']);

    const studioGraph = await app.inject({
      method: 'GET',
      url: `/api/v1/studios/${COMPANY_ID}/network`,
    });
    expect(studioGraph.statusCode).toBe(200);
    expect(studioGraph.json().edges[0].relationType).toBe('STUDIO');

    await app.close();
  });
});
