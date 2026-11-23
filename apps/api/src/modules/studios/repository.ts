import { asc, eq } from 'drizzle-orm';
import type {
  AnimeType,
  CompanyRole,
  GraphEdgeDto,
  GraphNodeDto,
  NetworkGraphResponseDto,
} from '@animeverse/contracts';
import type { AppDatabase } from '../../db/client.js';
import { anime, animeCompany, company } from '../../db/schema.js';

export interface CompanyDetailDto {
  id: string;
  name: string;
  roles: CompanyRole[];
  animeCount: number;
  byType: Record<string, number>;
  byDecade: Record<string, number>;
  notice: string;
}

export interface StudiosRepository {
  getCompanyDetail(companyId: string): Promise<CompanyDetailDto | null>;
  getCompanyNetwork(companyId: string, limit: number): Promise<NetworkGraphResponseDto | null>;
}

export class DrizzleStudiosRepository implements StudiosRepository {
  constructor(private readonly db: AppDatabase) {}

  async getCompanyDetail(companyId: string): Promise<CompanyDetailDto | null> {
    const [comp] = await this.db.select().from(company).where(eq(company.id, companyId)).limit(1);
    if (!comp) return null;

    const links = await this.db
      .select({
        role: animeCompany.role,
        animeId: anime.id,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(animeCompany)
      .innerJoin(anime, eq(anime.id, animeCompany.animeId))
      .where(eq(animeCompany.companyId, companyId));

    const roles = [...new Set(links.map((l) => l.role as CompanyRole))];
    const uniqueAnime = new Map<string, { type: string; seasonYear: number | null }>();
    for (const l of links) {
      uniqueAnime.set(l.animeId, { type: l.type, seasonYear: l.seasonYear });
    }

    const byType: Record<string, number> = {};
    const byDecade: Record<string, number> = {};
    for (const a of uniqueAnime.values()) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      const decade = a.seasonYear ? `${Math.floor(a.seasonYear / 10) * 10}s` : 'Unknown';
      byDecade[decade] = (byDecade[decade] ?? 0) + 1;
    }

    return {
      id: comp.id,
      name: comp.name,
      roles,
      animeCount: uniqueAnime.size,
      byType,
      byDecade,
      notice:
        'Studio and producer company data only; individual staff credits (directors, animators) are not available in this source.',
    };
  }

  async getCompanyNetwork(
    companyId: string,
    limit: number,
  ): Promise<NetworkGraphResponseDto | null> {
    const [comp] = await this.db.select().from(company).where(eq(company.id, companyId)).limit(1);
    if (!comp) return null;

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
      .where(eq(animeCompany.companyId, companyId))
      .orderBy(asc(anime.normalizedTitle));

    const truncated = rows.length > limit;
    const sliced = rows.slice(0, limit);
    const primaryKind: 'STUDIO' | 'PRODUCER' = sliced.some((r) => r.role === 'STUDIO')
      ? 'STUDIO'
      : 'PRODUCER';

    const nodesMap = new Map<string, GraphNodeDto>();
    nodesMap.set(comp.id, {
      id: comp.id,
      label: comp.name,
      kind: primaryKind,
      isCenter: true,
    });

    const edges: GraphEdgeDto[] = [];
    for (const row of sliced) {
      if (!nodesMap.has(row.animeId)) {
        nodesMap.set(row.animeId, {
          id: row.animeId,
          label: row.title,
          kind: 'ANIME',
          type: row.type as AnimeType,
          seasonYear: row.seasonYear,
        });
      }
      const role = row.role as CompanyRole;
      edges.push({
        id: `${comp.id}-${row.animeId}-${role}`,
        source: comp.id,
        target: row.animeId,
        label: role,
        relationType: role,
      });
    }

    return {
      centerId: comp.id,
      depth: 1,
      truncated,
      notice:
        'Bipartite StudioGraph (company <-> anime). Individual staff/people credits are not available in anime-offline-database.',
      nodes: [...nodesMap.values()],
      edges,
    };
  }
}
