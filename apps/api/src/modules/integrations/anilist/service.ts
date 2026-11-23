import type {
  AniListCharactersResponseDto,
  AniListExternalStatusDto,
  AniListMediaOverviewDto,
  AniListMetricsDto,
  AniListStaffResponseDto,
  AniListStudiosResponseDto,
  ExternalIntegrationState,
  GraphEdgeDto,
  GraphNodeDto,
  NetworkGraphResponseDto,
} from '@animeverse/contracts';
import type { AniListClient, AniListClientResult } from './client.js';
import type { AniListIdentityResolver } from './identity-resolver.js';
import {
  ANILIST_ATTRIBUTION,
  mapCharacterEdges,
  mapMediaOverview,
  mapPageInfo,
  mapStaffEdges,
  mapStudioEdges,
} from './mapper.js';
import type {
  RawAniListCharacterEdge,
  RawAniListMediaOverview,
  RawAniListPageInfo,
  RawAniListStaffEdge,
  RawAniListStudioEdge,
} from './models.js';
import {
  ANILIST_MEDIA_CHARACTERS_QUERY,
  ANILIST_MEDIA_OVERVIEW_QUERY,
  ANILIST_MEDIA_STAFF_QUERY,
  ANILIST_MEDIA_STUDIOS_QUERY,
} from './queries.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class AniListIntegrationService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private cacheHits = 0;

  constructor(
    private readonly client: AniListClient,
    private readonly resolver?: AniListIdentityResolver,
    private readonly cacheTtlMs = 300_000,
    private readonly cacheMaxEntries = 200,
  ) {}

  getMetrics(): AniListMetricsDto {
    return this.client.getMetrics(this.cacheHits);
  }

  async getExternalStatus(animeId: string): Promise<AniListExternalStatusDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    const enabled = this.client.isEnabled();
    const linked = identity.anilistId !== null;
    const message = !enabled
      ? 'AniList enrichment is disabled by configuration (ENRICHMENT_ANILIST_ENABLED=false).'
      : linked
        ? 'Anime linked via verified AniList external_reference. Queries execute on-demand without persistent replication.'
        : 'Anime does not have a verified AniList external_reference in the local catalog.';

    return {
      animeId: identity.animeId,
      provider: 'anilist',
      enabled,
      linked,
      anilistId: identity.anilistId,
      siteUrl: identity.siteUrl,
      storagePolicy: 'TRANSIENT_MEMORY_ONLY',
      message,
    };
  }

  async getMediaOverview(animeId: string): Promise<AniListMediaOverviewDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    if (!this.client.isEnabled()) {
      return this.emptyOverview('DISABLED', identity.anilistId, 'AniList integration is disabled.');
    }
    if (identity.anilistId === null) {
      return this.emptyOverview('UNLINKED', null, 'No verified AniList ID linked to this anime.');
    }

    const cacheKey = `overview:${identity.anilistId}`;
    const cached = this.readCache<AniListMediaOverviewDto>(cacheKey);
    if (cached) return { ...cached, cached: true };

    const res = await this.client.execute<{ Media?: RawAniListMediaOverview | null }>(
      cacheKey,
      ANILIST_MEDIA_OVERVIEW_QUERY,
      { id: identity.anilistId },
    );

    if (!res.ok) {
      return this.emptyOverview(this.mapErrorState(res), identity.anilistId, res.message);
    }
    if (!res.data.Media) {
      return this.emptyOverview('UNLINKED', identity.anilistId, 'Media not found on AniList.');
    }

    const mapped = mapMediaOverview(res.data.Media, false);
    this.writeCache(cacheKey, mapped);
    return mapped;
  }

  async getCharacters(
    animeId: string,
    page: number,
    perPage: number,
  ): Promise<AniListCharactersResponseDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    if (!this.client.isEnabled()) {
      return this.emptyCharacters(
        'DISABLED',
        identity.anilistId,
        page,
        perPage,
        'AniList integration is disabled.',
      );
    }
    if (identity.anilistId === null) {
      return this.emptyCharacters(
        'UNLINKED',
        null,
        page,
        perPage,
        'No verified AniList ID linked to this anime.',
      );
    }

    const cacheKey = `chars:${identity.anilistId}:${page}:${perPage}`;
    const cached = this.readCache<AniListCharactersResponseDto>(cacheKey);
    if (cached) return cached;

    const res = await this.client.execute<{
      Media?: {
        characters?: {
          pageInfo?: RawAniListPageInfo | null;
          edges?: Array<RawAniListCharacterEdge | null> | null;
        } | null;
      } | null;
    }>(cacheKey, ANILIST_MEDIA_CHARACTERS_QUERY, { id: identity.anilistId, page, perPage });

    if (!res.ok) {
      return this.emptyCharacters(
        this.mapErrorState(res),
        identity.anilistId,
        page,
        perPage,
        res.message,
      );
    }

    const conn = res.data.Media?.characters;
    const payload: AniListCharactersResponseDto = {
      state: 'OK',
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId: identity.anilistId,
      pageInfo: mapPageInfo(conn?.pageInfo, page, perPage),
      items: mapCharacterEdges(conn?.edges),
    };
    this.writeCache(cacheKey, payload);
    return payload;
  }

  async getStaff(
    animeId: string,
    page: number,
    perPage: number,
  ): Promise<AniListStaffResponseDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    if (!this.client.isEnabled()) {
      return this.emptyStaff(
        'DISABLED',
        identity.anilistId,
        page,
        perPage,
        'AniList integration is disabled.',
      );
    }
    if (identity.anilistId === null) {
      return this.emptyStaff(
        'UNLINKED',
        null,
        page,
        perPage,
        'No verified AniList ID linked to this anime.',
      );
    }

    const cacheKey = `staff:${identity.anilistId}:${page}:${perPage}`;
    const cached = this.readCache<AniListStaffResponseDto>(cacheKey);
    if (cached) return cached;

    const res = await this.client.execute<{
      Media?: {
        staff?: {
          pageInfo?: RawAniListPageInfo | null;
          edges?: Array<RawAniListStaffEdge | null> | null;
        } | null;
      } | null;
    }>(cacheKey, ANILIST_MEDIA_STAFF_QUERY, { id: identity.anilistId, page, perPage });

    if (!res.ok) {
      return this.emptyStaff(
        this.mapErrorState(res),
        identity.anilistId,
        page,
        perPage,
        res.message,
      );
    }

    const conn = res.data.Media?.staff;
    const payload: AniListStaffResponseDto = {
      state: 'OK',
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId: identity.anilistId,
      pageInfo: mapPageInfo(conn?.pageInfo, page, perPage),
      items: mapStaffEdges(conn?.edges),
    };
    this.writeCache(cacheKey, payload);
    return payload;
  }

  async getStudios(animeId: string): Promise<AniListStudiosResponseDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    if (!this.client.isEnabled()) {
      return this.emptyStudios('DISABLED', identity.anilistId, 'AniList integration is disabled.');
    }
    if (identity.anilistId === null) {
      return this.emptyStudios('UNLINKED', null, 'No verified AniList ID linked to this anime.');
    }

    const cacheKey = `studios:${identity.anilistId}`;
    const cached = this.readCache<AniListStudiosResponseDto>(cacheKey);
    if (cached) return cached;

    const res = await this.client.execute<{
      Media?: {
        studios?: {
          edges?: Array<RawAniListStudioEdge | null> | null;
        } | null;
      } | null;
    }>(cacheKey, ANILIST_MEDIA_STUDIOS_QUERY, { id: identity.anilistId });

    if (!res.ok) {
      return this.emptyStudios(this.mapErrorState(res), identity.anilistId, res.message);
    }

    const payload: AniListStudiosResponseDto = {
      state: 'OK',
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId: identity.anilistId,
      items: mapStudioEdges(res.data.Media?.studios?.edges),
    };
    this.writeCache(cacheKey, payload);
    return payload;
  }

  async getStudioGraphStaffExpansion(
    animeId: string,
    limit: number,
  ): Promise<NetworkGraphResponseDto | null> {
    if (!this.resolver) return null;
    const identity = await this.resolver.resolveByAnimeId(animeId);
    if (!identity) return null;

    const safeLimit = Math.min(30, Math.max(1, limit));
    const [staffRes, studiosRes] = await Promise.all([
      this.getStaff(animeId, 1, safeLimit),
      this.getStudios(animeId),
    ]);

    const centerNodeId = `anime:${identity.animeId}`;
    const nodesMap = new Map<string, GraphNodeDto>();
    nodesMap.set(centerNodeId, {
      id: centerNodeId,
      label: identity.animeTitle,
      kind: 'ANIME',
      isCenter: true,
    });

    const edgesMap = new Map<string, GraphEdgeDto>();

    for (const studio of studiosRes?.items ?? []) {
      const studioNodeId = `studio:anilist:${studio.id}`;
      if (!nodesMap.has(studioNodeId)) {
        nodesMap.set(studioNodeId, {
          id: studioNodeId,
          label: studio.name,
          kind: studio.isAnimationStudio ? 'STUDIO' : 'PRODUCER',
        });
      }
      const edgeId = `${centerNodeId}->${studioNodeId}`;
      edgesMap.set(edgeId, {
        id: edgeId,
        source: centerNodeId,
        target: studioNodeId,
        label: studio.isMain ? 'MAIN_STUDIO' : studio.isAnimationStudio ? 'STUDIO' : 'PRODUCER',
        relationType: studio.isAnimationStudio ? 'STUDIO' : 'PRODUCER',
      });
    }

    for (const person of staffRes?.items ?? []) {
      const personNodeId = `person:anilist:${person.id}`;
      if (!nodesMap.has(personNodeId)) {
        nodesMap.set(personNodeId, {
          id: personNodeId,
          label: person.name,
          kind: 'PERSON',
          roleLabel: person.role,
        });
      }
      const edgeId = `${centerNodeId}->${personNodeId}:${person.role}`;
      edgesMap.set(edgeId, {
        id: edgeId,
        source: centerNodeId,
        target: personNodeId,
        label: person.role,
        relationType: 'STAFF_ROLE',
      });
    }

    return {
      centerId: centerNodeId,
      depth: 1,
      truncated: Boolean(staffRes?.pageInfo.hasNextPage),
      notice:
        staffRes?.state === 'OK'
          ? 'StudioGraph staff expansion loaded on-demand from AniList GraphQL API (bounded, transient, not stored in PostgreSQL).'
          : (staffRes?.message ?? 'AniList staff data unavailable.'),
      nodes: [...nodesMap.values()],
      edges: [...edgesMap.values()],
    };
  }

  private mapErrorState(
    res: Extract<AniListClientResult<unknown>, { ok: false }>,
  ): ExternalIntegrationState {
    if (res.kind === 'DISABLED') return 'DISABLED';
    if (res.kind === 'RATE_LIMITED') return 'RATE_LIMITED';
    if (res.kind === 'UNAVAILABLE' || res.kind === 'FORBIDDEN') return 'UNAVAILABLE';
    return 'ERROR';
  }

  private readCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    this.cacheHits += 1;
    return entry.value as T;
  }

  private writeCache<T>(key: string, value: T): void {
    if (this.cache.size >= this.cacheMaxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }

  private emptyOverview(
    state: ExternalIntegrationState,
    anilistId: number | null,
    message: string,
  ): AniListMediaOverviewDto {
    return {
      state,
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      cached: false,
      anilistId,
      siteUrl: anilistId ? `https://anilist.co/anime/${anilistId}` : null,
      format: null,
      status: null,
      descriptionPlain: null,
      isAdult: false,
      externalLinks: [],
      message,
    };
  }

  private emptyCharacters(
    state: ExternalIntegrationState,
    anilistId: number | null,
    page: number,
    perPage: number,
    message: string,
  ): AniListCharactersResponseDto {
    return {
      state,
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId,
      pageInfo: { currentPage: page, perPage, hasNextPage: false, total: null },
      items: [],
      message,
    };
  }

  private emptyStaff(
    state: ExternalIntegrationState,
    anilistId: number | null,
    page: number,
    perPage: number,
    message: string,
  ): AniListStaffResponseDto {
    return {
      state,
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId,
      pageInfo: { currentPage: page, perPage, hasNextPage: false, total: null },
      items: [],
      message,
    };
  }

  private emptyStudios(
    state: ExternalIntegrationState,
    anilistId: number | null,
    message: string,
  ): AniListStudiosResponseDto {
    return {
      state,
      source: 'anilist',
      attribution: ANILIST_ATTRIBUTION,
      anilistId,
      items: [],
      message,
    };
  }
}
