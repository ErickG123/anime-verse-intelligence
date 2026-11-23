import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../src/db/schema.js';
import { getMigrationStatus, listSqlMigrations, runMigrations } from '../src/db/migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

describe('Database schema & SQL migrations', () => {
  it('defines all normalized Drizzle tables with expected names', () => {
    const tableNames = [
      getTableName(schema.dataSource),
      getTableName(schema.sourceSnapshot),
      getTableName(schema.ingestionRun),
      getTableName(schema.anime),
      getTableName(schema.animeAlias),
      getTableName(schema.externalReference),
      getTableName(schema.company),
      getTableName(schema.animeCompany),
      getTableName(schema.tag),
      getTableName(schema.animeTag),
      getTableName(schema.animeRelationship),
      getTableName(schema.ingestionError),
      getTableName(schema.sourceEvidence),
      getTableName(schema.ingestionConflict),
    ];

    expect(tableNames).toEqual([
      'data_source',
      'source_snapshot',
      'ingestion_run',
      'anime',
      'anime_alias',
      'external_reference',
      'company',
      'anime_company',
      'tag',
      'anime_tag',
      'anime_relationship',
      'ingestion_error',
      'source_evidence',
      'ingestion_conflict',
    ]);
  });

  it('contains ordered SQL migration 0000_initial.sql with extensions, constraints and indexes', async () => {
    const migrations = await listSqlMigrations();
    expect(migrations).toContain('0000_initial.sql');

    const sqlPath = path.resolve(__dirname, '../drizzle/0000_initial.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS unaccent;');
    expect(sql).toContain("DEFAULT 'UNSPECIFIED'");
    expect(sql).toContain("CHECK (role IN ('STUDIO', 'PRODUCER'))");
    expect(sql).toContain('uq_external_ref_normalized_url');
    expect(sql).toContain('idx_anime_title_trgm');
  });

  it('runs migrations idempotently against real PostgreSQL when reachable', async () => {
    const reachable = await isPostgresReachable();
    if (!reachable) {
      // Live DB not reachable in this environment (e.g. Docker daemon stopped).
      // Reproducible test: start Docker Desktop -> `docker compose up -d postgres` -> re-run `pnpm test`.
      return;
    }

    const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
    try {
      await runMigrations(pool);
      const secondRun = await runMigrations(pool);
      expect(secondRun).toEqual([]);

      const status = await getMigrationStatus(pool);
      expect(status.applied).toContain('0000_initial.sql');
      expect(status.pending).toEqual([]);
    } finally {
      await pool.end();
    }
  });
});
