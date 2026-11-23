import { describe, expect, it } from 'vitest';
import {
  filterAdaptationMappings,
  type AdaptationMappingRecord,
} from '../src/modules/adaptation/engine.js';

const FIXTURE_MAPPINGS: AdaptationMappingRecord[] = [
  {
    id: 'm1',
    animeId: 'anime-1',
    animeVersion: 'tv-2026',
    episodeNumber: 1,
    mangaWorkId: 'manga-1',
    mangaEdition: 'jp-tankobon',
    chapterNumbers: ['0', '1', '2'],
    mappingKind: 'COMPOSITE',
    diffStatus: 'PRESERVED',
    summary: 'Adapts prologue chapter 0 and chapters 1-2.',
    evidenceRef: 'curated://m1',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'm2',
    animeId: 'anime-1',
    animeVersion: 'tv-2026',
    episodeNumber: 2,
    mangaWorkId: 'manga-1',
    mangaEdition: 'jp-tankobon',
    chapterNumbers: ['3', '5.5'],
    mappingKind: 'REORDERED',
    diffStatus: 'REORDERED',
    summary: 'Reorders chapter 5.5 ahead of chapter 4.',
    evidenceRef: 'curated://m2',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'm3',
    animeId: 'anime-1',
    animeVersion: 'tv-2026',
    episodeNumber: 3,
    mangaWorkId: null,
    mangaEdition: null,
    chapterNumbers: [],
    mappingKind: 'ANIME_ORIGINAL',
    diffStatus: 'ADDED',
    summary: 'Original anime episode with no source chapter.',
    evidenceRef: 'curated://m3',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'm4',
    animeId: 'anime-1',
    animeVersion: 'tv-2026',
    episodeNumber: 4,
    mangaWorkId: 'manga-1',
    mangaEdition: 'jp-tankobon',
    chapterNumbers: [],
    mappingKind: 'UNKNOWN',
    diffStatus: 'UNKNOWN',
    summary: 'Not yet mapped.',
    evidenceRef: 'curated://m4',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'm5-future-spoiler',
    animeId: 'anime-1',
    animeVersion: 'tv-2026',
    episodeNumber: 12,
    mangaWorkId: 'manga-1',
    mangaEdition: 'jp-tankobon',
    chapterNumbers: ['40'],
    mappingKind: 'DIRECT',
    diffStatus: 'OMITTED',
    summary: 'FINAL_EPISODE_SPOILER_TOKEN',
    evidenceRef: 'curated://m5',
    publicationStatus: 'PUBLISHED',
  },
];

describe('Phase 26: AdaptationLab N:M Engine, Coverage & Spoiler Protection', () => {
  it('supports N:M composite/reordered/chapter-0/anime-original mappings and never leaks future episodes', () => {
    const res = filterAdaptationMappings(FIXTURE_MAPPINGS, {
      animeId: 'anime-1',
      animeVersion: 'tv-2026',
      knownTotalEpisodes: 12,
      progressEpisode: 4,
    });

    expect(res.mappings.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(JSON.stringify(res)).not.toContain('FINAL_EPISODE_SPOILER_TOKEN');
    // 3 verified mapped episodes (m1, m2, m3); m4 is UNKNOWN and NOT counted as mapped or omitted
    expect(res.coverage.verifiedMappedEpisodes).toBe(3);
    expect(res.coverage.unknownEpisodes).toBe(1);
    expect(res.coverage.coverageRatio).toBe(0.25);
  });

  it('blocks direct episode=12 request when progressEpisode=4 (spoiler boundary)', () => {
    const blocked = filterAdaptationMappings(FIXTURE_MAPPINGS, {
      animeId: 'anime-1',
      animeVersion: 'tv-2026',
      knownTotalEpisodes: 12,
      progressEpisode: 4,
      episode: 12,
    });
    expect(blocked.mappings).toEqual([]);
  });

  it('returns null coverageRatio when knownTotalEpisodes is unknown', () => {
    const res = filterAdaptationMappings(FIXTURE_MAPPINGS, {
      animeId: 'anime-1',
      animeVersion: 'tv-2026',
      knownTotalEpisodes: null,
      progressEpisode: 2,
    });
    expect(res.coverage.coverageRatio).toBeNull();
  });
});
