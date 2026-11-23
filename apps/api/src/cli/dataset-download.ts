import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { validateSafeDownloadUrl } from '../modules/sources/url-normalizer.js';
import { computeFileSha256, parseMetadataLine } from '../modules/ingestion/jsonl-parser.js';
import { DATA_SOURCE_REGISTRY } from '../modules/sources/source-registry.js';

interface DownloadArgs {
  url: string;
  out: string;
  localFile?: string;
  dryRun: boolean;
  timeoutMs: number;
  maxBytes: number;
}

function parseArgs(argv: string[]): DownloadArgs {
  const defaultSource = DATA_SOURCE_REGISTRY.find((s) => s.sourceId === 'anime-offline-database');
  const args: DownloadArgs = {
    url: defaultSource?.endpoint ?? '',
    out: path.resolve(process.cwd(), 'data/anime-offline-database.jsonl'),
    dryRun: false,
    timeoutMs: 30_000,
    maxBytes: 250 * 1024 * 1024,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--url' && next) {
      args.url = next;
      i += 1;
    } else if (token === '--out' && next) {
      args.out = path.resolve(next);
      i += 1;
    } else if (token === '--file' && next) {
      args.localFile = path.resolve(next);
      i += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--timeout' && next) {
      args.timeoutMs = Number(next);
      i += 1;
    } else if (token === '--max-bytes' && next) {
      args.maxBytes = Number(next);
      i += 1;
    }
  }
  return args;
}

async function fetchWithSafeRedirects(
  url: string,
  timeoutMs: number,
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = url;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const safeUrl = validateSafeDownloadUrl(currentUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(safeUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'AnimeVerse-Intelligence-CLI/0.1' },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Redirect (${response.status}) without Location header.`);
        }
        currentUrl = new URL(location, safeUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`Download failed with HTTP ${response.status}`);
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Exceeded maximum redirect count (${maxRedirects}).`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.localFile) {
    const sha256 = await computeFileSha256(args.localFile);
    const firstChunk = (await fs.readFile(args.localFile, 'utf-8')).split(/\r?\n/, 1)[0] ?? '';
    const metadata = parseMetadataLine(firstChunk);
    console.log(
      JSON.stringify({ mode: 'local-verify', file: args.localFile, sha256, metadata }, null, 2),
    );
    return;
  }

  const safeUrl = validateSafeDownloadUrl(args.url);
  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          url: safeUrl.toString(),
          out: args.out,
          timeoutMs: args.timeoutMs,
          maxBytes: args.maxBytes,
        },
        null,
        2,
      ),
    );
    return;
  }

  const response = await fetchWithSafeRedirects(safeUrl.toString(), args.timeoutMs);
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > args.maxBytes) {
    throw new Error(`Remote file size (${contentLength}) exceeds maxBytes (${args.maxBytes}).`);
  }

  await fs.mkdir(path.dirname(args.out), { recursive: true });
  if (!response.body) {
    throw new Error('Empty response body.');
  }
  const nodeStream = Readable.fromWeb(response.body as never);
  await pipeline(nodeStream, createWriteStream(args.out));

  const sha256 = await computeFileSha256(args.out);
  console.log(
    JSON.stringify(
      {
        mode: 'downloaded',
        out: args.out,
        etag: response.headers.get('etag'),
        sha256,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
