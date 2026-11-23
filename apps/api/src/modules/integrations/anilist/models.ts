export interface AniListClientConfig {
  enabled: boolean;
  endpoint: string;
  timeoutMs: number;
  maxRequestsPerMinute: number;
  maxConcurrent: number;
  maxRetries: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;
}

export interface RawAniListPageInfo {
  currentPage?: number | null;
  perPage?: number | null;
  hasNextPage?: boolean | null;
  total?: number | null;
}

export interface RawAniListMediaOverview {
  id: number;
  siteUrl?: string | null;
  format?: string | null;
  status?: string | null;
  description?: string | null;
  isAdult?: boolean | null;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  } | null;
  externalLinks?: Array<{ site?: string | null; url?: string | null } | null> | null;
}

export interface RawAniListCharacterEdge {
  role?: string | null;
  node?: {
    id?: number | null;
    name?: {
      full?: string | null;
      alternative?: Array<string | null> | null;
    } | null;
  } | null;
  voiceActors?: Array<{
    id?: number | null;
    name?: { full?: string | null } | null;
    languageV2?: string | null;
  } | null> | null;
}

export interface RawAniListStaffEdge {
  role?: string | null;
  node?: {
    id?: number | null;
    name?: { full?: string | null } | null;
  } | null;
}

export interface RawAniListStudioEdge {
  isMain?: boolean | null;
  node?: {
    id?: number | null;
    name?: string | null;
    isAnimationStudio?: boolean | null;
  } | null;
}

export interface AniListGraphQLResponse<TData> {
  data?: TData | null;
  errors?: Array<{ message?: string; status?: number }> | null;
}
