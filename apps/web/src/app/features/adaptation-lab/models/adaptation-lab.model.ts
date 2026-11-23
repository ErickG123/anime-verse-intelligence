export type AdaptationMappingKind = 'DIRECT' | 'PARTIAL' | 'OMITTED' | 'ANIME_ORIGINAL';

export interface AdaptationWorkOption {
  id: string;
  title: string;
  type: string;
  episodes: number | null;
  seasonYear: number | null;
}

export interface AdaptationEpisodeItem {
  id: string;
  episodeNumber: number;
  title: string | null;
  spoilerLevel: string;
}

export interface AdaptationChapterItem {
  id: string;
  chapterNumber: string;
  title: string | null;
}

export interface AdaptationMappingItem {
  id: string;
  animeEpisodeId: string;
  episodeNumber: number;
  mangaChapterId: string | null;
  chapterNumber: string | null;
  chapterTitle: string | null;
  mappingKind: AdaptationMappingKind;
  notes: string | null;
  spoilerLevel: string;
  confidence: number;
  reviewer: string | null;
}

export interface AdaptationWorkPayload {
  animeId: string;
  animeTitle: string | null;
  totalAnimeEpisodes: number | null;
  mangaTitle: string | null;
  episodes: AdaptationEpisodeItem[];
  chapters: AdaptationChapterItem[];
  mappings: AdaptationMappingItem[];
  coverage: {
    documentedEpisodes: number;
    documentedChapters: number;
    mappingsCount: number;
    denominatorEpisodes: number | null;
  };
}
