import '../config/load-dotenv.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../drizzle');

export interface MigrationStatus {
  applied: string[];
  pending: string[];
}

export async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function listSqlMigrations(): Promise<string[]> {
  const entries = await fs.readdir(migrationsDir);
  return entries.filter((f) => f.endsWith('.sql')).sort();
}

export async function getMigrationStatus(pool: Pool): Promise<MigrationStatus> {
  await ensureMigrationsTable(pool);
  const files = await listSqlMigrations();
  const res = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC',
  );
  const appliedSet = new Set(res.rows.map((r) => r.filename));
  const applied = files.filter((f) => appliedSet.has(f));
  const pending = files.filter((f) => !appliedSet.has(f));
  return { applied, pending };
}

export async function runMigrations(pool: Pool): Promise<string[]> {
  const { pending } = await getMigrationStatus(pool);
  const executed: string[] = [];

  for (const filename of pending) {
    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      executed.push(filename);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return executed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const action = process.argv[2] ?? 'status';
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    if (action === 'up') {
      const executed = await runMigrations(pool);
      console.log(
        executed.length > 0
          ? `Applied migrations: ${executed.join(', ')}`
          : 'No pending migrations.',
      );
    } else if (action === 'status') {
      const status = await getMigrationStatus(pool);
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.error(`Unsupported action: ${action}. Use "up" or "status".`);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}
