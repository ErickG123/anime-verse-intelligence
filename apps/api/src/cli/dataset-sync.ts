import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { desc, eq } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { dataSource, sourceSnapshot } from '../db/schema.js';
import { computeFileSha256 } from '../modules/ingestion/jsonl-parser.js';
import { importAnimeOfflineJsonl } from '../modules/ingestion/importer.js';

interface GithubReleaseResponse {
  tag_name: string;
  published_at: string;
  assets: Array<{ name: string; size: number; browser_download_url: string }>;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes('--check-only');
  const force = argv.includes('--force');
  const localFile = path.resolve(process.cwd(), 'data/anime-offline-database.jsonl');

  const res = await fetch(
    'https://api.github.com/repos/cedya77/anime-offline-database/releases/latest',
    { headers: { 'User-Agent': 'AnimeVerse-Intelligence-CLI/0.1' } },
  );
  if (!res.ok) {
    throw new Error(`GitHub releases API returned HTTP ${res.status}`);
  }
  const latest = (await res.json()) as GithubReleaseResponse;
  const asset = latest.assets.find((a) => a.name === 'anime-offline-database.jsonl');
  if (!asset) {
    throw new Error(`Release ${latest.tag_name} does not contain anime-offline-database.jsonl`);
  }

  const databaseUrl = process.env['DATABASE_URL'];
  let currentVersion: string | null = null;
  let currentSha256: string | null = null;

  if (databaseUrl) {
    const dbHandle = createDatabase(databaseUrl);
    try {
      const [src] = await dbHandle.db
        .select({ id: dataSource.id })
        .from(dataSource)
        .where(eq(dataSource.slug, 'anime-offline-database'))
        .limit(1);
      if (src) {
        const [snap] = await dbHandle.db
          .select({ versionLabel: sourceSnapshot.versionLabel, sha256: sourceSnapshot.sha256 })
          .from(sourceSnapshot)
          .where(eq(sourceSnapshot.dataSourceId, src.id))
          .orderBy(desc(sourceSnapshot.createdAt))
          .limit(1);
        currentVersion = snap?.versionLabel ?? null;
        currentSha256 = snap?.sha256 ?? null;
      }
    } finally {
      await dbHandle.close();
    }
  }

  const upToDate = currentVersion === latest.tag_name;
  console.log(
    JSON.stringify(
      {
        source: 'anime-offline-database',
        latestRelease: latest.tag_name,
        publishedAt: latest.published_at,
        assetSizeBytes: asset.size,
        importedVersion: currentVersion,
        importedSha256: currentSha256,
        upToDate,
        action: checkOnly ? 'check-only' : upToDate && !force ? 'skipped-up-to-date' : 'import',
      },
      null,
      2,
    ),
  );

  if (checkOnly || (upToDate && !force)) {
    return;
  }

  let hasLocal = false;
  try {
    await fs.access(localFile);
    hasLocal = true;
  } catch {
    hasLocal = false;
  }

  if (!hasLocal) {
    throw new Error(
      `Local dataset file not found at ${localFile}. Run dataset:download first to fetch release ${latest.tag_name}.`,
    );
  }

  const sha = await computeFileSha256(localFile);
  if (sha === currentSha256 && !force) {
    console.log(JSON.stringify({ message: 'Local file SHA-256 already imported.', sha256: sha }));
    return;
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to import.');
  }

  const dbHandle = createDatabase(databaseUrl);
  try {
    const report = await importAnimeOfflineJsonl(dbHandle.db, localFile);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await dbHandle.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
