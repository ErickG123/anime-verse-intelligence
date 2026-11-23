import { describe, expect, it } from 'vitest';
import {
  assertSourceCanStore,
  DATA_SOURCE_REGISTRY,
  getGovernedSource,
} from '../src/modules/sources/source-registry.js';
import {
  normalizeExternalUrl,
  normalizeSearchText,
  validateSafeDownloadUrl,
} from '../src/modules/sources/url-normalizer.js';

describe('Data source governance & URL normalization', () => {
  it('keeps only anime-offline-database active and blocks inactive providers from storing', () => {
    const active = DATA_SOURCE_REGISTRY.filter((s) => s.status === 'ACTIVE');
    expect(active.map((s) => s.sourceId)).toEqual(['anime-offline-database']);

    expect(() => assertSourceCanStore('anime-offline-database')).not.toThrow();
    expect(() => assertSourceCanStore('anilist')).toThrow(/not authorized/i);
    expect(() => assertSourceCanStore('wikidata')).toThrow(/not authorized/i);
    expect(() => assertSourceCanStore('tmdb')).toThrow(/not authorized/i);
    expect(() => assertSourceCanStore('unknown-source')).toThrow(/Unknown data source/i);
    expect(getGovernedSource('anilist')?.permissions.store).toBe(false);
  });

  it('normalizes external provider URLs deterministically', () => {
    expect(normalizeExternalUrl('http://www.myanimelist.net/anime/1/Cowboy_Bebop/')).toEqual({
      provider: 'myanimelist',
      externalId: '1',
      normalizedUrl: 'https://myanimelist.net/anime/1',
      rawUrl: 'http://www.myanimelist.net/anime/1/Cowboy_Bebop/',
    });

    expect(normalizeExternalUrl('https://anilist.co/anime/1/')).toMatchObject({
      provider: 'anilist',
      externalId: '1',
      normalizedUrl: 'https://anilist.co/anime/1',
    });

    expect(normalizeExternalUrl('https://kitsu.io/anime/cowboy-bebop')).toMatchObject({
      provider: 'kitsu',
      externalId: 'cowboy-bebop',
      normalizedUrl: 'https://kitsu.app/anime/cowboy-bebop',
    });

    expect(normalizeExternalUrl('https://anidb.net/a23')).toMatchObject({
      provider: 'anidb',
      externalId: '23',
      normalizedUrl: 'https://anidb.net/anime/23',
    });

    expect(
      normalizeExternalUrl('https://animenewsnetwork.com/encyclopedia/anime.php?id=13'),
    ).toMatchObject({
      provider: 'animenewsnetwork',
      externalId: '13',
      normalizedUrl: 'https://animenewsnetwork.com/encyclopedia/anime.php?id=13',
    });

    expect(
      normalizeExternalUrl('https://animenewsnetwork.com/encyclopedia/anime.php?id=99')
        ?.normalizedUrl,
    ).not.toBe(
      normalizeExternalUrl('https://animenewsnetwork.com/encyclopedia/anime.php?id=13')
        ?.normalizedUrl,
    );

    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeExternalUrl('not-a-url')).toBeNull();
  });

  it('normalizes search text removing diacritics and collapsing whitespace', () => {
    expect(normalizeSearchText('  Shingeki no Kyojin: Épico  ')).toBe('shingeki no kyojin: epico');
  });

  it('enforces SSRF and allowlist protection on download URLs', () => {
    expect(
      validateSafeDownloadUrl(
        'https://github.com/cedya77/anime-offline-database/releases/download/latest/anime-offline-database.jsonl',
      ).hostname,
    ).toBe('github.com');

    expect(() => validateSafeDownloadUrl('http://github.com/test')).toThrow(/https:/);
    expect(() => validateSafeDownloadUrl('https://127.0.0.1/secret')).toThrow(/SSRF/i);
    expect(() => validateSafeDownloadUrl('https://169.254.169.254/latest/meta-data')).toThrow(
      /SSRF/i,
    );
    expect(() => validateSafeDownloadUrl('https://evil.example.com/file.jsonl')).toThrow(
      /allowlist/i,
    );
  });
});
