import { eq, inArray, sql } from 'drizzle-orm';
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
  ingestionConflict,
  ingestionError,
  ingestionRun,
  sourceEvidence,
  sourceSnapshot,
  tag,
} from '../../db/schema.js';
import { assertSourceCanStore, DATA_SOURCE_REGISTRY } from '../sources/source-registry.js';
import { normalizeSearchText } from '../sources/url-normalizer.js';
import {
  extractReleaseLabel,
  scanJsonlFile,
  streamJsonlBatches,
  type DatasetMetadataLine,
  type ParsedAnimeRecord,
  type ParsedLineError,
} from './jsonl-parser.js';

export interface ImportReport {
  source: string;
  release: string | null;
  runId: string;
  snapshotId: string;
  sha256: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  totalRecords: number;
  validRecords: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  conflictCount: number;
  relationsCreated: number;
  relationsUnchanged: number;
  relationsPending: number;
  unexpectedErrors: number;
  durationMs: number;
  recordsPerSecond: number;
  peakMemoryMb: number;
  // Backward-compatible aliases
  totalLines: number;
  skippedCount: number;
  errorCount: number;
  relationsCount: number;
  unresolvedRelationsCount: number;
}

type ExistingAnimeRow = typeof anime.$inferSelect;

function numbersDiffer(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return false;
  if (a === null || b === null) return true;
  return Math.abs(a - b) > 1e-4;
}

export function computeQualitySafeAnimePatch(
  existing: ExistingAnimeRow,
  incoming: ParsedAnimeRecord,
): Partial<typeof anime.$inferInsert> | null {
  const nextTitle = incoming.title || existing.title;
  const nextNormalizedTitle = incoming.normalizedTitle || existing.normalizedTitle;
  const nextType = incoming.type !== 'UNKNOWN' ? incoming.type : existing.type;
  const nextEpisodes = incoming.episodes ?? existing.episodes;
  const nextStatus = incoming.status !== 'UNKNOWN' ? incoming.status : existing.status;
  const nextSeason = incoming.season !== 'UNDEFINED' ? incoming.season : existing.season;
  const nextSeasonYear = incoming.seasonYear ?? existing.seasonYear;
  const nextDurationSeconds = incoming.durationSeconds ?? existing.durationSeconds;
  const nextScoreMean = incoming.scoreArithmeticMean ?? existing.scoreArithmeticMean;
  const nextScoreMedian = incoming.scoreMedian ?? existing.scoreMedian;
  const nextPictureUrl = incoming.pictureUrl ?? existing.pictureUrl;
  const nextThumbnailUrl = incoming.thumbnailUrl ?? existing.thumbnailUrl;

  const changed =
    nextTitle !== existing.title ||
    nextNormalizedTitle !== existing.normalizedTitle ||
    nextType !== existing.type ||
    nextEpisodes !== existing.episodes ||
    nextStatus !== existing.status ||
    nextSeason !== existing.season ||
    nextSeasonYear !== existing.seasonYear ||
    nextDurationSeconds !== existing.durationSeconds ||
    numbersDiffer(nextScoreMean, existing.scoreArithmeticMean) ||
    numbersDiffer(nextScoreMedian, existing.scoreMedian) ||
    nextPictureUrl !== existing.pictureUrl ||
    nextThumbnailUrl !== existing.thumbnailUrl;

  if (!changed) return null;

  return {
    title: nextTitle,
    normalizedTitle: nextNormalizedTitle,
    type: nextType,
    episodes: nextEpisodes,
    status: nextStatus,
    season: nextSeason,
    seasonYear: nextSeasonYear,
    durationSeconds: nextDurationSeconds,
    scoreArithmeticMean: nextScoreMean,
    scoreMedian: nextScoreMedian,
    pictureUrl: nextPictureUrl,
    thumbnailUrl: nextThumbnailUrl,
    updatedAt: new Date(),
  };
}

export async function syncGovernedSourcesToDb(db: AppDatabase): Promise<void> {
  for (const src of DATA_SOURCE_REGISTRY) {
    await db
      .insert(dataSource)
      .values({
        slug: src.sourceId,
        name: src.name,
        kind: src.kind,
        endpoint: src.endpoint,
        license: src.license,
        attribution: src.attribution,
        policyVersion: src.policyVersion,
        status: src.status,
        fetchAllowed: src.permissions.fetch,
        storageAllowed: src.permissions.store,
        redistributeAllowed: src.permissions.redistribute,
        cacheTtlSeconds: src.cacheTtlSeconds,
        lastCheckedAt: new Date(src.lastCheckedAt),
      })
      .onConflictDoUpdate({
        target: dataSource.slug,
        set: {
          name: src.name,
          endpoint: src.endpoint,
          license: src.license,
          attribution: src.attribution,
          policyVersion: src.policyVersion,
          status: src.status,
          fetchAllowed: src.permissions.fetch,
          storageAllowed: src.permissions.store,
          redistributeAllowed: src.permissions.redistribute,
          cacheTtlSeconds: src.cacheTtlSeconds,
          updatedAt: new Date(),
        },
      });
  }
}

export async function importAnimeOfflineJsonl(
  db: AppDatabase,
  filePath: string,
  options: { sourceId?: string; dryRun?: boolean; batchSize?: number } = {},
): Promise<ImportReport> {
  const startedMs = Date.now();
  const sourceId = options.sourceId ?? 'anime-offline-database';
  const batchSize = options.batchSize ?? 250;
  assertSourceCanStore(sourceId);

  if (options.dryRun) {
    const seenUrls = new Set<string>();
    let duplicateCount = 0;
    const scan = await scanJsonlFile(filePath, (rec) => {
      if (rec.sources.some((s) => seenUrls.has(s.normalizedUrl))) {
        duplicateCount += 1;
      }
      for (const s of rec.sources) seenUrls.add(s.normalizedUrl);
    });
    const durationMs = Math.max(1, Date.now() - startedMs);
    return {
      source: sourceId,
      release: extractReleaseLabel(scan.metadata),
      runId: 'dry-run',
      snapshotId: 'dry-run',
      sha256: scan.sha256,
      status: scan.errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
      totalRecords: scan.totalLines,
      validRecords: scan.validRecords,
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      rejectedCount: scan.errors.length,
      duplicateCount,
      conflictCount: 0,
      relationsCreated: 0,
      relationsUnchanged: 0,
      relationsPending: 0,
      unexpectedErrors: 0,
      durationMs,
      recordsPerSecond: Math.round((scan.totalLines / durationMs) * 1000),
      peakMemoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      totalLines: scan.totalLines,
      skippedCount: scan.validRecords,
      errorCount: scan.errors.length,
      relationsCount: 0,
      unresolvedRelationsCount: 0,
    };
  }

  await syncGovernedSourcesToDb(db);
  const [sourceRow] = await db
    .select()
    .from(dataSource)
    .where(eq(dataSource.slug, sourceId))
    .limit(1);

  if (!sourceRow) {
    throw new Error(`Data source "${sourceId}" not found in database after sync.`);
  }
  const sourceDbId = sourceRow.id;

  let snapshotId = '';
  let runId = '';
  let sha256Value = '';
  let releaseLabel: string | null = null;

  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let duplicateCount = 0;
  let conflictCount = 0;
  let unexpectedErrors = 0;
  let peakRssBytes = process.memoryUsage().rss;

  const seenSourceUrlsInFile = new Set<string>();
  const pendingRelations: Array<{ sourceAnimeId: string; relatedUrls: string[] }> = [];

  const handleMetadata = async (metadata: DatasetMetadataLine, sha256: string): Promise<void> => {
    sha256Value = sha256;
    releaseLabel = extractReleaseLabel(metadata);

    const [snapRow] = await db
      .insert(sourceSnapshot)
      .values({
        dataSourceId: sourceDbId,
        versionLabel: releaseLabel,
        sha256,
        sourceLastUpdate: metadata.lastUpdate ?? null,
        recordCount: 0,
        metadata,
        status: 'PENDING',
      })
      .onConflictDoUpdate({
        target: [sourceSnapshot.dataSourceId, sourceSnapshot.sha256],
        set: {
          versionLabel: releaseLabel,
          sourceLastUpdate: metadata.lastUpdate ?? null,
          metadata,
        },
      })
      .returning();

    if (!snapRow) throw new Error('Failed to upsert source_snapshot.');
    snapshotId = snapRow.id;

    const [runRow] = await db
      .insert(ingestionRun)
      .values({
        dataSourceId: sourceDbId,
        snapshotId,
        status: 'RUNNING',
      })
      .returning();

    if (!runRow) throw new Error('Failed to create ingestion_run.');
    runId = runRow.id;
  };

  const handleRejectedBatch = async (errors: ParsedLineError[]): Promise<void> => {
    if (!runId || errors.length === 0) return;
    await db.insert(ingestionError).values(
      errors.map((err) => ({
        runId,
        lineNumber: err.lineNumber,
        errorCode: err.errorCode,
        message: err.message,
        payloadExcerpt: err.payloadExcerpt,
      })),
    );
  };

  const handleBatch = async (rawBatch: ParsedAnimeRecord[]): Promise<void> => {
    const batch: ParsedAnimeRecord[] = [];
    for (const rec of rawBatch) {
      const isDuplicateInFile = rec.sources.some((s) => seenSourceUrlsInFile.has(s.normalizedUrl));
      if (isDuplicateInFile) {
        duplicateCount += 1;
        continue;
      }
      for (const s of rec.sources) seenSourceUrlsInFile.add(s.normalizedUrl);
      batch.push(rec);
    }

    if (batch.length === 0) return;

    try {
      await db.transaction(async (tx) => {
        const allBatchUrls = [
          ...new Set(batch.flatMap((r) => r.sources.map((s) => s.normalizedUrl))),
        ];
        const existingRefs =
          allBatchUrls.length > 0
            ? await tx
                .select({
                  normalizedUrl: externalReference.normalizedUrl,
                  animeId: externalReference.animeId,
                })
                .from(externalReference)
                .where(inArray(externalReference.normalizedUrl, allBatchUrls))
            : [];

        const urlToAnimeId = new Map<string, string>();
        for (const ref of existingRefs) {
          urlToAnimeId.set(ref.normalizedUrl, ref.animeId);
        }

        const matchedIds = [...new Set(existingRefs.map((r) => r.animeId))];
        const existingAnimes =
          matchedIds.length > 0
            ? await tx.select().from(anime).where(inArray(anime.id, matchedIds))
            : [];
        const existingAnimeById = new Map<string, ExistingAnimeRow>(
          existingAnimes.map((a) => [a.id, a]),
        );

        // Pre-upsert all unique companies and tags in the batch
        const companyNameMap = new Map<string, string>();
        const tagNameMap = new Map<string, string>();
        for (const rec of batch) {
          for (const name of [...rec.studios, ...rec.producers]) {
            const norm = normalizeSearchText(name);
            if (norm && !companyNameMap.has(norm)) companyNameMap.set(norm, name);
          }
          for (const t of rec.tags) {
            const norm = normalizeSearchText(t);
            if (norm && !tagNameMap.has(norm)) tagNameMap.set(norm, t);
          }
        }

        const companyIdByNorm = new Map<string, string>();
        if (companyNameMap.size > 0) {
          const companyRows = await tx
            .insert(company)
            .values(
              [...companyNameMap.entries()].map(([normalizedName, name]) => ({
                name,
                normalizedName,
              })),
            )
            .onConflictDoUpdate({
              target: company.normalizedName,
              set: { name: sql`EXCLUDED.name` },
            })
            .returning({ id: company.id, normalizedName: company.normalizedName });
          for (const c of companyRows) companyIdByNorm.set(c.normalizedName, c.id);
        }

        const tagIdByNorm = new Map<string, string>();
        if (tagNameMap.size > 0) {
          const tagRows = await tx
            .insert(tag)
            .values(
              [...tagNameMap.entries()].map(([normalizedName, name]) => ({
                name,
                normalizedName,
              })),
            )
            .onConflictDoUpdate({
              target: tag.normalizedName,
              set: { name: sql`EXCLUDED.name` },
            })
            .returning({ id: tag.id, normalizedName: tag.normalizedName });
          for (const t of tagRows) tagIdByNorm.set(t.normalizedName, t.id);
        }

        const refsToInsert: Array<typeof externalReference.$inferInsert> = [];
        const aliasesToInsert: Array<typeof animeAlias.$inferInsert> = [];
        const companiesToInsert: Array<typeof animeCompany.$inferInsert> = [];
        const tagsToInsert: Array<typeof animeTag.$inferInsert> = [];
        const evidenceToInsert: Array<typeof sourceEvidence.$inferInsert> = [];
        const conflictsToInsert: Array<typeof ingestionConflict.$inferInsert> = [];

        const toCreate: ParsedAnimeRecord[] = [];
        const matchedRecords: Array<{ record: ParsedAnimeRecord; animeId: string }> = [];

        for (const rec of batch) {
          const foundIds = [
            ...new Set(
              rec.sources
                .map((s) => urlToAnimeId.get(s.normalizedUrl))
                .filter((id): id is string => Boolean(id)),
            ),
          ];

          if (foundIds.length > 1) {
            conflictCount += 1;
            conflictsToInsert.push({
              runId,
              lineNumber: rec.lineNumber,
              conflictType: 'MULTI_ANIME_MATCH',
              details: {
                title: rec.title,
                matchedAnimeIds: foundIds,
                normalizedUrls: rec.sources.map((s) => s.normalizedUrl),
              },
            });
            continue;
          }

          if (foundIds.length === 1 && foundIds[0]) {
            matchedRecords.push({ record: rec, animeId: foundIds[0] });
          } else {
            toCreate.push(rec);
          }
        }

        if (conflictsToInsert.length > 0) {
          await tx.insert(ingestionConflict).values(conflictsToInsert);
        }

        // Bulk insert new anime records
        if (toCreate.length > 0) {
          const insertedAnimes = await tx
            .insert(anime)
            .values(
              toCreate.map((rec) => ({
                title: rec.title,
                normalizedTitle: rec.normalizedTitle,
                type: rec.type,
                episodes: rec.episodes,
                status: rec.status,
                season: rec.season,
                seasonYear: rec.seasonYear,
                durationSeconds: rec.durationSeconds,
                scoreArithmeticMean: rec.scoreArithmeticMean,
                scoreMedian: rec.scoreMedian,
                pictureUrl: rec.pictureUrl,
                thumbnailUrl: rec.thumbnailUrl,
                primarySourceId: sourceDbId,
                lastSnapshotId: snapshotId,
              })),
            )
            .returning({ id: anime.id });

          for (let i = 0; i < toCreate.length; i += 1) {
            const rec = toCreate[i];
            const ins = insertedAnimes[i];
            if (!rec || !ins) continue;
            createdCount += 1;
            collectChildRows(rec, ins.id, true);
          }
        }

        // Diff-checked update for existing anime records
        for (const { record, animeId } of matchedRecords) {
          const existing = existingAnimeById.get(animeId);
          const patch = existing ? computeQualitySafeAnimePatch(existing, record) : null;
          if (patch) {
            await tx
              .update(anime)
              .set({
                ...patch,
                primarySourceId: existing?.primarySourceId ?? sourceDbId,
                lastSnapshotId: snapshotId,
              })
              .where(eq(anime.id, animeId));
            updatedCount += 1;
            collectChildRows(record, animeId, true);
          } else {
            unchangedCount += 1;
            collectChildRows(record, animeId, false);
          }
        }

        function collectChildRows(
          rec: ParsedAnimeRecord,
          animeId: string,
          recordEvidence: boolean,
        ): void {
          for (const ref of rec.sources) {
            refsToInsert.push({
              animeId,
              provider: ref.provider,
              externalId: ref.externalId,
              normalizedUrl: ref.normalizedUrl,
              rawUrl: ref.rawUrl,
            });
          }

          const seenAliases = new Set<string>();
          for (const syn of rec.synonyms) {
            const norm = normalizeSearchText(syn);
            if (!norm || seenAliases.has(norm)) continue;
            seenAliases.add(norm);
            aliasesToInsert.push({ animeId, alias: syn, normalizedAlias: norm });
          }

          const seenCompKeys = new Set<string>();
          for (const name of rec.studios) {
            const compId = companyIdByNorm.get(normalizeSearchText(name));
            const key = `${compId}:STUDIO`;
            if (compId && !seenCompKeys.has(key)) {
              seenCompKeys.add(key);
              companiesToInsert.push({ animeId, companyId: compId, role: 'STUDIO' });
            }
          }
          for (const name of rec.producers) {
            const compId = companyIdByNorm.get(normalizeSearchText(name));
            const key = `${compId}:PRODUCER`;
            if (compId && !seenCompKeys.has(key)) {
              seenCompKeys.add(key);
              companiesToInsert.push({ animeId, companyId: compId, role: 'PRODUCER' });
            }
          }

          const seenTagIds = new Set<string>();
          for (const t of rec.tags) {
            const tagId = tagIdByNorm.get(normalizeSearchText(t));
            if (tagId && !seenTagIds.has(tagId)) {
              seenTagIds.add(tagId);
              tagsToInsert.push({ animeId, tagId });
            }
          }

          if (recordEvidence) {
            evidenceToInsert.push({
              entityType: 'ANIME',
              entityId: animeId,
              dataSourceId: sourceDbId,
              snapshotId,
            });
          }

          if (rec.relatedUrls.length > 0) {
            pendingRelations.push({ sourceAnimeId: animeId, relatedUrls: rec.relatedUrls });
          }
        }

        if (refsToInsert.length > 0) {
          await tx
            .insert(externalReference)
            .values(refsToInsert)
            .onConflictDoNothing({ target: externalReference.normalizedUrl });
        }
        if (aliasesToInsert.length > 0) {
          await tx
            .insert(animeAlias)
            .values(aliasesToInsert)
            .onConflictDoNothing({ target: [animeAlias.animeId, animeAlias.normalizedAlias] });
        }
        if (companiesToInsert.length > 0) {
          await tx.insert(animeCompany).values(companiesToInsert).onConflictDoNothing();
        }
        if (tagsToInsert.length > 0) {
          await tx.insert(animeTag).values(tagsToInsert).onConflictDoNothing();
        }
        if (evidenceToInsert.length > 0) {
          await tx.insert(sourceEvidence).values(evidenceToInsert);
        }
      });
    } catch (err) {
      unexpectedErrors += 1;
      if (runId) {
        await db.insert(ingestionError).values({
          runId,
          lineNumber: batch[0]?.lineNumber ?? 0,
          errorCode: 'UNEXPECTED_BATCH_ERROR',
          message: err instanceof Error ? err.message : 'Unexpected batch persistence error',
          payloadExcerpt: `Batch size ${batch.length}`,
        });
      }
    }

    const rss = process.memoryUsage().rss;
    if (rss > peakRssBytes) peakRssBytes = rss;
  };

  const streamStats = await streamJsonlBatches(filePath, batchSize, {
    onMetadata: handleMetadata,
    onBatch: handleBatch,
    onRejectedBatch: handleRejectedBatch,
  });

  // Pass 2: batched relationship resolution (UNSPECIFIED, no self-references)
  let relationsCreated = 0;
  let relationsUnchanged = 0;
  let relationsPending = 0;

  const allRelatedUrls = [...new Set(pendingRelations.flatMap((p) => p.relatedUrls))];
  const resolvedUrlMap = new Map<string, string>();
  const URL_CHUNK_SIZE = 1500;

  for (let i = 0; i < allRelatedUrls.length; i += URL_CHUNK_SIZE) {
    const slice = allRelatedUrls.slice(i, i + URL_CHUNK_SIZE);
    const rows = await db
      .select({
        normalizedUrl: externalReference.normalizedUrl,
        animeId: externalReference.animeId,
      })
      .from(externalReference)
      .where(inArray(externalReference.normalizedUrl, slice));
    for (const r of rows) {
      resolvedUrlMap.set(r.normalizedUrl, r.animeId);
    }
  }

  const uniqueRelPairs = new Map<string, { sourceAnimeId: string; targetAnimeId: string }>();
  for (const item of pendingRelations) {
    for (const relUrl of item.relatedUrls) {
      const targetAnimeId = resolvedUrlMap.get(relUrl);
      if (!targetAnimeId) {
        relationsPending += 1;
        continue;
      }
      if (targetAnimeId === item.sourceAnimeId) continue;
      const key = `${item.sourceAnimeId}->${targetAnimeId}`;
      if (!uniqueRelPairs.has(key)) {
        uniqueRelPairs.set(key, { sourceAnimeId: item.sourceAnimeId, targetAnimeId });
      }
    }
  }

  const allPairs = [...uniqueRelPairs.values()];
  const REL_BATCH_SIZE = 1000;
  for (let i = 0; i < allPairs.length; i += REL_BATCH_SIZE) {
    const chunk = allPairs.slice(i, i + REL_BATCH_SIZE);
    const inserted = await db
      .insert(animeRelationship)
      .values(
        chunk.map((p) => ({
          sourceAnimeId: p.sourceAnimeId,
          targetAnimeId: p.targetAnimeId,
          relationType: 'UNSPECIFIED',
          evidenceSourceId: sourceDbId,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: animeRelationship.id });

    relationsCreated += inserted.length;
    relationsUnchanged += chunk.length - inserted.length;
  }

  const durationMs = Math.max(1, Date.now() - startedMs);
  const peakMemoryMb = Math.round(peakRssBytes / (1024 * 1024));
  const recordsPerSecond = Math.round((streamStats.totalLines / durationMs) * 1000);

  const finalStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED' =
    unexpectedErrors > 0 && createdCount === 0 && updatedCount === 0 && unchangedCount === 0
      ? 'FAILED'
      : streamStats.rejectedCount > 0 || conflictCount > 0 || unexpectedErrors > 0
        ? 'PARTIAL'
        : 'COMPLETED';

  await db
    .update(sourceSnapshot)
    .set({ status: 'VALIDATED', recordCount: streamStats.validRecords })
    .where(eq(sourceSnapshot.id, snapshotId));

  await db
    .update(ingestionRun)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      totalLines: streamStats.totalLines,
      validRecords: streamStats.validRecords,
      createdCount,
      updatedCount,
      skippedCount: unchangedCount + duplicateCount,
      errorCount: streamStats.rejectedCount + unexpectedErrors,
      conflictCount,
      relationsCount: relationsCreated,
      summaryMessage: `Release ${releaseLabel ?? 'unknown'}: ${streamStats.validRecords} valid (${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ${streamStats.rejectedCount} rejected, ${duplicateCount} duplicates, ${conflictCount} conflicts, ${unexpectedErrors} unexpected); relations: ${relationsCreated} created, ${relationsUnchanged} unchanged, ${relationsPending} pending; ${durationMs}ms.`,
    })
    .where(eq(ingestionRun.id, runId));

  return {
    source: sourceId,
    release: releaseLabel,
    runId,
    snapshotId,
    sha256: sha256Value,
    status: finalStatus,
    totalRecords: streamStats.totalLines,
    validRecords: streamStats.validRecords,
    createdCount,
    updatedCount,
    unchangedCount,
    rejectedCount: streamStats.rejectedCount,
    duplicateCount,
    conflictCount,
    relationsCreated,
    relationsUnchanged,
    relationsPending,
    unexpectedErrors,
    durationMs,
    recordsPerSecond,
    peakMemoryMb,
    totalLines: streamStats.totalLines,
    skippedCount: unchangedCount + duplicateCount,
    errorCount: streamStats.rejectedCount + unexpectedErrors,
    relationsCount: relationsCreated,
    unresolvedRelationsCount: relationsPending,
  };
}
