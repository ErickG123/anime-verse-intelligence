import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import {
  importCurationBatch,
  type CurationBatch,
} from '../modules/editorial-governance/curation-importer.js';

function parseArgs(argv: string[]): { file: string; dryRun: boolean } {
  let file = '';
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--file' && next) {
      file = path.resolve(next);
      i += 1;
    } else if (token === '--dry-run') {
      dryRun = true;
    }
  }

  if (!file) {
    throw new Error('Usage: curation-import --file <path-to-json> [--dry-run]');
  }
  return { file, dryRun };
}

async function main(): Promise<void> {
  const { file, dryRun } = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const raw = await fs.readFile(file, 'utf-8');
  const batch = JSON.parse(raw) as CurationBatch;
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const summary = await importCurationBatch(pool, batch, { dryRun });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
