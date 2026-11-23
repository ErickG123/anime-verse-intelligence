export type AdaptationMappingKind =
  'DIRECT' | 'PARTIAL' | 'COMPOSITE' | 'REORDERED' | 'ANIME_ORIGINAL' | 'UNKNOWN';

export type AdaptationDiffStatus =
  'PRESERVED' | 'MODIFIED' | 'OMITTED' | 'ADDED' | 'REORDERED' | 'UNKNOWN';

export interface AdaptationMappingRecord {
  id: string;
  animeId: string;
  animeVersion: string;
  episodeNumber: number;
  mangaWorkId: string | null;
  mangaEdition: string | null;
  chapterNumbers: string[]; // supports '0', '12.5', non-contiguous ['3', '5']
  mappingKind: AdaptationMappingKind;
  diffStatus: AdaptationDiffStatus;
  summary: string;
  evidenceRef: string;
  publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED' | 'RETRACTED';
}

export interface AdaptationCoverageSummary {
  knownTotalEpisodes: number | null;
  verifiedMappedEpisodes: number;
  unknownEpisodes: number;
  coverageRatio: number | null; // null if knownTotalEpisodes is unknown
  note: string;
}

export interface AdaptationCompareResult {
  animeId: string;
  animeVersion: string;
  appliedMaxEpisode: number;
  spoilersUnlocked: boolean;
  mappings: AdaptationMappingRecord[];
  coverage: AdaptationCoverageSummary;
}

export function filterAdaptationMappings(
  records: readonly AdaptationMappingRecord[],
  options: {
    animeId: string;
    animeVersion: string;
    knownTotalEpisodes: number | null;
    progressEpisode?: number;
    allowSpoilers?: boolean;
    episode?: number;
  },
): AdaptationCompareResult {
  const spoilersUnlocked = Boolean(options.allowSpoilers);
  const maxEp = spoilersUnlocked
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, options.progressEpisode ?? 0);

  const publishedForVersion = records.filter(
    (r) =>
      r.publicationStatus === 'PUBLISHED' &&
      r.animeId === options.animeId &&
      r.animeVersion === options.animeVersion,
  );

  // Enforce spoiler boundary BEFORE filtering by requested episode or computing counts
  const safeMappings = publishedForVersion.filter((r) => r.episodeNumber <= maxEp);
  const visible =
    options.episode !== undefined
      ? safeMappings.filter((r) => r.episodeNumber === options.episode)
      : safeMappings;

  const verifiedMappedEpisodes = new Set(
    safeMappings.filter((r) => r.mappingKind !== 'UNKNOWN').map((r) => r.episodeNumber),
  ).size;
  const unknownEpisodes = new Set(
    safeMappings.filter((r) => r.mappingKind === 'UNKNOWN').map((r) => r.episodeNumber),
  ).size;

  const coverageRatio =
    options.knownTotalEpisodes && options.knownTotalEpisodes > 0
      ? Number((verifiedMappedEpisodes / options.knownTotalEpisodes).toFixed(4))
      : null;

  return {
    animeId: options.animeId,
    animeVersion: options.animeVersion,
    appliedMaxEpisode: spoilersUnlocked ? -1 : maxEp,
    spoilersUnlocked,
    mappings: visible,
    coverage: {
      knownTotalEpisodes: options.knownTotalEpisodes,
      verifiedMappedEpisodes,
      unknownEpisodes,
      coverageRatio,
      note:
        coverageRatio === null
          ? 'Coverage ratio unavailable because total episode count is unknown.'
          : 'Coverage reflects verified published mappings within allowed spoiler boundary; UNKNOWN is never counted as OMITTED.',
    },
  };
}
