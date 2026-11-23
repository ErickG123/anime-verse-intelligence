import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  validateCurationBatch,
  type CurationBatch,
} from '../src/modules/editorial-governance/curation-importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(
  __dirname,
  '../../../docs/data-sources/initial-curation/datasets/initial-curation-v1.json',
);

describe('Editorial Curation Batch Importer Validation (Phase 34)', () => {
  it('validates the official initial-curation-v1.json batch cleanly', async () => {
    const raw = await fs.readFile(datasetPath, 'utf-8');
    const batch = JSON.parse(raw) as CurationBatch;
    const result = validateCurationBatch(batch);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('blocks batches whose rightsStatus is not VERIFIED', async () => {
    const raw = await fs.readFile(datasetPath, 'utf-8');
    const batch = JSON.parse(raw) as CurationBatch;
    batch.rightsPolicy.rightsStatus = 'PENDING';
    const result = validateCurationBatch(batch);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Rights gate violation');
  });

  it('rejects self-referencing event relations', async () => {
    const raw = await fs.readFile(datasetPath, 'utf-8');
    const batch = JSON.parse(raw) as CurationBatch;
    batch.works[0]!.eventRelations.push({
      fromKey: 'fmab-ev-1',
      toKey: 'fmab-ev-1',
      relationKind: 'CAUSES',
    });
    const result = validateCurationBatch(batch);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Self-referencing'))).toBe(true);
  });
});
