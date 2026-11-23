import { and, asc, desc, eq, exists, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type {
  AnimeDetailDto,
  AnimeSeason,
  AnimeSortField,
  AnimeStatus,
  AnimeSummaryDto,
  AnimeType,
  CompanyRole,
  CompanySummaryDto,
  PaginatedResponse,
  RelatedAnimeItemDto,
  SortOrder,
  StatisticsOverviewDto,
} from '@animeverse/contracts';
import type { AppDatabase } from '../../db/client.js';
import {
  anime,
  animeAlias,
  animeCompany,
  animeRelationship,
  animeTag,
  company,
  dataSource,
  externalReference,
  sourceSnapshot,
  tag,
} from '../../db/schema.js';
import { normalizeSearchText } from '../sources/url-normalizer.js';

export interface CatalogSearchParams {
  q?: string;
  type?: AnimeType;
  status?: AnimeStatus;
  season?: AnimeSeason;
  year?: number;
  tag?: string;
  studio?: string;
  producer?: string;
  sortBy: AnimeSortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface StudioSearchParams {
  q?: string;
  role?: CompanyRole;
  page: number;
  pageSize: number;
}

export interface CatalogRepository {
  searchAnime(params: CatalogSearchParams): Promise<PaginatedResponse<AnimeSummaryDto>>;
  getAnimeById(id: string): Promise<AnimeDetailDto | null>;
  getRelatedAnime(id: string): Promise<RelatedAnimeItemDto[] | null>;
  listCompanies(params: StudioSearchParams): Promise<PaginatedResponse<CompanySummaryDto>>;
  getCompanyAnime(
    companyId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<AnimeSummaryDto> | null>;
  getStatisticsOverview(): Promise<StatisticsOverviewDto>;
}

const SORT_COLUMNS = {
  title: anime.normalizedTitle,
  year: anime.seasonYear,
  episodes: anime.episodes,
  score: anime.scoreArithmeticMean,
  updatedAt: anime.updatedAt,
} as const;

export class DrizzleCatalogRepository implements CatalogRepository {
  constructor(private readonly db: AppDatabase) {}

  async searchAnime(params: CatalogSearchParams): Promise<PaginatedResponse<AnimeSummaryDto>> {
    const conditions: SQL[] = [];

    if (params.q && params.q.trim()) {
      const pattern = `%${normalizeSearchText(params.q)}%`;
      conditions.push(
        or(
          ilike(anime.normalizedTitle, pattern),
          exists(
            this.db
              .select({ one: sql`1` })
              .from(animeAlias)
              .where(
                and(eq(animeAlias.animeId, anime.id), ilike(animeAlias.normalizedAlias, pattern)),
              ),
          ),
        )!,
      );
    }

    if (params.type) conditions.push(eq(anime.type, params.type));
    if (params.status) conditions.push(eq(anime.status, params.status));
    if (params.season) conditions.push(eq(anime.season, params.season));
    if (params.year !== undefined) conditions.push(eq(anime.seasonYear, params.year));

    if (params.tag && params.tag.trim()) {
      const normTag = normalizeSearchText(params.tag);
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(animeTag)
            .innerJoin(tag, eq(tag.id, animeTag.tagId))
            .where(and(eq(animeTag.animeId, anime.id), eq(tag.normalizedName, normTag))),
        ),
      );
    }

    if (params.studio && params.studio.trim()) {
      const normStudio = normalizeSearchText(params.studio);
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(animeCompany)
            .innerJoin(company, eq(company.id, animeCompany.companyId))
            .where(
              and(
                eq(animeCompany.animeId, anime.id),
                eq(animeCompany.role, 'STUDIO'),
                ilike(company.normalizedName, `%${normStudio}%`),
              ),
            ),
        ),
      );
    }

    if (params.producer && params.producer.trim()) {
      const normProducer = normalizeSearchText(params.producer);
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(animeCompany)
            .innerJoin(company, eq(company.id, animeCompany.companyId))
            .where(
              and(
                eq(animeCompany.animeId, anime.id),
                eq(animeCompany.role, 'PRODUCER'),
                ilike(company.normalizedName, `%${normProducer}%`),
              ),
            ),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = SORT_COLUMNS[params.sortBy];
    const orderExpr = params.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);
    const offset = (params.page - 1) * params.pageSize;

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(anime)
      .where(whereClause);
    const total = countRow?.count ?? 0;

    const rows = await this.db
      .select()
      .from(anime)
      .where(whereClause)
      .orderBy(orderExpr, asc(anime.id))
      .limit(params.pageSize)
      .offset(offset);

    const items = await this.hydrateSummaries(rows);
    return {
      items,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async getAnimeById(id: string): Promise<AnimeDetailDto | null> {
    const [row] = await this.db.select().from(anime).where(eq(anime.id, id)).limit(1);
    if (!row) return null;

    const [aliases, refs, companies, tags, relCountRow, sourceRow, snapRow] = await Promise.all([
      this.db
        .select({ alias: animeAlias.alias })
        .from(animeAlias)
        .where(eq(animeAlias.animeId, id)),
      this.db
        .select({
          provider: externalReference.provider,
          externalId: externalReference.externalId,
          normalizedUrl: externalReference.normalizedUrl,
        })
        .from(externalReference)
        .where(eq(externalReference.animeId, id)),
      this.db
        .select({
          id: company.id,
          name: company.name,
          role: animeCompany.role,
        })
        .from(animeCompany)
        .innerJoin(company, eq(company.id, animeCompany.companyId))
        .where(eq(animeCompany.animeId, id)),
      this.db
        .select({ name: tag.name })
        .from(animeTag)
        .innerJoin(tag, eq(tag.id, animeTag.tagId))
        .where(eq(animeTag.animeId, id)),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(animeRelationship)
        .where(
          or(eq(animeRelationship.sourceAnimeId, id), eq(animeRelationship.targetAnimeId, id)),
        ),
      row.primarySourceId
        ? this.db.select().from(dataSource).where(eq(dataSource.id, row.primarySourceId)).limit(1)
        : Promise.resolve([]),
      row.lastSnapshotId
        ? this.db
            .select()
            .from(sourceSnapshot)
            .where(eq(sourceSnapshot.id, row.lastSnapshotId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    const src = sourceRow[0];
    const snap = snapRow[0];

    return {
      id: row.id,
      title: row.title,
      type: row.type as AnimeType,
      episodes: row.episodes,
      status: row.status as AnimeStatus,
      season: row.season as AnimeSeason,
      seasonYear: row.seasonYear,
      durationSeconds: row.durationSeconds,
      scoreArithmeticMean: row.scoreArithmeticMean,
      scoreMedian: row.scoreMedian,
      pictureUrl: row.pictureUrl,
      thumbnailUrl: row.thumbnailUrl,
      studios: companies.filter((c) => c.role === 'STUDIO').map((c) => c.name),
      tags: tags.map((t) => t.name),
      aliases: aliases.map((a) => a.alias),
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role as CompanyRole,
      })),
      externalReferences: refs,
      relatedCount: relCountRow[0]?.count ?? 0,
      provenance: {
        sourceSlug: src?.slug ?? null,
        sourceName: src?.name ?? null,
        license: src?.license ?? null,
        snapshotVersion: snap?.versionLabel ?? null,
        lastImportedAt: snap?.createdAt.toISOString() ?? null,
      },
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getRelatedAnime(id: string): Promise<RelatedAnimeItemDto[] | null> {
    const [existsRow] = await this.db
      .select({ id: anime.id })
      .from(anime)
      .where(eq(anime.id, id))
      .limit(1);
    if (!existsRow) return null;

    const edges = await this.db
      .select({
        sourceAnimeId: animeRelationship.sourceAnimeId,
        targetAnimeId: animeRelationship.targetAnimeId,
      })
      .from(animeRelationship)
      .where(or(eq(animeRelationship.sourceAnimeId, id), eq(animeRelationship.targetAnimeId, id)));

    const neighborIds = [
      ...new Set(
        edges
          .map((e) => (e.sourceAnimeId === id ? e.targetAnimeId : e.sourceAnimeId))
          .filter((nid) => nid !== id),
      ),
    ];

    if (neighborIds.length === 0) return [];

    const neighbors = await this.db
      .select({
        id: anime.id,
        title: anime.title,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(anime)
      .where(inArray(anime.id, neighborIds))
      .orderBy(asc(anime.normalizedTitle));

    return neighbors.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type as AnimeType,
      seasonYear: n.seasonYear,
      relationType: 'UNSPECIFIED',
    }));
  }

  async listCompanies(params: StudioSearchParams): Promise<PaginatedResponse<CompanySummaryDto>> {
    const roleFilter = params.role ?? 'STUDIO';
    const conditions: SQL[] = [eq(animeCompany.role, roleFilter)];
    if (params.q && params.q.trim()) {
      conditions.push(ilike(company.normalizedName, `%${normalizeSearchText(params.q)}%`));
    }
    const whereClause = and(...conditions);
    const offset = (params.page - 1) * params.pageSize;

    const allGrouped = await this.db
      .select({
        id: company.id,
        name: company.name,
        role: animeCompany.role,
        animeCount: sql<number>`count(distinct ${animeCompany.animeId})::int`,
      })
      .from(company)
      .innerJoin(animeCompany, eq(animeCompany.companyId, company.id))
      .where(whereClause)
      .groupBy(company.id, company.name, animeCompany.role)
      .orderBy(desc(sql`count(distinct ${animeCompany.animeId})`), asc(company.name));

    const total = allGrouped.length;
    const paged = allGrouped.slice(offset, offset + params.pageSize);

    return {
      items: paged.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role as CompanyRole,
        animeCount: r.animeCount,
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async getCompanyAnime(
    companyId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<AnimeSummaryDto> | null> {
    const [comp] = await this.db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.id, companyId))
      .limit(1);
    if (!comp) return null;

    const offset = (page - 1) * pageSize;
    const links = await this.db
      .select({ animeId: animeCompany.animeId })
      .from(animeCompany)
      .where(eq(animeCompany.companyId, companyId));

    const animeIds = [...new Set(links.map((l) => l.animeId))];
    const total = animeIds.length;
    if (total === 0) {
      return { items: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
    }

    const rows = await this.db
      .select()
      .from(anime)
      .where(inArray(anime.id, animeIds))
      .orderBy(desc(anime.seasonYear), asc(anime.normalizedTitle))
      .limit(pageSize)
      .offset(offset);

    const items = await this.hydrateSummaries(rows);
    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getStatisticsOverview(): Promise<StatisticsOverviewDto> {
    const [animeCnt, studioCnt, producerCnt, relCnt, latestSnap] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(anime),
      this.db
        .select({ count: sql<number>`count(distinct ${animeCompany.companyId})::int` })
        .from(animeCompany)
        .where(eq(animeCompany.role, 'STUDIO')),
      this.db
        .select({ count: sql<number>`count(distinct ${animeCompany.companyId})::int` })
        .from(animeCompany)
        .where(eq(animeCompany.role, 'PRODUCER')),
      this.db.select({ count: sql<number>`count(*)::int` }).from(animeRelationship),
      this.db
        .select({
          versionLabel: sourceSnapshot.versionLabel,
          createdAt: sourceSnapshot.createdAt,
        })
        .from(sourceSnapshot)
        .orderBy(desc(sourceSnapshot.createdAt))
        .limit(1),
    ]);

    return {
      totalAnime: animeCnt[0]?.count ?? 0,
      totalStudios: studioCnt[0]?.count ?? 0,
      totalProducers: producerCnt[0]?.count ?? 0,
      totalRelationships: relCnt[0]?.count ?? 0,
      lastSnapshotVersion: latestSnap[0]?.versionLabel ?? null,
      lastImportedAt: latestSnap[0]?.createdAt.toISOString() ?? null,
    };
  }

  private async hydrateSummaries(
    rows: Array<typeof anime.$inferSelect>,
  ): Promise<AnimeSummaryDto[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);

    const [studioRows, tagRows] = await Promise.all([
      this.db
        .select({ animeId: animeCompany.animeId, name: company.name })
        .from(animeCompany)
        .innerJoin(company, eq(company.id, animeCompany.companyId))
        .where(and(inArray(animeCompany.animeId, ids), eq(animeCompany.role, 'STUDIO'))),
      this.db
        .select({ animeId: animeTag.animeId, name: tag.name })
        .from(animeTag)
        .innerJoin(tag, eq(tag.id, animeTag.tagId))
        .where(inArray(animeTag.animeId, ids)),
    ]);

    const studiosByAnime = new Map<string, string[]>();
    for (const r of studioRows) {
      const list = studiosByAnime.get(r.animeId) ?? [];
      list.push(r.name);
      studiosByAnime.set(r.animeId, list);
    }

    const tagsByAnime = new Map<string, string[]>();
    for (const r of tagRows) {
      const list = tagsByAnime.get(r.animeId) ?? [];
      list.push(r.name);
      tagsByAnime.set(r.animeId, list);
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type as AnimeType,
      episodes: row.episodes,
      status: row.status as AnimeStatus,
      season: row.season as AnimeSeason,
      seasonYear: row.seasonYear,
      scoreArithmeticMean: row.scoreArithmeticMean,
      thumbnailUrl: row.thumbnailUrl,
      studios: studiosByAnime.get(row.id) ?? [],
      tags: tagsByAnime.get(row.id) ?? [],
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}
