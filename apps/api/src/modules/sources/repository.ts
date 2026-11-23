import { desc, eq } from 'drizzle-orm';
import type { DataSourceDto, IngestionRunDto } from '@animeverse/contracts';
import type { AppDatabase } from '../../db/client.js';
import { dataSource, ingestionRun, sourceSnapshot } from '../../db/schema.js';
import { DATA_SOURCE_REGISTRY } from './source-registry.js';

export interface SourcesRepository {
  listDataSources(): Promise<DataSourceDto[]>;
  listRunsForSource(sourceSlug: string, limit: number): Promise<IngestionRunDto[]>;
}

export interface EnrichmentFlagsLike {
  anilist: boolean;
  wikidata: boolean;
  mangaupdates: boolean;
  tmdb: boolean;
}

export class DrizzleSourcesRepository implements SourcesRepository {
  constructor(
    private readonly db?: AppDatabase,
    private readonly enrichmentFlags?: EnrichmentFlagsLike,
  ) {}

  async listDataSources(): Promise<DataSourceDto[]> {
    const dbBySlug = new Map<
      string,
      { lastSnapshotVersion: string | null; lastRunAt: string | null }
    >();

    if (this.db) {
      try {
        const sources = await this.db.select().from(dataSource);
        for (const s of sources) {
          const [latestSnap] = await this.db
            .select({ versionLabel: sourceSnapshot.versionLabel })
            .from(sourceSnapshot)
            .where(eq(sourceSnapshot.dataSourceId, s.id))
            .orderBy(desc(sourceSnapshot.createdAt))
            .limit(1);
          const [latestRun] = await this.db
            .select({ startedAt: ingestionRun.startedAt })
            .from(ingestionRun)
            .where(eq(ingestionRun.dataSourceId, s.id))
            .orderBy(desc(ingestionRun.startedAt))
            .limit(1);

          dbBySlug.set(s.slug, {
            lastSnapshotVersion: latestSnap?.versionLabel ?? null,
            lastRunAt: latestRun?.startedAt.toISOString() ?? null,
          });
        }
      } catch {
        // Fallback to static governed registry metadata if DB is not yet migrated/reachable
      }
    }

    return DATA_SOURCE_REGISTRY.map((src) => {
      const dbMeta = dbBySlug.get(src.sourceId);
      const dynamicEnabled =
        (src.sourceId === 'anilist' && this.enrichmentFlags?.anilist) ||
        (src.sourceId === 'wikidata' && this.enrichmentFlags?.wikidata) ||
        (src.sourceId === 'mangaupdates' && this.enrichmentFlags?.mangaupdates) ||
        (src.sourceId === 'tmdb' && this.enrichmentFlags?.tmdb);

      return {
        sourceId: src.sourceId,
        name: src.name,
        kind: src.kind,
        documentationUrl: src.documentationUrl,
        status: dynamicEnabled ? 'ACTIVE' : src.status,
        license: src.license,
        attribution: src.attribution,
        policyVersion: src.policyVersion,
        permissions: {
          ...src.permissions,
          fetch: dynamicEnabled ? true : src.permissions.fetch,
        },
        notes: src.notes,
        lastSnapshotVersion: dbMeta?.lastSnapshotVersion ?? null,
        lastRunAt: dbMeta?.lastRunAt ?? null,
      };
    });
  }

  async listRunsForSource(sourceSlug: string, limit: number): Promise<IngestionRunDto[]> {
    if (!this.db) return [];

    const [src] = await this.db
      .select({ id: dataSource.id, slug: dataSource.slug })
      .from(dataSource)
      .where(eq(dataSource.slug, sourceSlug))
      .limit(1);

    if (!src) return [];

    const runs = await this.db
      .select()
      .from(ingestionRun)
      .where(eq(ingestionRun.dataSourceId, src.id))
      .orderBy(desc(ingestionRun.startedAt))
      .limit(limit);

    return runs.map((r) => ({
      id: r.id,
      sourceId: src.slug,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
      totalLines: r.totalLines,
      validRecords: r.validRecords,
      createdCount: r.createdCount,
      updatedCount: r.updatedCount,
      skippedCount: r.skippedCount,
      errorCount: r.errorCount,
      conflictCount: r.conflictCount,
      relationsCount: r.relationsCount,
      summaryMessage: r.summaryMessage,
    }));
  }
}
