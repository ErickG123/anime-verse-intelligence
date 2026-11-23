import { describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDatabase } from '../src/db/client.js';
import { parseTypedNodeId } from '../src/modules/studio-graph/repository.js';

async function isPostgresReachable(): Promise<boolean> {
  const url = process.env['DATABASE_URL'];
  if (!url) return false;
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 1500 });
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

describe('Phase 23: StudioGraph Advanced API (/api/v1/studio-graph)', () => {
  it('validates typed node IDs and rejects malformed IDs, reversed year range, and limit > 80', async () => {
    expect(parseTypedNodeId('anime:11111111-1111-4111-8111-111111111111')?.kind).toBe('ANIME');
    expect(parseTypedNodeId('studio:11111111-1111-4111-8111-111111111111')?.canonicalId).toBe(
      'company:11111111-1111-4111-8111-111111111111',
    );
    expect(parseTypedNodeId('invalid-id')).toBeNull();

    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', ENRICHMENT_ANILIST_ENABLED: 'false' }),
      checkDatabase: async () => true,
      studioGraphRepository: {
        async queryGraph() {
          return null;
        },
        async getNodeNeighbors() {
          return null;
        },
      },
    });

    const meta = await app.inject({ method: 'GET', url: '/api/v1/studio-graph/metadata' });
    expect(meta.statusCode).toBe(200);
    expect(meta.json().maxLimit).toBe(80);
    expect(meta.json().collaborationEnabled).toBe(false);

    const badId = await app.inject({
      method: 'GET',
      url: '/api/v1/studio-graph?anchorId=not-typed',
    });
    expect(badId.statusCode).toBe(400);
    expect(badId.json().code).toBe('INVALID_NODE_ID');

    const badYears = await app.inject({
      method: 'GET',
      url: '/api/v1/studio-graph?anchorId=company:11111111-1111-4111-8111-111111111111&yearFrom=2020&yearTo=1999',
    });
    expect(badYears.statusCode).toBe(400);
    expect(badYears.json().code).toBe('INVALID_YEAR_RANGE');

    const tooMany = await app.inject({
      method: 'GET',
      url: '/api/v1/studio-graph?anchorId=company:11111111-1111-4111-8111-111111111111&limit=200',
    });
    expect(tooMany.statusCode).toBe(400);

    const notFound = await app.inject({
      method: 'GET',
      url: '/api/v1/studio-graph?anchorId=company:99999999-9999-4999-8999-999999999999',
    });
    expect(notFound.statusCode).toBe(404);

    await app.close();
  });

  it('queries real PostgreSQL production graph with pagination, year filters, and incremental neighbor expansion', async () => {
    if (!(await isPostgresReachable())) return;

    const databaseUrl = process.env['DATABASE_URL']!;
    const dbHandle = createDatabase(databaseUrl);

    try {
      const app = await buildApp({
        env: loadEnv({
          NODE_ENV: 'test',
          DATABASE_URL: databaseUrl,
          ENRICHMENT_ANILIST_ENABLED: 'false',
        }),
        dbHandle,
      });

      const studios = await app.inject({
        method: 'GET',
        url: '/api/v1/studios?q=sunrise&role=STUDIO',
      });
      expect(studios.statusCode).toBe(200);
      const sunrise = studios.json().items[0];
      if (!sunrise) {
        await app.close();
        return;
      }

      const page1 = await app.inject({
        method: 'GET',
        url: `/api/v1/studio-graph?anchorId=company:${sunrise.id}&mode=PRODUCTION&role=STUDIO&yearFrom=1990&yearTo=2005&limit=10&offset=0`,
      });
      expect(page1.statusCode).toBe(200);
      const body1 = page1.json();
      expect(body1.anchorId).toBe(`company:${sunrise.id}`);
      expect(body1.nodes.length).toBeGreaterThanOrEqual(2);
      expect(body1.metrics.sourceScope).toContain('LOCAL_DB');

      const firstAnimeNode = body1.nodes.find((n: { kind: string }) => n.kind === 'ANIME');
      if (firstAnimeNode) {
        const neighbors = await app.inject({
          method: 'GET',
          url: `/api/v1/studio-graph/nodes/${encodeURIComponent(firstAnimeNode.id)}/neighbors?limit=15`,
        });
        expect(neighbors.statusCode).toBe(200);
        expect(neighbors.json().anchorId).toBe(firstAnimeNode.id);

        // Collaboration mode gracefully reports DISABLED while keeping local production links intact
        const collab = await app.inject({
          method: 'GET',
          url: `/api/v1/studio-graph?anchorId=${encodeURIComponent(firstAnimeNode.id)}&mode=COLLABORATION&limit=15`,
        });
        expect(collab.statusCode).toBe(200);
        expect(collab.json().externalState).toBe('DISABLED');
        expect(collab.json().nodes.length).toBeGreaterThanOrEqual(1);
      }

      await app.close();
    } finally {
      await dbHandle.close();
    }
  });
});
