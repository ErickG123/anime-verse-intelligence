import { inArray, or } from 'drizzle-orm';
import type {
  AnimeType,
  GraphEdgeDto,
  GraphNodeDto,
  NetworkGraphResponseDto,
} from '@animeverse/contracts';
import type { AppDatabase } from '../../db/client.js';
import { anime, animeRelationship } from '../../db/schema.js';

export interface RelationsRepository {
  getAnimeNetwork(
    centerId: string,
    depth: number,
    limit: number,
  ): Promise<NetworkGraphResponseDto | null>;
}

export class DrizzleRelationsRepository implements RelationsRepository {
  constructor(private readonly db: AppDatabase) {}

  async getAnimeNetwork(
    centerId: string,
    depth: number,
    limit: number,
  ): Promise<NetworkGraphResponseDto | null> {
    const [center] = await this.db
      .select({
        id: anime.id,
        title: anime.title,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(anime)
      .where(inArray(anime.id, [centerId]))
      .limit(1);

    if (!center) return null;

    const visitedIds = new Set<string>([center.id]);
    let frontier = [center.id];
    const edgeMap = new Map<string, { source: string; target: string }>();
    let truncated = false;

    for (let level = 0; level < depth && frontier.length > 0; level += 1) {
      const rows = await this.db
        .select({
          sourceAnimeId: animeRelationship.sourceAnimeId,
          targetAnimeId: animeRelationship.targetAnimeId,
        })
        .from(animeRelationship)
        .where(
          or(
            inArray(animeRelationship.sourceAnimeId, frontier),
            inArray(animeRelationship.targetAnimeId, frontier),
          ),
        );

      const nextFrontier: string[] = [];
      for (const row of rows) {
        if (row.sourceAnimeId === row.targetAnimeId) continue;

        const [a, b] =
          row.sourceAnimeId < row.targetAnimeId
            ? [row.sourceAnimeId, row.targetAnimeId]
            : [row.targetAnimeId, row.sourceAnimeId];
        const edgeKey = `${a}--${b}`;

        for (const candidate of [row.sourceAnimeId, row.targetAnimeId]) {
          if (!visitedIds.has(candidate)) {
            if (visitedIds.size >= limit) {
              truncated = true;
              continue;
            }
            visitedIds.add(candidate);
            nextFrontier.push(candidate);
          }
        }

        if (visitedIds.has(a) && visitedIds.has(b)) {
          edgeMap.set(edgeKey, { source: a, target: b });
        }
      }
      frontier = nextFrontier;
    }

    const animeRows = await this.db
      .select({
        id: anime.id,
        title: anime.title,
        type: anime.type,
        seasonYear: anime.seasonYear,
      })
      .from(anime)
      .where(inArray(anime.id, [...visitedIds]));

    const nodes: GraphNodeDto[] = animeRows.map((row) => ({
      id: row.id,
      label: row.title,
      kind: 'ANIME',
      type: row.type as AnimeType,
      seasonYear: row.seasonYear,
      isCenter: row.id === center.id,
    }));

    const edges: GraphEdgeDto[] = [...edgeMap.entries()].map(([id, pair]) => ({
      id,
      source: pair.source,
      target: pair.target,
      label: 'UNSPECIFIED',
      relationType: 'UNSPECIFIED',
    }));

    return {
      centerId: center.id,
      depth,
      truncated,
      notice:
        'All relationships from anime-offline-database are marked UNSPECIFIED; no sequel/prequel semantics are inferred.',
      nodes,
      edges,
    };
  }
}
