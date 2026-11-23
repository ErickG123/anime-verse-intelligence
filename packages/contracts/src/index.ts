export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  checks: {
    database: 'up' | 'down';
  };
  timestamp: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export type AnimeType = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'UNKNOWN';
export type AnimeStatus = 'FINISHED' | 'ONGOING' | 'UPCOMING' | 'UNKNOWN';
export type AnimeSeason = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | 'UNDEFINED';
export type CompanyRole = 'STUDIO' | 'PRODUCER';
export type RelationType = 'UNSPECIFIED';
export type DataAvailabilityState =
  'AVAILABLE' | 'MISSING' | 'CONFLICT' | 'UNVERIFIED' | 'UNAVAILABLE';

export type AnimeSortField = 'title' | 'year' | 'episodes' | 'score' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface ProvenanceSummary {
  sourceSlug: string | null;
  sourceName: string | null;
  license: string | null;
  snapshotVersion: string | null;
  lastImportedAt: string | null;
}

export interface AnimeSummaryDto {
  id: string;
  title: string;
  type: AnimeType;
  episodes: number | null;
  status: AnimeStatus;
  season: AnimeSeason;
  seasonYear: number | null;
  scoreArithmeticMean: number | null;
  thumbnailUrl: string | null;
  studios: string[];
  tags: string[];
  updatedAt: string;
}

export interface ExternalReferenceDto {
  provider: string;
  externalId: string | null;
  normalizedUrl: string;
}

export interface CompanyLinkDto {
  id: string;
  name: string;
  role: CompanyRole;
}

export interface AnimeDetailDto extends AnimeSummaryDto {
  durationSeconds: number | null;
  scoreMedian: number | null;
  pictureUrl: string | null;
  aliases: string[];
  companies: CompanyLinkDto[];
  externalReferences: ExternalReferenceDto[];
  relatedCount: number;
  provenance: ProvenanceSummary;
}

export interface RelatedAnimeItemDto {
  id: string;
  title: string;
  type: AnimeType;
  seasonYear: number | null;
  relationType: RelationType;
}

export interface CompanySummaryDto {
  id: string;
  name: string;
  role: CompanyRole;
  animeCount: number;
}

export interface StatisticsOverviewDto {
  totalAnime: number;
  totalStudios: number;
  totalProducers: number;
  totalRelationships: number;
  lastSnapshotVersion: string | null;
  lastImportedAt: string | null;
}

export interface GraphNodeDto {
  id: string;
  label: string;
  kind: 'ANIME' | 'STUDIO' | 'PRODUCER' | 'PERSON';
  type?: AnimeType;
  seasonYear?: number | null;
  roleLabel?: string | null;
  isCenter?: boolean;
}

export interface GraphEdgeDto {
  id: string;
  source: string;
  target: string;
  label: string;
  relationType: RelationType | CompanyRole | 'STAFF_ROLE';
}

export interface NetworkGraphResponseDto {
  centerId: string;
  depth: number;
  truncated: boolean;
  notice: string;
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}

export interface DataSourceDto {
  sourceId: string;
  name: string;
  kind: string;
  documentationUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  license: string;
  attribution: string;
  policyVersion: string;
  permissions: {
    fetch: boolean;
    store: boolean;
    redistribute: boolean;
  };
  notes: string;
  lastSnapshotVersion: string | null;
  lastRunAt: string | null;
}

export interface IngestionRunDto {
  id: string;
  sourceId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalLines: number;
  validRecords: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  conflictCount: number;
  relationsCount: number;
  summaryMessage: string | null;
}

export interface ModuleStatusDto {
  module: 'lore' | 'adaptation';
  availability: DataAvailabilityState;
  message: string;
  curationMode: 'CLI_ONLY';
  recordsCount: number;
}

export type ExternalIntegrationState =
  'OK' | 'DISABLED' | 'UNLINKED' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'ERROR';

export interface AniListPageInfoDto {
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  total: number | null;
}

export interface AniListVoiceActorDto {
  id: number;
  name: string;
  language: string | null;
}

export interface AniListCharacterDto {
  id: number;
  name: string;
  alternativeNames: string[];
  role: string;
  voiceActors: AniListVoiceActorDto[];
}

export interface AniListStaffDto {
  id: number;
  name: string;
  role: string;
}

export interface AniListStudioDto {
  id: number;
  name: string;
  isMain: boolean;
  isAnimationStudio: boolean;
}

export interface AniListMediaOverviewDto {
  state: ExternalIntegrationState;
  source: 'anilist';
  attribution: string;
  cached: boolean;
  anilistId: number | null;
  siteUrl: string | null;
  format: string | null;
  status: string | null;
  descriptionPlain: string | null;
  isAdult: boolean;
  externalLinks: Array<{ site: string; url: string }>;
  message?: string;
}

export interface AniListCharactersResponseDto {
  state: ExternalIntegrationState;
  source: 'anilist';
  attribution: string;
  anilistId: number | null;
  pageInfo: AniListPageInfoDto;
  items: AniListCharacterDto[];
  message?: string;
}

export interface AniListStaffResponseDto {
  state: ExternalIntegrationState;
  source: 'anilist';
  attribution: string;
  anilistId: number | null;
  pageInfo: AniListPageInfoDto;
  items: AniListStaffDto[];
  message?: string;
}

export interface AniListStudiosResponseDto {
  state: ExternalIntegrationState;
  source: 'anilist';
  attribution: string;
  anilistId: number | null;
  items: AniListStudioDto[];
  message?: string;
}

export interface AniListExternalStatusDto {
  animeId: string;
  provider: 'anilist';
  enabled: boolean;
  linked: boolean;
  anilistId: number | null;
  siteUrl: string | null;
  storagePolicy: 'TRANSIENT_MEMORY_ONLY';
  message: string;
}

export interface AniListMetricsDto {
  provider: 'anilist';
  enabled: boolean;
  endpoint: string;
  policySummary: string;
  documentationUrl: string;
  requestsTotal: number;
  requestsFailed: number;
  rateLimitedCount: number;
  cacheHits: number;
  avgLatencyMs: number;
  lastRequestAt: string | null;
  lastError: string | null;
  rateLimitRemaining: number | null;
}

export type StudioGraphMode = 'PRODUCTION' | 'COLLABORATION';
export type StudioGraphProvenance = 'LOCAL_DB' | 'ANILIST_ON_DEMAND';

export interface StudioGraphNodeDto {
  id: string; // typed: anime:<uuid>, studio:<uuid>, company:<uuid>, person:anilist:<id>
  kind: 'ANIME' | 'STUDIO' | 'PRODUCER' | 'PERSON';
  label: string;
  internalId: string | null;
  provenance: StudioGraphProvenance;
  animeType?: AnimeType;
  seasonYear?: number | null;
  roleLabel?: string | null;
  accessibleUrl?: string | null;
  isCenter?: boolean;
}

export interface StudioGraphEdgeDto {
  id: string;
  source: string;
  target: string;
  relationKind: 'STUDIO' | 'PRODUCER' | 'STAFF_ROLE';
  creditRole?: string | null;
  provenance: StudioGraphProvenance;
  evidenceContext?: string | null;
}

export interface StudioGraphPageInfoDto {
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export interface StudioGraphMetricsDto {
  nodeCount: number;
  edgeCount: number;
  animeCount: number;
  companyCount: number;
  personCount: number;
  sourceScope: string;
}

export interface StudioGraphPageDto {
  anchorId: string;
  mode: StudioGraphMode;
  nodes: StudioGraphNodeDto[];
  edges: StudioGraphEdgeDto[];
  pageInfo: StudioGraphPageInfoDto;
  truncated: boolean;
  truncationReason: string | null;
  partialScopeNotice: string;
  externalState: ExternalIntegrationState | 'NOT_APPLICABLE';
  metrics: StudioGraphMetricsDto;
}

export interface StudioGraphMetadataDto {
  modes: StudioGraphMode[];
  defaultLimit: number;
  maxLimit: number;
  collaborationEnabled: boolean;
  policyNotice: string;
}

export interface EditorialAssertionDto {
  property: string;
  value: string;
  source: 'anime-offline-database' | 'mangaupdates' | 'wikidata' | 'manual_curation';
  sourceEntityId: string;
  sourceUrl: string | null;
  license: string;
  verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'CONFLICT';
  capturedAt: string;
}

export interface EditorialConflictDto {
  property: string;
  assertions: EditorialAssertionDto[];
  resolutionStatus: 'OPEN' | 'RESOLVED';
}

export interface AnimeEditorialResponseDto {
  animeId: string;
  animeTitle: string;
  originalMediaType: string | null;
  mangaTitle: string | null;
  authors: string[];
  publishers: Array<{ name: string; context: string; source: string }>;
  assertions: EditorialAssertionDto[];
  conflicts: EditorialConflictDto[];
  providerStates: {
    mangaupdates: ExternalIntegrationState;
    wikidata: ExternalIntegrationState;
  };
  attributionNotice: string;
}

export type LoreMediaKind = 'ANIME' | 'MANGA';

export interface LoreEventDto {
  id: string;
  workId: string;
  media: LoreMediaKind;
  version: string;
  arcId: string;
  arcName: string;
  title: string;
  summary: string;
  chronologicalOrder: number;
  releaseOrder: number;
  spoilerPosition: number; // episode or chapter position in the SAME media/version; 0 = spoiler-free premise
  evidenceRef: string;
  publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED' | 'RETRACTED';
}

export interface LoreEntityDto {
  id: string;
  kind: 'CHARACTER' | 'ORGANIZATION' | 'LOCATION';
  name: string;
  firstSafePosition: number;
}

export interface LoreRelationDto {
  id: string;
  fromId: string;
  toId: string;
  relationKind: 'PRECEDES' | 'CAUSES' | 'PARTICIPATES_IN' | 'MEMBER_OF' | 'OCCURS_AT';
  minSafePosition: number;
  evidenceRef: string;
}

export interface LoreGraphResponseDto {
  workId: string;
  media: LoreMediaKind;
  version: string;
  appliedMaxPosition: number;
  spoilersUnlocked: boolean;
  notice: string;
  events: LoreEventDto[];
  entities: LoreEntityDto[];
  relations: LoreRelationDto[];
}
