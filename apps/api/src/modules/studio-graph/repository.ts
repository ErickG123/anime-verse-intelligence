import { and, asc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type {
  AnimeType,
  CompanyRole,
  ExternalIntegrationState,
  StudioGraphEdgeDto,
  StudioGraphMode,
  StudioGraphNodeDto,
  StudioGraphPageDto,
} from '@animeverse/contracts';
import type { AppDatabase } from '../../db/client.js';
import { anime, animeCompany, company } from '../../db/schema.js';
import type { AniListIntegrationService } from '../integrations/anilist/service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedTypedNodeId {
  kind: 'ANIME' | 'COMPANY';
  uuid: string;
  canonicalId: string;
}

export function parseTypedNodeId(raw: string): ParsedTypedNodeId | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(anime|studio|company|producer):(.+)$/i);
  if (!match?.[1] || !match[2]) return null;
  const prefix = match[1].toLowerCase();
  const uuid = match[2];
  if (!UUID_REGEX.test(uuid)) return null;

  if (prefix === 'anime') {
    return { kind: 'ANIME', uuid, canonicalId: `anime:${uuid}` };
  }
  return { kind: 'COMPANY', uuid, canonicalId: `company:${uuid}` };
}

export interface StudioGraphQueryParams {
  anchorId: string;
  mode: StudioGraphMode;
  role?: CompanyRole;
  yearFrom?: number;
  yearTo?: number;
  limit: number;
  offset: number;
}

export interface StudioGraphRepository {
  queryGraph(params: StudioGraphQueryParams): Promise<StudioGraphPageDto | null>;
  getNodeNeighbors(
    nodeId: string,
    options: {
      role?: CompanyRole;
      yearFrom?: number;
      yearTo?: number;
      limit: number;
      offset: number;
    },
  ): Promise<StudioGraphPageDto | null>;
}

function buildMetrics(
  nodes: readonly StudioGraphNodeDto[],
  edges: readonly StudioGraphEdgeDto[],
  sourceScope: string,
) {
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    animeCount: nodes.filter((n) => n.kind === 'ANIME').length,
    companyCount: nodes.filter((n) => n.kind === 'STUDIO' || n.kind === 'PRODUCER').length,
    personCount: nodes.filter((n) => n.kind === 'PERSON').length,
    sourceScope,
  };
}

export class DrizzleStudioGraphRepository implements StudioGraphRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly anilistService?: AniListIntegrationService,
  ) {}

  async queryGraph(params: StudioGraphQueryParams): Promise<StudioGraphPageDto | null> {
    const parsed = parseTypedNodeId(params.anchorId);
    if (!parsed) return null;

    if (parsed.kind === 'COMPANY') {
      return this.queryCompanyCentered(parsed.uuid, params);
    }
    return this.queryAnimeCentered(parsed.uuid, params);
  }

  async getNodeNeighbors(
    nodeId: string,
    options: {
      role?: CompanyRole;
      yearFrom?: number;
      yearTo?: number;
      limit: number;
      offset: number;
    },
  ): Promise<StudioGraphPageDto | null> {
    return this.queryGraph({
      anchorId: nodeId,
      mode: 'PRODUCTION',
      role: options.role,
      yearFrom: options.yearFrom,
      yearTo: options.yearTo,
      limit: options.limit,
      offset: options.offset,
    });
  }

  private async queryCompanyCentered(
    companyUuid: string,
    params: StudioGraphQueryParams,
  ): Promise<StudioGraphPageDto | null> {
    const [comp] = await this.db.select().from(company).where(eq(company.id, companyUuid)).limit(1);
    if (!comp) return null;

    const conditions: SQL[] = [eq(animeCompany.companyId, comp.id)];
    if (params.role) conditions.push(eq(animeCompany.role, params.role));
    if (params.yearFrom !== undefined) conditions.push(gte(anime.seasonYear, params.yearFrom));
    if (params.yearTo !== undefined) conditions.push(lte(anime.seasonYear, params.yearTo));

    const rows = await this.db
      .select({
        role: animeCompany.role,
        animeId: anime.id,
        title: anime.title,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(animeCompany)
      .innerJoin(anime, eq(anime.id, animeCompany.animeId))
      .where(and(...conditions))
      .orderBy(asc(anime.normalizedTitle), asc(anime.id))
      .limit(params.limit + 1)
      .offset(params.offset);

    const hasMore = rows.length > params.limit;
    const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

    const centerKind: 'STUDIO' | 'PRODUCER' =
      params.role === 'PRODUCER' ||
      (pageRows.length > 0 && pageRows.every((r) => r.role === 'PRODUCER'))
        ? 'PRODUCER'
        : 'STUDIO';

    const centerId = `company:${comp.id}`;
    const nodesMap = new Map<string, StudioGraphNodeDto>();
    nodesMap.set(centerId, {
      id: centerId,
      kind: centerKind,
      label: comp.name,
      internalId: comp.id,
      provenance: 'LOCAL_DB',
      roleLabel: centerKind,
      isCenter: true,
    });

    const edgesMap = new Map<string, StudioGraphEdgeDto>();
    for (const r of pageRows) {
      const animeNodeId = `anime:${r.animeId}`;
      if (!nodesMap.has(animeNodeId)) {
        nodesMap.set(animeNodeId, {
          id: animeNodeId,
          kind: 'ANIME',
          label: r.title,
          internalId: r.animeId,
          provenance: 'LOCAL_DB',
          animeType: r.type as AnimeType,
          seasonYear: r.seasonYear,
          accessibleUrl: `/catalog/${r.animeId}`,
        });
      }
      const role = r.role as CompanyRole;
      const edgeId = `${centerId}->${animeNodeId}:${role}`;
      edgesMap.set(edgeId, {
        id: edgeId,
        source: centerId,
        target: animeNodeId,
        relationKind: role,
        creditRole: role,
        provenance: 'LOCAL_DB',
        evidenceContext: 'anime-offline-database',
      });
    }

    const nodes = [...nodesMap.values()];
    const edges = [...edgesMap.values()];
    const notice =
      params.mode === 'COLLABORATION'
        ? 'Company anchor displays verified local production links only; select an anime node to inspect on-demand AniList staff credits when enabled.'
        : 'Local verified company-to-anime links from anime-offline-database (bounded page).';

    return {
      anchorId: centerId,
      mode: params.mode,
      nodes,
      edges,
      pageInfo: {
        limit: params.limit,
        offset: params.offset,
        hasMore,
        nextOffset: hasMore ? params.offset + params.limit : null,
      },
      truncated: hasMore,
      truncationReason: hasMore
        ? `Limited to ${params.limit} edges per page; load more to expand.`
        : null,
      partialScopeNotice: notice,
      externalState: 'NOT_APPLICABLE',
      metrics: buildMetrics(nodes, edges, 'LOCAL_DB (anime-offline-database)'),
    };
  }

  private async queryAnimeCentered(
    animeUuid: string,
    params: StudioGraphQueryParams,
  ): Promise<StudioGraphPageDto | null> {
    const [animeRow] = await this.db
      .select({
        id: anime.id,
        title: anime.title,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(anime)
      .where(eq(anime.id, animeUuid))
      .limit(1);
    if (!animeRow) return null;

    const conditions: SQL[] = [eq(animeCompany.animeId, animeRow.id)];
    if (params.role) conditions.push(eq(animeCompany.role, params.role));

    const compRows = await this.db
      .select({
        companyId: company.id,
        name: company.name,
        role: animeCompany.role,
      })
      .from(animeCompany)
      .innerJoin(company, eq(company.id, animeCompany.companyId))
      .where(and(...conditions))
      .orderBy(asc(company.normalizedName))
      .limit(params.limit + 1)
      .offset(params.offset);

    const hasMoreLocal = compRows.length > params.limit;
    const pageCompRows = hasMoreLocal ? compRows.slice(0, params.limit) : compRows;

    const centerId = `anime:${animeRow.id}`;
    const nodesMap = new Map<string, StudioGraphNodeDto>();
    nodesMap.set(centerId, {
      id: centerId,
      kind: 'ANIME',
      label: animeRow.title,
      internalId: animeRow.id,
      provenance: 'LOCAL_DB',
      animeType: animeRow.type as AnimeType,
      seasonYear: animeRow.seasonYear,
      accessibleUrl: `/catalog/${animeRow.id}`,
      isCenter: true,
    });

    const edgesMap = new Map<string, StudioGraphEdgeDto>();
    for (const c of pageCompRows) {
      const compNodeId = `company:${c.companyId}`;
      const role = c.role as CompanyRole;
      if (!nodesMap.has(compNodeId)) {
        nodesMap.set(compNodeId, {
          id: compNodeId,
          kind: role,
          label: c.name,
          internalId: c.companyId,
          provenance: 'LOCAL_DB',
          roleLabel: role,
        });
      }
      const edgeId = `${centerId}->${compNodeId}:${role}`;
      edgesMap.set(edgeId, {
        id: edgeId,
        source: centerId,
        target: compNodeId,
        relationKind: role,
        creditRole: role,
        provenance: 'LOCAL_DB',
        evidenceContext: 'anime-offline-database',
      });
    }

    let externalState: ExternalIntegrationState | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let hasMoreStaff = false;
    let sourceScope = 'LOCAL_DB (anime-offline-database)';
    let notice = 'Local verified production links from anime-offline-database.';

    if (params.mode === 'COLLABORATION') {
      if (!this.anilistService) {
        externalState = 'DISABLED';
        notice =
          'AniList collaboration service is not configured; showing local production links only.';
      } else {
        const staffLimit = Math.min(25, params.limit);
        const staffRes = await this.anilistService.getStaff(animeRow.id, 1, staffLimit);
        externalState = staffRes?.state ?? 'UNAVAILABLE';
        hasMoreStaff = Boolean(staffRes?.pageInfo.hasNextPage);

        if (staffRes?.state === 'OK') {
          sourceScope = 'LOCAL_DB + ANILIST_ON_DEMAND (transient, bounded)';
          notice =
            'Co-credits reflect verified staff listed on this work via AniList on-demand API (not stored in PostgreSQL; partial by page limit).';
          for (const person of staffRes.items) {
            const personNodeId = `person:anilist:${person.id}`;
            if (!nodesMap.has(personNodeId)) {
              nodesMap.set(personNodeId, {
                id: personNodeId,
                kind: 'PERSON',
                label: person.name,
                internalId: null,
                provenance: 'ANILIST_ON_DEMAND',
                roleLabel: person.role,
              });
            }
            const edgeId = `${centerId}->${personNodeId}:${person.role}`;
            edgesMap.set(edgeId, {
              id: edgeId,
              source: centerId,
              target: personNodeId,
              relationKind: 'STAFF_ROLE',
              creditRole: person.role,
              provenance: 'ANILIST_ON_DEMAND',
              evidenceContext: animeRow.title,
            });
          }
        } else {
          notice =
            staffRes?.message ??
            'External staff credits unavailable; displaying local production links only.';
        }
      }
    }

    const nodes = [...nodesMap.values()];
    const edges = [...edgesMap.values()];
    const truncated = hasMoreLocal || hasMoreStaff;

    return {
      anchorId: centerId,
      mode: params.mode,
      nodes,
      edges,
      pageInfo: {
        limit: params.limit,
        offset: params.offset,
        hasMore: hasMoreLocal,
        nextOffset: hasMoreLocal ? params.offset + params.limit : null,
      },
      truncated,
      truncationReason: truncated
        ? 'Graph page truncated by safe limit; expand incrementally to inspect additional neighbors.'
        : null,
      partialScopeNotice: notice,
      externalState,
      metrics: buildMetrics(nodes, edges, sourceScope),
    };
  }
}
