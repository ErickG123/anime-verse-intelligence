export type DataSourceKind = 'DATASET_JSONL' | 'GRAPHQL_API' | 'REST_API' | 'SPARQL_API';
export type DataSourceStatus = 'ACTIVE' | 'INACTIVE';

export interface SourcePermissions {
  fetch: boolean;
  store: boolean;
  redistribute: boolean;
}

export interface GovernedDataSource {
  sourceId: string;
  name: string;
  kind: DataSourceKind;
  endpoint: string;
  documentationUrl: string;
  status: DataSourceStatus;
  license: string;
  attribution: string;
  policyVersion: string;
  lastCheckedAt: string;
  permissions: SourcePermissions;
  cacheTtlSeconds: number | null;
  notes: string;
}

export const DATA_SOURCE_REGISTRY: readonly GovernedDataSource[] = [
  {
    sourceId: 'anime-offline-database',
    name: 'cedya77/anime-offline-database',
    kind: 'DATASET_JSONL',
    endpoint:
      'https://github.com/cedya77/anime-offline-database/releases/download/latest/anime-offline-database.jsonl',
    documentationUrl: 'https://github.com/cedya77/anime-offline-database',
    status: 'ACTIVE',
    license: 'ODbL 1.0 / DbCL 1.0',
    attribution:
      'cedya77/anime-offline-database (continuation of manami-project/anime-offline-database)',
    policyVersion: '1.0',
    lastCheckedAt: '2026-11-23T00:00:00.000Z',
    permissions: {
      fetch: true,
      store: true,
      redistribute: false,
    },
    cacheTtlSeconds: null,
    notes: 'Initial MVP source. JSONL line 1 is metadata; relatedAnime has UNSPECIFIED semantics.',
  },
  {
    sourceId: 'anilist',
    name: 'AniList GraphQL API',
    kind: 'GRAPHQL_API',
    endpoint: 'https://graphql.anilist.co',
    documentationUrl: 'https://docs.anilist.co/guide/terms-of-use',
    status: 'INACTIVE',
    license: 'AniList Terms of Use',
    attribution: 'AniList',
    policyVersion: '1.0',
    lastCheckedAt: '2026-11-23T00:00:00.000Z',
    permissions: {
      fetch: false,
      store: false,
      redistribute: false,
    },
    cacheTtlSeconds: 0,
    notes: 'Disabled in MVP. Mass mirroring / storage as a database is prohibited by AniList TOS.',
  },
  {
    sourceId: 'wikidata',
    name: 'Wikidata Query Service',
    kind: 'SPARQL_API',
    endpoint: 'https://query.wikidata.org/sparql',
    documentationUrl: 'https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service',
    status: 'INACTIVE',
    license: 'CC0 1.0',
    attribution: 'Wikidata contributors',
    policyVersion: '1.0',
    lastCheckedAt: '2026-11-23T00:00:00.000Z',
    permissions: {
      fetch: false,
      store: false,
      redistribute: false,
    },
    cacheTtlSeconds: 86400,
    notes: 'Disabled in MVP. Candidate for low-risk post-MVP opt-in enrichment.',
  },
  {
    sourceId: 'mangaupdates',
    name: 'MangaUpdates API',
    kind: 'REST_API',
    endpoint: 'https://api.mangaupdates.com/v1',
    documentationUrl: 'https://api.mangaupdates.com/',
    status: 'INACTIVE',
    license: 'MangaUpdates Terms of Use',
    attribution: 'MangaUpdates',
    policyVersion: '1.0',
    lastCheckedAt: '2026-11-23T00:00:00.000Z',
    permissions: {
      fetch: false,
      store: false,
      redistribute: false,
    },
    cacheTtlSeconds: 0,
    notes: 'Disabled in MVP. Planned for post-MVP manga/adaptation research after legal review.',
  },
  {
    sourceId: 'tmdb',
    name: 'The Movie Database (TMDB)',
    kind: 'REST_API',
    endpoint: 'https://api.themoviedb.org/3',
    documentationUrl: 'https://www.themoviedb.org/api-terms-of-use',
    status: 'INACTIVE',
    license: 'TMDB API Terms of Use',
    attribution: 'TMDB',
    policyVersion: '1.0',
    lastCheckedAt: '2026-11-23T00:00:00.000Z',
    permissions: {
      fetch: false,
      store: false,
      redistribute: false,
    },
    cacheTtlSeconds: 0,
    notes: 'Disabled in MVP. Requires server API token and attribution compliance.',
  },
] as const;

export function getGovernedSource(sourceId: string): GovernedDataSource | undefined {
  return DATA_SOURCE_REGISTRY.find((s) => s.sourceId === sourceId);
}

export function assertSourceCanStore(sourceId: string): GovernedDataSource {
  const source = getGovernedSource(sourceId);
  if (!source) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }
  if (source.status !== 'ACTIVE' || !source.permissions.store) {
    throw new Error(
      `Data source "${sourceId}" is not authorized for persistence (status=${source.status}, store=${source.permissions.store}).`,
    );
  }
  return source;
}
