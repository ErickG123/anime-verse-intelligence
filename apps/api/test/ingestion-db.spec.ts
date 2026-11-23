import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Pool } from 'pg';
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

describe('JSONL importer integration & idempotency metrics', () => {
  it('supports dry-run scan without database connection', async () => {
    const report = await importAnimeOfflineJsonl(null as never, fixturePath, { dryRun: true });
    expect(report.status).toBe('PARTIAL');
    expect(report.validRecords).toBe(2);
    expect(report.rejectedCount).toBe(2);
    expect(report.unexpectedErrors).toBe(0);
  });

  it('distinguishes created, updated, unchanged, rejected, and relation states in real PostgreSQL', async () => {
    if (!(await isPostgresReachable())) {
      return;
    }

    const dbHandle = createDatabase(process.env['DATABASE_URL']!);
    try {
      await runMigrations(dbHandle.pool);
      const first = await importAnimeOfflineJsonl(dbHandle.db, fixturePath);
      expect(first.validRecords).toBe(2);
      expect(first.rejectedCount).toBe(2);
      expect(first.unexpectedErrors).toBe(0);
      expect(first.relationsPending).toBeGreaterThanOrEqual(1);

      const second = await importAnimeOfflineJsonl(dbHandle.db, fixturePath);
      expect(second.createdCount).toBe(0);
      expect(second.updatedCount).toBe(0);
      expect(second.unchangedCount).toBe(2);
      expect(second.relationsCreated).toBe(0);
      expect(second.relationsUnchanged).toBe(2);
      expect(second.unexpectedErrors).toBe(0);
    } finally {
      await dbHandle.close();
    }
  });
});
