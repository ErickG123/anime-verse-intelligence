import { describe, expect, it } from 'vitest';
import { MangaUpdatesClient } from '../src/modules/integrations/editorial/mangaupdates-client.js';
import {
  isValidWikidataQid,
  WikidataEditorialClient,
} from '../src/modules/integrations/editorial/wikidata-client.js';
import {
  ATTRIBUTE_PRECEDENCE_MATRIX,
  reconcileEditorialAssertions,
} from '../src/modules/integrations/editorial/reconciler.js';

describe('Phase 24: Editorial Sources (MangaUpdates + Wikidata + Reconciler)', () => {
  it('validates MangaUpdates client disabled state, 429 handling, and excludes restricted fields', async () => {
    const disabled = new MangaUpdatesClient({ enabled: false });
    expect((await disabled.fetchSeriesById(1)).ok).toBe(false);

    const rateLimited = new MangaUpdatesClient(
      { enabled: true },
      async () => new Response(null, { status: 429 }),
    );
    const r429 = await rateLimited.fetchSeriesById(1);
    expect(r429.ok).toBe(false);
    if (!r429.ok) expect(r429.kind).toBe('RATE_LIMITED');

    const okClient = new MangaUpdatesClient(
      { enabled: true },
      async () =>
        new Response(
          JSON.stringify({
            title: '鋼の錬金術師',
            type: 'Manga',
            year: '2001',
            description: 'MUST NOT BE COPIED',
            associated: [{ title: 'Fullmetal Alchemist' }],
            authors: [{ name: 'Arakawa Hiromu', type: 'Author' }],
            publishers: [{ publisher_name: 'Square Enix', type: 'Original' }],
          }),
          { status: 200 },
        ),
    );
    const res = await okClient.fetchSeriesById(412);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.title).toBe('鋼の錬金術師');
      expect(res.data.publishers[0]?.name).toBe('Square Enix');
      expect('description' in res.data).toBe(false);
    }
  });

  it('validates Wikidata QID format, CC0 claims parsing, and rejects invalid QIDs', async () => {
    expect(isValidWikidataQid('Q199862')).toBe(true);
    expect(isValidWikidataQid('DROP TABLE')).toBe(false);

    const wd = new WikidataEditorialClient(
      { enabled: true },
      async () =>
        new Response(
          JSON.stringify({
            entities: {
              Q199862: {
                labels: { en: { value: 'Cowboy Bebop' }, ja: { value: 'カウボーイビバップ' } },
                claims: {
                  P123: [{ mainsnak: { datavalue: { value: { id: 'Q806273' } } } }],
                  P144: [],
                },
              },
            },
          }),
          { status: 200 },
        ),
    );
    const res = await wd.fetchEntityByQid('Q199862');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.labels['ja']).toBe('カウボーイビバップ');
      expect(res.data.publisherQids).toEqual(['Q806273']);
    }
  });

  it('reconciles assertions using attribute precedence and preserves open conflicts', () => {
    expect(ATTRIBUTE_PRECEDENCE_MATRIX['anime_studio']).not.toEqual(
      ATTRIBUTE_PRECEDENCE_MATRIX['manga_publisher'],
    );

    const reconciled = reconcileEditorialAssertions([
      {
        property: 'manga_publisher',
        value: 'Square Enix',
        source: 'mangaupdates',
        sourceEntityId: '412',
        sourceUrl: 'https://www.mangaupdates.com/series.html?id=412',
        license: 'MangaUpdates',
        verificationStatus: 'VERIFIED',
        capturedAt: '2026-11-23T00:00:00Z',
      },
      {
        property: 'manga_publisher',
        value: 'Enix',
        source: 'wikidata',
        sourceEntityId: 'Q189562',
        sourceUrl: 'https://www.wikidata.org/wiki/Q189562',
        license: 'CC0 1.0',
        verificationStatus: 'VERIFIED',
        capturedAt: '2026-11-23T00:00:00Z',
      },
    ]);

    expect(reconciled.canonicalByProperty['manga_publisher']?.value).toBe('Square Enix');
    expect(reconciled.conflicts).toHaveLength(1);
    expect(reconciled.conflicts[0]?.resolutionStatus).toBe('OPEN');
  });
});
