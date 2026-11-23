import type { Pool } from 'pg';

export interface CurationBatch {
  schemaVersion: string;
  curationBatchId: string;
  curator: string;
  reviewedAt: string;
  rightsPolicy: {
    license: string;
    rightsStatus: 'VERIFIED' | 'PENDING' | 'RESTRICTED';
    attribution: string;
  };
  works: CurationWork[];
}

export interface CurationWork {
  animeNormalizedTitle: string;
  animeType: string;
  manga: {
    title: string;
    publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
    chapters: Array<{
      chapterNumber: string;
      title: string;
      spoilerLevel: 'NONE' | 'MILD' | 'MAJOR';
    }>;
  } | null;
  episodes: Array<{
    episodeNumber: number;
    title: string;
    spoilerLevel: 'NONE' | 'MILD' | 'MAJOR';
  }>;
  characters: Array<{
    name: string;
    publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
  }>;
  arcs: Array<{
    name: string;
    spoilerLevel: 'NONE' | 'MILD' | 'MAJOR';
    publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
    events: Array<{
      key: string;
      summary: string;
      spoilerLevel: 'NONE' | 'MILD' | 'MAJOR';
      confidence: number;
      publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
    }>;
  }>;
  eventRelations: Array<{
    fromKey: string;
    toKey: string;
    relationKind: string;
  }>;
  adaptationMappings: Array<{
    episodeNumber: number;
    chapterNumber: string | null;
    mappingKind: 'DIRECT' | 'PARTIAL' | 'OMITTED' | 'ANIME_ORIGINAL';
    notes: string;
    spoilerLevel: 'NONE' | 'MILD' | 'MAJOR';
    confidence: number;
    publicationStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
  }>;
}

export interface CurationValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CurationImportSummary {
  batchId: string;
  dryRun: boolean;
  worksProcessed: number;
  mangaCreated: number;
  chaptersCreated: number;
  episodesCreated: number;
  charactersCreated: number;
  arcsCreated: number;
  eventsCreated: number;
  eventRelationsCreated: number;
  adaptationMappingsCreated: number;
  reviewsLogged: number;
}

export function validateCurationBatch(batch: CurationBatch): CurationValidationResult {
  const errors: string[] = [];

  if (!batch.schemaVersion || !batch.curationBatchId || !batch.curator) {
    errors.push('Missing required batch metadata (schemaVersion, curationBatchId, curator).');
  }
  if (!batch.rightsPolicy || batch.rightsPolicy.rightsStatus !== 'VERIFIED') {
    errors.push('Rights gate violation: rightsPolicy.rightsStatus must be VERIFIED for import.');
  }
  if (!Array.isArray(batch.works) || batch.works.length === 0) {
    errors.push('Batch must contain at least one work.');
  }

  for (const work of batch.works ?? []) {
    const eventKeys = new Set<string>();
    for (const arc of work.arcs) {
      for (const ev of arc.events) {
        if (!ev.key || !ev.summary.trim()) {
          errors.push(`Invalid event in work "${work.animeNormalizedTitle}".`);
        }
        eventKeys.add(ev.key);
      }
    }
    for (const rel of work.eventRelations) {
      if (rel.fromKey === rel.toKey) {
        errors.push(`Self-referencing event relation detected: "${rel.fromKey}".`);
      }
      if (!eventKeys.has(rel.fromKey) || !eventKeys.has(rel.toKey)) {
        errors.push(
          `Event relation references unknown event key: "${rel.fromKey}" -> "${rel.toKey}".`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function importCurationBatch(
  pool: Pool,
  batch: CurationBatch,
  options: { dryRun: boolean },
): Promise<CurationImportSummary> {
  const validation = validateCurationBatch(batch);
  if (!validation.valid) {
    throw new Error(`Curation batch validation failed:\n- ${validation.errors.join('\n- ')}`);
  }

  const summary: CurationImportSummary = {
    batchId: batch.curationBatchId,
    dryRun: options.dryRun,
    worksProcessed: 0,
    mangaCreated: 0,
    chaptersCreated: 0,
    episodesCreated: 0,
    charactersCreated: 0,
    arcsCreated: 0,
    eventsCreated: 0,
    eventRelationsCreated: 0,
    adaptationMappingsCreated: 0,
    reviewsLogged: 0,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const work of batch.works) {
      const animeRes = await client.query<{ id: string }>(
        `SELECT id FROM anime WHERE normalized_title = $1 AND type = $2 LIMIT 1`,
        [work.animeNormalizedTitle, work.animeType],
      );
      const animeId = animeRes.rows[0]?.id;
      if (!animeId) {
        throw new Error(
          `Anime not found in catalog: "${work.animeNormalizedTitle}" (${work.animeType}).`,
        );
      }
      summary.worksProcessed += 1;

      let mangaWorkId: string | null = null;
      const chapterIdByNumber = new Map<string, string>();

      if (work.manga) {
        const existingManga = await client.query<{ id: string }>(
          `SELECT id FROM manga_work WHERE title = $1 LIMIT 1`,
          [work.manga.title],
        );
        if (existingManga.rows[0]?.id) {
          mangaWorkId = existingManga.rows[0].id;
        } else {
          const ins = await client.query<{ id: string }>(
            `INSERT INTO manga_work (title, publication_status) VALUES ($1, $2) RETURNING id`,
            [work.manga.title, work.manga.publicationStatus],
          );
          mangaWorkId = ins.rows[0]!.id;
          summary.mangaCreated += 1;
        }

        for (const ch of work.manga.chapters) {
          const existingCh = await client.query<{ id: string }>(
            `SELECT id FROM manga_chapter WHERE manga_work_id = $1 AND chapter_number = $2 LIMIT 1`,
            [mangaWorkId, ch.chapterNumber],
          );
          if (existingCh.rows[0]?.id) {
            chapterIdByNumber.set(ch.chapterNumber, existingCh.rows[0].id);
          } else {
            const insCh = await client.query<{ id: string }>(
              `INSERT INTO manga_chapter (manga_work_id, chapter_number, title, spoiler_level)
               VALUES ($1, $2, $3, $4) RETURNING id`,
              [mangaWorkId, ch.chapterNumber, ch.title, ch.spoilerLevel],
            );
            chapterIdByNumber.set(ch.chapterNumber, insCh.rows[0]!.id);
            summary.chaptersCreated += 1;
          }
        }
      }

      const episodeIdByNumber = new Map<number, string>();
      for (const ep of work.episodes) {
        const existingEp = await client.query<{ id: string }>(
          `SELECT id FROM anime_episode WHERE anime_id = $1 AND episode_number = $2 LIMIT 1`,
          [animeId, ep.episodeNumber],
        );
        if (existingEp.rows[0]?.id) {
          episodeIdByNumber.set(ep.episodeNumber, existingEp.rows[0].id);
        } else {
          const insEp = await client.query<{ id: string }>(
            `INSERT INTO anime_episode (anime_id, episode_number, title, spoiler_level)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [animeId, ep.episodeNumber, ep.title, ep.spoilerLevel],
          );
          episodeIdByNumber.set(ep.episodeNumber, insEp.rows[0]!.id);
          summary.episodesCreated += 1;
        }
      }

      for (const char of work.characters) {
        const existingChar = await client.query<{ id: string }>(
          `SELECT id FROM character WHERE anime_id = $1 AND name = $2 LIMIT 1`,
          [animeId, char.name],
        );
        if (!existingChar.rows[0]?.id) {
          await client.query(
            `INSERT INTO character (anime_id, name, publication_status) VALUES ($1, $2, $3)`,
            [animeId, char.name, char.publicationStatus],
          );
          summary.charactersCreated += 1;
        }
      }

      const eventIdByKey = new Map<string, string>();
      for (const arc of work.arcs) {
        let arcId: string;
        const existingArc = await client.query<{ id: string }>(
          `SELECT id FROM story_arc WHERE anime_id = $1 AND name = $2 LIMIT 1`,
          [animeId, arc.name],
        );
        if (existingArc.rows[0]?.id) {
          arcId = existingArc.rows[0].id;
        } else {
          const insArc = await client.query<{ id: string }>(
            `INSERT INTO story_arc (anime_id, manga_work_id, name, spoiler_level, publication_status)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [animeId, mangaWorkId, arc.name, arc.spoilerLevel, arc.publicationStatus],
          );
          arcId = insArc.rows[0]!.id;
          summary.arcsCreated += 1;
        }

        for (const ev of arc.events) {
          const existingEv = await client.query<{ id: string }>(
            `SELECT id FROM story_event WHERE story_arc_id = $1 AND summary = $2 LIMIT 1`,
            [arcId, ev.summary],
          );
          if (existingEv.rows[0]?.id) {
            eventIdByKey.set(ev.key, existingEv.rows[0].id);
          } else {
            const insEv = await client.query<{ id: string }>(
              `INSERT INTO story_event (story_arc_id, summary, spoiler_level, confidence, publication_status)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [arcId, ev.summary, ev.spoilerLevel, ev.confidence, ev.publicationStatus],
            );
            const evId = insEv.rows[0]!.id;
            eventIdByKey.set(ev.key, evId);
            summary.eventsCreated += 1;

            await client.query(
              `INSERT INTO curation_review (entity_type, entity_id, from_status, to_status, reviewer, rationale)
               VALUES ('story_event', $1, 'DRAFT', $2, $3, $4)`,
              [
                evId,
                ev.publicationStatus,
                batch.curator,
                `Batch ${batch.curationBatchId} (${batch.rightsPolicy.license})`,
              ],
            );
            summary.reviewsLogged += 1;
          }
        }
      }

      for (const rel of work.eventRelations) {
        const fromId = eventIdByKey.get(rel.fromKey);
        const toId = eventIdByKey.get(rel.toKey);
        if (!fromId || !toId) continue;

        const existingRel = await client.query<{ id: string }>(
          `SELECT id FROM event_relation WHERE from_event_id = $1 AND to_event_id = $2 AND relation_kind = $3 LIMIT 1`,
          [fromId, toId, rel.relationKind],
        );
        if (!existingRel.rows[0]?.id) {
          await client.query(
            `INSERT INTO event_relation (from_event_id, to_event_id, relation_kind, unidirectional)
             VALUES ($1, $2, $3, TRUE)`,
            [fromId, toId, rel.relationKind],
          );
          summary.eventRelationsCreated += 1;
        }
      }

      for (const map of work.adaptationMappings) {
        const epId = episodeIdByNumber.get(map.episodeNumber);
        if (!epId) {
          throw new Error(`Mapping references unknown episode ${map.episodeNumber}.`);
        }
        const chId = map.chapterNumber ? (chapterIdByNumber.get(map.chapterNumber) ?? null) : null;

        const existingMap = await client.query<{ id: string }>(
          `SELECT id FROM adaptation_mapping
           WHERE anime_episode_id = $1
             AND COALESCE(manga_chapter_id::text, '') = COALESCE($2::text, '')
             AND mapping_kind = $3
           LIMIT 1`,
          [epId, chId, map.mappingKind],
        );
        if (!existingMap.rows[0]?.id) {
          const insMap = await client.query<{ id: string }>(
            `INSERT INTO adaptation_mapping
             (anime_episode_id, manga_chapter_id, mapping_kind, notes, spoiler_level, confidence, publication_status, reviewer)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
              epId,
              chId,
              map.mappingKind,
              map.notes,
              map.spoilerLevel,
              map.confidence,
              map.publicationStatus,
              batch.curator,
            ],
          );
          summary.adaptationMappingsCreated += 1;

          await client.query(
            `INSERT INTO curation_review (entity_type, entity_id, from_status, to_status, reviewer, rationale)
             VALUES ('adaptation_mapping', $1, 'DRAFT', $2, $3, $4)`,
            [
              insMap.rows[0]!.id,
              map.publicationStatus,
              batch.curator,
              `Batch ${batch.curationBatchId} (${batch.rightsPolicy.license})`,
            ],
          );
          summary.reviewsLogged += 1;
        }
      }
    }

    if (options.dryRun) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }

    return summary;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
