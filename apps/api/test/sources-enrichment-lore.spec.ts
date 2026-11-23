import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { WikidataOptInProvider } from '../src/modules/enrichment/wikidata-adapter.js';
import {
  canTransitionPublicationStatus,
  filterBySpoilerBoundary,
  validateAdaptationMapping,
} from '../src/modules/lore/curation.js';

describe('Phases 13, 14, 15: Sources Observatory, Optional Enrichment & Lore/Adaptation Foundation', () => {
  it('exposes read-only /api/v1/data-sources and /runs without any write endpoint', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
    });

    const sourcesRes = await app.inject({ method: 'GET', url: '/api/v1/data-sources' });
    expect(sourcesRes.statusCode).toBe(200);
    const sources = sourcesRes.json().items;
    expect(sources.length).toBeGreaterThanOrEqual(5);
    expect(
      sources.find((s: { sourceId: string }) => s.sourceId === 'anime-offline-database').status,
    ).toBe('ACTIVE');
    expect(sources.find((s: { sourceId: string }) => s.sourceId === 'anilist').status).toBe(
      'INACTIVE',
    );

    const runsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/data-sources/anime-offline-database/runs',
    });
    expect(runsRes.statusCode).toBe(200);
    expect(runsRes.json().items).toEqual([]);

    const postAttempt = await app.inject({ method: 'POST', url: '/api/v1/data-sources' });
    expect(postAttempt.statusCode).toBe(404);

    const providersRes = await app.inject({ method: 'GET', url: '/api/v1/enrichment/providers' });
    expect(providersRes.statusCode).toBe(200);
    expect(
      providersRes.json().providers.every((p: { enabled: boolean }) => p.enabled === false),
    ).toBe(true);

    const loreStatus = await app.inject({ method: 'GET', url: '/api/v1/lore/status' });
    expect(loreStatus.statusCode).toBe(200);
    expect(loreStatus.json().availability).toBe('UNAVAILABLE');

    const adaptStatus = await app.inject({ method: 'GET', url: '/api/v1/adaptation/status' });
    expect(adaptStatus.statusCode).toBe(200);
    expect(adaptStatus.json().availability).toBe('UNAVAILABLE');

    await app.close();
  });

  it('keeps WikidataOptInProvider disabled by default and handles 429/500/circuit-breaker when enabled with mock fetch', async () => {
    const identity = {
      provider: 'wikidata',
      externalId: 'Q199862',
      normalizedUrl: 'https://www.wikidata.org/wiki/Q199862',
    };

    const disabledProvider = new WikidataOptInProvider({ enabled: false });
    const disabledRes = await disabledProvider.fetchByExternalId(identity);
    expect(disabledRes.status).toBe('DISABLED');

    const rateLimitedProvider = new WikidataOptInProvider({
      enabled: true,
      fetchImpl: async () => new Response(null, { status: 429 }),
    });
    expect((await rateLimitedProvider.fetchByExternalId(identity)).status).toBe('RATE_LIMITED');

    const failingProvider = new WikidataOptInProvider({
      enabled: true,
      fetchImpl: async () => new Response(null, { status: 500 }),
    });
    await failingProvider.fetchByExternalId(identity);
    await failingProvider.fetchByExternalId(identity);
    await failingProvider.fetchByExternalId(identity);
    const tripped = await failingProvider.fetchByExternalId(identity);
    expect(tripped.status).toBe('ERROR');
    expect(tripped.message).toMatch(/circuit breaker/i);
  });

  it('validates LoreGraph/AdaptationLab curation rules, non-contiguous chapters, omitted events and spoilers', () => {
    // Valid multi-chapter non-contiguous episode mapping
    expect(
      validateAdaptationMapping({
        animeEpisodeNumber: 5,
        mangaChapterNumbers: ['10', '12', '13.5'],
        mappingKind: 'DIRECT',
        spoilerLevel: 'MILD',
        confidence: 0.9,
        publicationStatus: 'PUBLISHED',
        reviewer: 'curator-1',
        evidenceSourceId: 'licensed-source-1',
      }),
    ).toEqual([]);

    // Omitted chapter event without reviewer fails if PUBLISHED
    const errors = validateAdaptationMapping({
      animeEpisodeNumber: 6,
      mangaChapterNumbers: [],
      mappingKind: 'OMITTED',
      spoilerLevel: 'MAJOR',
      confidence: 0.8,
      publicationStatus: 'PUBLISHED',
      reviewer: null,
      evidenceSourceId: 'licensed-source-1',
    });
    expect(errors).toContain('PUBLISHED entries require an explicit reviewer.');

    expect(canTransitionPublicationStatus('DRAFT', 'REVIEWED')).toBe(true);
    expect(canTransitionPublicationStatus('DRAFT', 'PUBLISHED')).toBe(false);

    const filtered = filterBySpoilerBoundary(
      [
        { id: '1', spoilerLevel: 'NONE' as const },
        { id: '2', spoilerLevel: 'MILD' as const },
        { id: '3', spoilerLevel: 'MAJOR' as const },
      ],
      'MILD',
    );
    expect(filtered.map((x) => x.id)).toEqual(['1', '2']);
  });
});
