import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import type { LoreDataset } from '../src/modules/lore/spoiler-engine.js';

const SYNTHETIC_LORE_FIXTURE: LoreDataset = {
  workId: 'synthetic-work-1',
  media: 'ANIME',
  version: 'tv-2026',
  entities: [
    { id: 'ent-hero', kind: 'CHARACTER', name: 'Aoi', firstSafePosition: 0 },
    { id: 'ent-traitor', kind: 'CHARACTER', name: 'Secret Traitor', firstSafePosition: 4 },
  ],
  events: [
    {
      id: 'ev-0',
      workId: 'synthetic-work-1',
      media: 'ANIME',
      version: 'tv-2026',
      arcId: 'arc-1',
      arcName: 'Opening Arc',
      title: 'Premise Setup',
      summary: 'Spoiler-free introduction.',
      chronologicalOrder: 1,
      releaseOrder: 1,
      spoilerPosition: 0,
      evidenceRef: 'curated-fixture://ep0',
      publicationStatus: 'PUBLISHED',
    },
    {
      id: 'ev-ep3',
      workId: 'synthetic-work-1',
      media: 'ANIME',
      version: 'tv-2026',
      arcId: 'arc-1',
      arcName: 'Opening Arc',
      title: 'Guild Trial',
      summary: 'Aoi enters the guild.',
      chronologicalOrder: 2,
      releaseOrder: 2,
      spoilerPosition: 3,
      evidenceRef: 'curated-fixture://ep3',
      publicationStatus: 'PUBLISHED',
    },
    {
      id: 'ev-ep4-secret',
      workId: 'synthetic-work-1',
      media: 'ANIME',
      version: 'tv-2026',
      arcId: 'arc-2',
      arcName: 'Betrayal Arc',
      title: 'Hidden Twist Reveal',
      summary: 'CRITICAL_SPOILER_TOKEN_EP4 revealed.',
      chronologicalOrder: 3,
      releaseOrder: 3,
      spoilerPosition: 4,
      evidenceRef: 'curated-fixture://ep4',
      publicationStatus: 'PUBLISHED',
    },
    {
      id: 'ev-draft',
      workId: 'synthetic-work-1',
      media: 'ANIME',
      version: 'tv-2026',
      arcId: 'arc-1',
      arcName: 'Opening Arc',
      title: 'Unpublished Draft Event',
      summary: 'MUST_NOT_LEAK_DRAFT',
      chronologicalOrder: 1,
      releaseOrder: 1,
      spoilerPosition: 0,
      evidenceRef: 'curated-fixture://draft',
      publicationStatus: 'DRAFT',
    },
  ],
  relations: [
    {
      id: 'rel-1',
      fromId: 'ev-ep3',
      toId: 'ev-ep4-secret',
      relationKind: 'PRECEDES',
      minSafePosition: 4,
      evidenceRef: 'curated-fixture://rel1',
    },
  ],
};

describe('Phase 25: LoreGraph Backend Spoiler Protection (Negative Attack Suite)', () => {
  it('blocks future spoilers & drafts across graph, direct event ID, search, and mismatched media', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      loreRepository: {
        async getDataset(workId) {
          return workId === 'synthetic-work-1' ? SYNTHETIC_LORE_FIXTURE : null;
        },
      },
    });

    // 1. No progress -> conservative mode (position <= 0)
    const noProg = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/graph?media=ANIME&version=tv-2026',
    });
    expect(noProg.statusCode).toBe(200);
    expect(noProg.json().events.map((e: { id: string }) => e.id)).toEqual(['ev-0']);
    expect(noProg.body).not.toContain('CRITICAL_SPOILER_TOKEN_EP4');
    expect(noProg.body).not.toContain('MUST_NOT_LEAK_DRAFT');

    // 2. Progress = ep 3 -> ep 4 event blocked in graph, direct ID (404!), and search!
    const ep3Graph = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/graph?media=ANIME&version=tv-2026&progress=3',
    });
    expect(ep3Graph.json().events.map((e: { id: string }) => e.id)).toEqual(['ev-0', 'ev-ep3']);
    expect(ep3Graph.json().relations).toEqual([]);
    expect(ep3Graph.body).not.toContain('Secret Traitor');

    const directAttack = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/events/ev-ep4-secret?media=ANIME&version=tv-2026&progress=3',
    });
    expect(directAttack.statusCode).toBe(404);

    const searchAttack = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/search?q=CRITICAL_SPOILER_TOKEN_EP4&media=ANIME&version=tv-2026&progress=3',
    });
    expect(searchAttack.statusCode).toBe(200);
    expect(searchAttack.json().items).toEqual([]);

    // 3. Cross-media mismatch (MANGA progress cannot unlock ANIME events)
    const crossMedia = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/graph?media=MANGA&version=tv-2026&progress=999',
    });
    expect(crossMedia.json().events).toEqual([]);

    // 4. Explicit unlock shows published ep4, still hides DRAFT!
    const unlocked = await app.inject({
      method: 'GET',
      url: '/api/v1/lore/synthetic-work-1/graph?media=ANIME&version=tv-2026&allowSpoilers=true',
    });
    expect(unlocked.json().events.map((e: { id: string }) => e.id)).toEqual([
      'ev-0',
      'ev-ep3',
      'ev-ep4-secret',
    ]);
    expect(unlocked.body).not.toContain('MUST_NOT_LEAK_DRAFT');

    await app.close();
  });
});
