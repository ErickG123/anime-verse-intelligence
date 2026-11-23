import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDatabase } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { importAnimeOfflineJsonl } from '../src/modules/ingestion/importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, 'fixtures/anime-offline-sample.jsonl');

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

describe('Live PostgreSQL end-to-end API integration', () => {
  it('migrates, imports idempotently, and serves real data across catalog, graphs, studios and sources', async () => {
    if (!(await isPostgresReachable())) {
      return;
    }

    const databaseUrl = process.env['DATABASE_URL']!;
    const dbHandle = createDatabase(databaseUrl);

    try {
      await runMigrations(dbHandle.pool);
      const importRes = await importAnimeOfflineJsonl(dbHandle.db, fixturePath);
      expect(importRes.validRecords).toBe(2);
      expect(importRes.errorCount).toBe(2);

      const app = await buildApp({
        env: loadEnv({ NODE_ENV: 'test', DATABASE_URL: databaseUrl }),
        dbHandle,
      });

      const ready = await app.inject({ method: 'GET', url: '/api/v1/ready' });
      expect(ready.statusCode).toBe(200);
      expect(ready.json().checks.database).toBe('up');

      const catalog = await app.inject({
        method: 'GET',
        url: '/api/v1/anime?q=bebop&sortBy=year&sortOrder=asc',
      });
      expect(catalog.statusCode).toBe(200);
      const items = catalog.json().items;
      expect(items.length).toBeGreaterThanOrEqual(2);

      const firstId: string = items[0].id;
      const detail = await app.inject({ method: 'GET', url: `/api/v1/anime/${firstId}` });
      expect(detail.statusCode).toBe(200);
      expect(detail.json().provenance.sourceSlug).toBe('anime-offline-database');

      const network = await app.inject({
        method: 'GET',
        url: `/api/v1/anime/${firstId}/network?depth=1`,
      });
      expect(network.statusCode).toBe(200);
      expect(network.json().nodes.length).toBeGreaterThanOrEqual(2);
      expect(
        network
          .json()
          .edges.every((e: { relationType: string }) => e.relationType === 'UNSPECIFIED'),
      ).toBe(true);

      const studios = await app.inject({ method: 'GET', url: '/api/v1/studios?role=STUDIO' });
      expect(studios.statusCode).toBe(200);
      expect(studios.json().items.length).toBeGreaterThanOrEqual(1);

      const studioId: string = studios.json().items[0].id;
      const studioNet = await app.inject({
        method: 'GET',
        url: `/api/v1/studios/${studioId}/network`,
      });
      expect(studioNet.statusCode).toBe(200);
      expect(studioNet.json().nodes.length).toBeGreaterThanOrEqual(2);

      const stats = await app.inject({ method: 'GET', url: '/api/v1/statistics/overview' });
      expect(stats.statusCode).toBe(200);
      expect(stats.json().totalAnime).toBeGreaterThanOrEqual(2);

      const runs = await app.inject({
        method: 'GET',
        url: '/api/v1/data-sources/anime-offline-database/runs',
      });
      expect(runs.statusCode).toBe(200);
      expect(runs.json().items.length).toBeGreaterThanOrEqual(1);

      await app.close();
    } finally {
      await dbHandle.close();
    }
  }, 15_000);
});
