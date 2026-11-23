import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  extractReleaseLabel,
  parseAnimeLine,
  parseMetadataLine,
  scanJsonlFile,
} from '../src/modules/ingestion/jsonl-parser.js';
import { computeQualitySafeAnimePatch } from '../src/modules/ingestion/importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, 'fixtures/anime-offline-sample.jsonl');

describe('JSONL streaming parser & quality-safe diffing', () => {
  it('parses first-line metadata, extracts release tag from $schema, and rejects anime record on line 1', () => {
    const meta = parseMetadataLine(
      '{"$schema":"https://raw.githubusercontent.com/cedya77/anime-offline-database/refs/tags/2026-47/schemas/anime-offline-database.jsonl.schema.json","repository":"https://github.com/cedya77/anime-offline-database","lastUpdate":"2026-11-22"}',
    );
    expect(meta.lastUpdate).toBe('2026-11-22');
    expect(extractReleaseLabel(meta)).toBe('2026-47');

    expect(() =>
      parseMetadataLine('{"title":"Anime","sources":["https://myanimelist.net/anime/1"]}'),
    ).toThrow(/metadata/i);
  });

  it('streams fixture file, validates records, preserves Japanese Unicode, and isolates intentional rejections', async () => {
    const records: Array<{
      title: string;
      synonyms: string[];
      scoreArithmeticMean: number | null;
    }> = [];
    const summary = await scanJsonlFile(fixturePath, (rec) => {
      records.push({
        title: rec.title,
        synonyms: rec.synonyms,
        scoreArithmeticMean: rec.scoreArithmeticMean,
      });
    });

    expect(summary.sha256).toHaveLength(64);
    expect(summary.totalLines).toBe(4);
    expect(summary.validRecords).toBe(2);
    expect(summary.errors).toHaveLength(2);
    expect(summary.errors.map((e) => e.errorCode)).toEqual([
      'MISSING_VALID_SOURCES',
      'INVALID_JSON',
    ]);

    expect(records[0]?.title).toBe('Cowboy Bebop');
    expect(records[0]?.synonyms).toContain('カウボーイビバップ');
    expect(records[1]?.scoreArithmeticMean).toBeNull();
  });

  it('preserves existing non-null fields when incoming record has null/UNKNOWN/UNDEFINED values', () => {
    const existing = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Cowboy Bebop',
      normalizedTitle: 'cowboy bebop',
      type: 'TV',
      episodes: 26,
      status: 'FINISHED',
      season: 'SPRING',
      seasonYear: 1998,
      durationSeconds: 1440,
      scoreArithmeticMean: 8.75,
      scoreMedian: 8.8,
      pictureUrl: 'https://example.invalid/pic.jpg',
      thumbnailUrl: 'https://example.invalid/thumb.jpg',
      primarySourceId: null,
      lastSnapshotId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const parsed = parseAnimeLine(
      JSON.stringify({
        title: 'Cowboy Bebop',
        type: 'UNKNOWN',
        status: 'UNKNOWN',
        episodes: null,
        animeSeason: { season: 'UNDEFINED', year: null },
        sources: ['https://myanimelist.net/anime/1'],
      }),
      2,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      // Zero degradation -> returns null (unchanged!)
      expect(computeQualitySafeAnimePatch(existing, parsed.record)).toBeNull();
    }
  });
});
