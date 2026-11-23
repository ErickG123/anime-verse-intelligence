import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createDatabase } from '../db/client.js';
import { importAnimeOfflineJsonl, type ImportReport } from '../modules/ingestion/importer.js';

function parseArgs(argv: string[]): {
  filePath: string;
  dryRun: boolean;
  reportJson?: string;
  reportMd?: string;
} {
  let filePath = '';
  let dryRun = false;
  let reportJson: string | undefined;
  let reportMd: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--file' && next) {
      filePath = path.resolve(next);
      i += 1;
    } else if (token === '--dry-run') {
      dryRun = true;
    } else if (token === '--report-json' && next) {
      reportJson = path.resolve(next);
      i += 1;
    } else if (token === '--report-md' && next) {
      reportMd = path.resolve(next);
      i += 1;
    }
  }

  if (!filePath) {
    throw new Error(
      'Usage: pnpm --filter @animeverse/api dataset:import -- --file <path> [--dry-run] [--report-json <path>] [--report-md <path>]',
    );
  }
  return { filePath, dryRun, reportJson, reportMd };
}

function formatReportMarkdown(report: ImportReport): string {
  return [
    `# Import Report — ${report.source} (${report.release ?? 'unknown'})`,
    '',
    `- **Status:** ${report.status}`,
    `- **Run ID:** \`${report.runId}\``,
    `- **Snapshot ID:** \`${report.snapshotId}\``,
    `- **SHA-256:** \`${report.sha256}\``,
    `- **Duration:** ${report.durationMs} ms (${report.recordsPerSecond} records/s, peak RSS ${report.peakMemoryMb} MB)`,
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| totalRecords | ${report.totalRecords} |`,
    `| validRecords | ${report.validRecords} |`,
    `| createdCount | ${report.createdCount} |`,
    `| updatedCount | ${report.updatedCount} |`,
    `| unchangedCount | ${report.unchangedCount} |`,
    `| rejectedCount | ${report.rejectedCount} |`,
    `| duplicateCount | ${report.duplicateCount} |`,
    `| conflictCount | ${report.conflictCount} |`,
    `| relationsCreated | ${report.relationsCreated} |`,
    `| relationsUnchanged | ${report.relationsUnchanged} |`,
    `| relationsPending | ${report.relationsPending} |`,
    `| unexpectedErrors | ${report.unexpectedErrors} |`,
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const { filePath, dryRun, reportJson, reportMd } = parseArgs(process.argv.slice(2));

  let report: ImportReport;
  if (dryRun) {
    report = await importAnimeOfflineJsonl(null as never, filePath, { dryRun: true });
  } else {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set to import into PostgreSQL.');
    }

    const dbHandle = createDatabase(databaseUrl);
    try {
      report = await importAnimeOfflineJsonl(dbHandle.db, filePath, { dryRun: false });
    } finally {
      await dbHandle.close();
    }
  }

  if (reportJson) {
    await fs.mkdir(path.dirname(reportJson), { recursive: true });
    await fs.writeFile(reportJson, JSON.stringify(report, null, 2), 'utf-8');
  }
  if (reportMd) {
    await fs.mkdir(path.dirname(reportMd), { recursive: true });
    await fs.writeFile(reportMd, formatReportMarkdown(report), 'utf-8');
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
