export type PublicationStatus = 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
export type SpoilerLevel = 'NONE' | 'MILD' | 'MAJOR';
export type AdaptationMappingKind = 'DIRECT' | 'PARTIAL' | 'OMITTED' | 'ANIME_ORIGINAL';

export interface AdaptationMappingEntry {
  animeEpisodeNumber: number;
  mangaChapterNumbers: string[]; // supports non-contiguous chapters & multi-chapter episodes
  mappingKind: AdaptationMappingKind;
  spoilerLevel: SpoilerLevel;
  confidence: number;
  publicationStatus: PublicationStatus;
  reviewer: string | null;
  evidenceSourceId: string;
}

export interface UnidirectionalEventRelation {
  fromEventId: string;
  toEventId: string;
  relationKind: string;
  unidirectional: true;
  spoilerLevel: SpoilerLevel;
}

const ALLOWED_TRANSITIONS: Record<PublicationStatus, readonly PublicationStatus[]> = {
  DRAFT: ['REVIEWED'],
  REVIEWED: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['REVIEWED'],
};

export function validateAdaptationMapping(entry: AdaptationMappingEntry): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(entry.animeEpisodeNumber) || entry.animeEpisodeNumber < 1) {
    errors.push('animeEpisodeNumber must be an integer >= 1.');
  }
  if (entry.confidence < 0 || entry.confidence > 1) {
    errors.push('confidence must be between 0 and 1.');
  }
  if (!entry.evidenceSourceId.trim()) {
    errors.push('evidenceSourceId is mandatory for provenance.');
  }
  if (entry.mappingKind === 'DIRECT' && entry.mangaChapterNumbers.length === 0) {
    errors.push('DIRECT adaptation mapping requires at least one manga chapter.');
  }
  if (entry.publicationStatus === 'PUBLISHED' && (!entry.reviewer || !entry.reviewer.trim())) {
    errors.push('PUBLISHED entries require an explicit reviewer.');
  }
  return errors;
}

export function canTransitionPublicationStatus(
  from: PublicationStatus,
  to: PublicationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function filterBySpoilerBoundary<T extends { spoilerLevel: SpoilerLevel }>(
  items: readonly T[],
  maxAllowed: SpoilerLevel,
): T[] {
  const rank: Record<SpoilerLevel, number> = { NONE: 0, MILD: 1, MAJOR: 2 };
  const limit = rank[maxAllowed];
  return items.filter((item) => rank[item.spoilerLevel] <= limit);
}
