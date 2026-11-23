import crypto from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline';
import type { AnimeSeason, AnimeStatus, AnimeType } from '@animeverse/contracts';
import {
  normalizeExternalUrl,
  normalizeSearchText,
  type NormalizedExternalRef,
} from '../sources/url-normalizer.js';

export interface DatasetMetadataLine {
  $schema?: string;
  license?: { name?: string; url?: string };
  repository?: string;
  lastUpdate?: string;
  [key: string]: unknown;
}

export interface ParsedAnimeRecord {
  lineNumber: number;
  title: string;
  normalizedTitle: string;
  type: AnimeType;
  episodes: number | null;
  status: AnimeStatus;
  season: AnimeSeason;
  seasonYear: number | null;
  durationSeconds: number | null;
  scoreArithmeticMean: number | null;
  scoreMedian: number | null;
  pictureUrl: string | null;
  thumbnailUrl: string | null;
  synonyms: string[];
  studios: string[];
  producers: string[];
  tags: string[];
  sources: NormalizedExternalRef[];
  relatedUrls: string[];
}

export interface ParsedLineError {
  lineNumber: number;
  errorCode: string;
  message: string;
  payloadExcerpt: string;
}

const VALID_TYPES = new Set<AnimeType>(['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'UNKNOWN']);
const VALID_STATUSES = new Set<AnimeStatus>(['FINISHED', 'ONGOING', 'UPCOMING', 'UNKNOWN']);
const VALID_SEASONS = new Set<AnimeSeason>(['SPRING', 'SUMMER', 'FALL', 'WINTER', 'UNDEFINED']);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

function asNullableInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  return rounded >= 0 ? rounded : null;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function asNullableUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

export function extractReleaseLabel(metadata: DatasetMetadataLine): string | null {
  if (typeof metadata.$schema === 'string') {
    const tagMatch = metadata.$schema.match(/refs\/tags\/([^/]+)\//);
    if (tagMatch?.[1]) return tagMatch[1];
  }
  return metadata.lastUpdate ?? null;
}

export function parseMetadataLine(rawLine: string): DatasetMetadataLine {
  const parsed: unknown = JSON.parse(rawLine);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('First line of JSONL must be a JSON metadata object.');
  }
  const obj = parsed as Record<string, unknown>;
  if ('title' in obj && 'sources' in obj && !('lastUpdate' in obj) && !('repository' in obj)) {
    throw new Error(
      'First line appears to be an anime record instead of anime-offline-database metadata.',
    );
  }
  return obj as DatasetMetadataLine;
}

export function parseAnimeLine(
  rawLine: string,
  lineNumber: number,
): { ok: true; record: ParsedAnimeRecord } | { ok: false; error: ParsedLineError } {
  const excerpt = rawLine.slice(0, 240);
  let raw: unknown;
  try {
    raw = JSON.parse(rawLine);
  } catch (err) {
    return {
      ok: false,
      error: {
        lineNumber,
        errorCode: 'INVALID_JSON',
        message: err instanceof Error ? err.message : 'Malformed JSON line',
        payloadExcerpt: excerpt,
      },
    };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      error: {
        lineNumber,
        errorCode: 'INVALID_RECORD_TYPE',
        message: 'Record must be a JSON object.',
        payloadExcerpt: excerpt,
      },
    };
  }

  const obj = raw as Record<string, unknown>;
  const title = typeof obj['title'] === 'string' ? obj['title'].trim() : '';
  if (!title) {
    return {
      ok: false,
      error: {
        lineNumber,
        errorCode: 'MISSING_TITLE',
        message: 'Record is missing a non-empty title.',
        payloadExcerpt: excerpt,
      },
    };
  }

  const rawSources = asStringArray(obj['sources']);
  const dedupedSources = new Map<string, NormalizedExternalRef>();
  for (const url of rawSources) {
    const norm = normalizeExternalUrl(url);
    if (norm) {
      dedupedSources.set(norm.normalizedUrl, norm);
    }
  }

  if (dedupedSources.size === 0) {
    return {
      ok: false,
      error: {
        lineNumber,
        errorCode: 'MISSING_VALID_SOURCES',
        message: 'Record has no valid external source URLs for deterministic identity.',
        payloadExcerpt: excerpt,
      },
    };
  }

  const rawType = typeof obj['type'] === 'string' ? obj['type'].toUpperCase() : 'UNKNOWN';
  const type: AnimeType = VALID_TYPES.has(rawType as AnimeType)
    ? (rawType as AnimeType)
    : 'UNKNOWN';

  const rawStatus = typeof obj['status'] === 'string' ? obj['status'].toUpperCase() : 'UNKNOWN';
  const status: AnimeStatus = VALID_STATUSES.has(rawStatus as AnimeStatus)
    ? (rawStatus as AnimeStatus)
    : 'UNKNOWN';

  const animeSeason =
    typeof obj['animeSeason'] === 'object' && obj['animeSeason'] !== null
      ? (obj['animeSeason'] as Record<string, unknown>)
      : {};
  const rawSeason =
    typeof animeSeason['season'] === 'string' ? animeSeason['season'].toUpperCase() : 'UNDEFINED';
  const season: AnimeSeason = VALID_SEASONS.has(rawSeason as AnimeSeason)
    ? (rawSeason as AnimeSeason)
    : 'UNDEFINED';
  const seasonYear = asNullableInt(animeSeason['year']);

  const durationObj =
    typeof obj['duration'] === 'object' && obj['duration'] !== null
      ? (obj['duration'] as Record<string, unknown>)
      : {};
  const durationSeconds = asNullableInt(durationObj['value']);

  const scoreObj =
    typeof obj['score'] === 'object' && obj['score'] !== null
      ? (obj['score'] as Record<string, unknown>)
      : {};
  const scoreArithmeticMean = asNullableNumber(scoreObj['arithmeticMean']);
  const scoreMedian = asNullableNumber(scoreObj['median']);

  const relatedUrls: string[] = [];
  for (const rel of asStringArray(obj['relatedAnime'])) {
    const norm = normalizeExternalUrl(rel);
    if (norm) {
      relatedUrls.push(norm.normalizedUrl);
    }
  }

  return {
    ok: true,
    record: {
      lineNumber,
      title,
      normalizedTitle: normalizeSearchText(title),
      type,
      episodes: asNullableInt(obj['episodes']),
      status,
      season,
      seasonYear,
      durationSeconds,
      scoreArithmeticMean,
      scoreMedian,
      pictureUrl: asNullableUrl(obj['picture']),
      thumbnailUrl: asNullableUrl(obj['thumbnail']),
      synonyms: asStringArray(obj['synonyms']),
      studios: asStringArray(obj['studios']),
      producers: asStringArray(obj['producers']),
      tags: asStringArray(obj['tags']),
      sources: [...dedupedSources.values()],
      relatedUrls: [...new Set(relatedUrls)],
    },
  };
}

export async function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export interface StreamScanSummary {
  sha256: string;
  metadata: DatasetMetadataLine;
  totalLines: number;
  validRecords: number;
  errors: ParsedLineError[];
}

export async function scanJsonlFile(
  filePath: string,
  onRecord?: (record: ParsedAnimeRecord) => Promise<void> | void,
): Promise<StreamScanSummary> {
  const sha256 = await computeFileSha256(filePath);
  const input = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let lineNumber = 0;
  let metadata: DatasetMetadataLine | null = null;
  let validRecords = 0;
  const errors: ParsedLineError[] = [];

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;
    lineNumber += 1;

    if (lineNumber === 1) {
      metadata = parseMetadataLine(line);
      continue;
    }

    const result = parseAnimeLine(line, lineNumber);
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }

    validRecords += 1;
    if (onRecord) {
      await onRecord(result.record);
    }
  }

  if (!metadata) {
    throw new Error('JSONL file is empty; expected metadata on line 1.');
  }

  return {
    sha256,
    metadata,
    totalLines: Math.max(0, lineNumber - 1),
    validRecords,
    errors,
  };
}

export async function streamJsonlBatches(
  filePath: string,
  batchSize: number,
  handlers: {
    onMetadata: (metadata: DatasetMetadataLine, sha256: string) => Promise<void>;
    onBatch: (batch: ParsedAnimeRecord[]) => Promise<void>;
    onRejectedBatch: (errors: ParsedLineError[]) => Promise<void>;
  },
): Promise<{ totalLines: number; validRecords: number; rejectedCount: number }> {
  const sha256 = await computeFileSha256(filePath);
  const input = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let lineNumber = 0;
  let hasMetadata = false;
  let validRecords = 0;
  let rejectedCount = 0;
  let batch: ParsedAnimeRecord[] = [];
  let errorBatch: ParsedLineError[] = [];

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;
    lineNumber += 1;

    if (lineNumber === 1) {
      const metadata = parseMetadataLine(line);
      hasMetadata = true;
      await handlers.onMetadata(metadata, sha256);
      continue;
    }

    const result = parseAnimeLine(line, lineNumber);
    if (!result.ok) {
      rejectedCount += 1;
      errorBatch.push(result.error);
      if (errorBatch.length >= batchSize) {
        await handlers.onRejectedBatch(errorBatch);
        errorBatch = [];
      }
      continue;
    }

    validRecords += 1;
    batch.push(result.record);
    if (batch.length >= batchSize) {
      await handlers.onBatch(batch);
      batch = [];
    }
  }

  if (!hasMetadata) {
    throw new Error('JSONL file is empty; expected metadata on line 1.');
  }

  if (batch.length > 0) {
    await handlers.onBatch(batch);
  }
  if (errorBatch.length > 0) {
    await handlers.onRejectedBatch(errorBatch);
  }

  return {
    totalLines: Math.max(0, lineNumber - 1),
    validRecords,
    rejectedCount,
  };
}
