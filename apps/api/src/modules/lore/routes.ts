import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import type { ModuleStatusDto } from '@animeverse/contracts';
import { AppHttpError } from '../../plugins/problem-details.js';
import { filterLoreDataset, type LoreDataset } from './spoiler-engine.js';

export interface LoreRepository {
  getDataset(
    workId: string,
    media: 'ANIME' | 'MANGA',
    version: string,
  ): Promise<LoreDataset | null>;
}

const ModuleStatusSchema = Type.Object({
  module: Type.Union([Type.Literal('lore'), Type.Literal('adaptation')]),
  availability: Type.Union([
    Type.Literal('AVAILABLE'),
    Type.Literal('MISSING'),
    Type.Literal('CONFLICT'),
    Type.Literal('UNVERIFIED'),
    Type.Literal('UNAVAILABLE'),
  ]),
  message: Type.String(),
  curationMode: Type.Literal('CLI_ONLY'),
  recordsCount: Type.Integer(),
});

const LoreScopeQuerySchema = Type.Object({
  media: Type.Optional(Type.Union([Type.Literal('ANIME'), Type.Literal('MANGA')])),
  version: Type.Optional(Type.String({ minLength: 1, maxLength: 40 })),
  progress: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000 })),
  allowSpoilers: Type.Optional(Type.Boolean()),
});

export async function registerLoreAndAdaptationRoutes(
  app: FastifyInstance,
  loreRepo?: LoreRepository,
  pgPool?: import('pg').Pool,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/lore/status',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'LoreGraph module availability status (UNAVAILABLE in MVP without curated dataset)',
        response: { 200: ModuleStatusSchema },
      },
    },
    async (): Promise<ModuleStatusDto> => ({
      module: 'lore',
      availability: 'UNAVAILABLE',
      message:
        'LoreGraph engine & spoiler boundary are active; no fabricated narrative data is served in production until licensed/curated entries are published.',
      curationMode: 'CLI_ONLY',
      recordsCount: 0,
    }),
  );

  typedApp.get(
    '/api/v1/adaptation/status',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'AdaptationLab module availability status (UNAVAILABLE in MVP without curated dataset)',
        response: { 200: ModuleStatusSchema },
      },
    },
    async (): Promise<ModuleStatusDto> => ({
      module: 'adaptation',
      availability: 'UNAVAILABLE',
      message:
        'AdaptationLab engine & spoiler boundary are active; no automated scene or chapter alignment is fabricated in production.',
      curationMode: 'CLI_ONLY',
      recordsCount: 0,
    }),
  );

  typedApp.get(
    '/api/v1/lore/:workId/graph',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get spoiler-filtered LoreGraph for a work/media/version',
        params: Type.Object({ workId: Type.String({ minLength: 1, maxLength: 80 }) }),
        querystring: LoreScopeQuerySchema,
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) {
        return {
          workId: request.params.workId,
          media,
          version,
          appliedMaxPosition: request.query.progress ?? 0,
          spoilersUnlocked: Boolean(request.query.allowSpoilers),
          notice: 'No published LoreGraph data available for this work/media/version.',
          events: [],
          entities: [],
          relations: [],
        };
      }
      return filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
    },
  );

  typedApp.get(
    '/api/v1/lore/:workId/events/:eventId',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'Get a single LoreGraph event if published and within spoiler boundary (otherwise 404)',
        params: Type.Object({
          workId: Type.String({ minLength: 1, maxLength: 80 }),
          eventId: Type.String({ minLength: 1, maxLength: 80 }),
        }),
        querystring: LoreScopeQuerySchema,
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) {
        throw new AppHttpError(404, 'LORE_EVENT_NOT_FOUND', 'Not Found', 'Event not found.');
      }
      const filtered = filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
      const found = filtered.events.find((e) => e.id === request.params.eventId);
      if (!found) {
        throw new AppHttpError(404, 'LORE_EVENT_NOT_FOUND', 'Not Found', 'Event not found.');
      }
      return found;
    },
  );

  typedApp.get(
    '/api/v1/lore/:workId/search',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Search spoiler-filtered LoreGraph events without leaking future events',
        params: Type.Object({ workId: Type.String({ minLength: 1, maxLength: 80 }) }),
        querystring: Type.Intersect([
          LoreScopeQuerySchema,
          Type.Object({ q: Type.String({ minLength: 1, maxLength: 100 }) }),
        ]),
      },
    },
    async (request) => {
      const media = request.query.media ?? 'ANIME';
      const version = request.query.version ?? 'tv';
      const dataset = loreRepo
        ? await loreRepo.getDataset(request.params.workId, media, version)
        : null;
      if (!dataset) return { items: [] };
      const filtered = filterLoreDataset(dataset, {
        media,
        version,
        progress: request.query.progress,
        allowSpoilers: request.query.allowSpoilers,
      });
      const needle = request.query.q.trim().toLowerCase();
      return {
        items: filtered.events.filter(
          (e) => e.title.toLowerCase().includes(needle) || e.summary.toLowerCase().includes(needle),
        ),
      };
    },
  );

  typedApp.get(
    '/api/v1/lore/curated-works',
    {
      schema: {
        tags: ['Sources'],
        summary: 'List anime works with published LoreGraph or AdaptationLab curation records',
        querystring: Type.Object({
          module: Type.Optional(Type.Union([Type.Literal('lore'), Type.Literal('adaptation')])),
        }),
      },
    },
    async (request) => {
      if (!pgPool) return { items: [] };
      const mod = request.query.module;
      const whereClause =
        mod === 'lore'
          ? `EXISTS (
               SELECT 1 FROM story_arc sa
               INNER JOIN story_event se ON se.story_arc_id = sa.id
               WHERE sa.anime_id = a.id AND sa.publication_status = 'PUBLISHED' AND se.publication_status = 'PUBLISHED'
             )`
          : mod === 'adaptation'
            ? `EXISTS (
                 SELECT 1 FROM anime_episode ae
                 INNER JOIN adaptation_mapping am ON am.anime_episode_id = ae.id
                 WHERE ae.anime_id = a.id AND am.publication_status = 'PUBLISHED'
               )`
            : `EXISTS (SELECT 1 FROM story_arc sa WHERE sa.anime_id = a.id AND sa.publication_status = 'PUBLISHED')
               OR EXISTS (SELECT 1 FROM anime_episode ae WHERE ae.anime_id = a.id)`;

      const res = await pgPool.query<{
        id: string;
        title: string;
        type: string;
        episodes: number | null;
        season_year: number | null;
      }>(`
        SELECT DISTINCT a.id, a.title, a.type, a.episodes, a.season_year
        FROM anime a
        WHERE ${whereClause}
        ORDER BY a.title ASC
        LIMIT 50
      `);
      return {
        items: res.rows.map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          episodes: r.episodes,
          seasonYear: r.season_year,
        })),
      };
    },
  );

  typedApp.get(
    '/api/v1/lore/works/:animeId',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get published, backend spoiler-filtered LoreGraph data for an anime',
        params: Type.Object({ animeId: Type.String({ minLength: 1, maxLength: 80 }) }),
        querystring: Type.Object({
          maxSpoiler: Type.Optional(
            Type.Union([Type.Literal('NONE'), Type.Literal('MILD'), Type.Literal('MAJOR')]),
          ),
        }),
      },
    },
    async (request) => {
      const pool = pgPool;
      const maxSpoiler = request.query.maxSpoiler ?? 'NONE';
      const allowedLevels =
        maxSpoiler === 'MAJOR'
          ? ['NONE', 'MILD', 'MAJOR']
          : maxSpoiler === 'MILD'
            ? ['NONE', 'MILD']
            : ['NONE'];

      if (!pool) {
        return {
          animeId: request.params.animeId,
          maxSpoiler,
          arcs: [],
          events: [],
          relations: [],
          characters: [],
          coverage: { arcsCount: 0, visibleEventsCount: 0, relationsCount: 0 },
        };
      }

      const [arcsRes, eventsRes, charsRes] = await Promise.all([
        pool.query<{ id: string; name: string; spoiler_level: string }>(
          `SELECT id, name, spoiler_level FROM story_arc
           WHERE anime_id = $1 AND publication_status = 'PUBLISHED' AND spoiler_level = ANY($2::text[])
           ORDER BY name ASC`,
          [request.params.animeId, allowedLevels],
        ),
        pool.query<{
          id: string;
          story_arc_id: string | null;
          summary: string;
          spoiler_level: string;
          confidence: number;
        }>(
          `SELECT se.id, se.story_arc_id, se.summary, se.spoiler_level, se.confidence
           FROM story_event se
           INNER JOIN story_arc sa ON sa.id = se.story_arc_id
           WHERE sa.anime_id = $1
             AND se.publication_status = 'PUBLISHED'
             AND se.spoiler_level = ANY($2::text[])
           ORDER BY se.id ASC`,
          [request.params.animeId, allowedLevels],
        ),
        pool.query<{ id: string; name: string }>(
          `SELECT id, name FROM character WHERE anime_id = $1 AND publication_status = 'PUBLISHED' ORDER BY name ASC`,
          [request.params.animeId],
        ),
      ]);

      const visibleEventIds = eventsRes.rows.map((e) => e.id);
      const relsRes =
        visibleEventIds.length > 0
          ? await pool.query<{
              id: string;
              from_event_id: string;
              to_event_id: string;
              relation_kind: string;
            }>(
              `SELECT id, from_event_id, to_event_id, relation_kind
               FROM event_relation
               WHERE from_event_id = ANY($1::uuid[]) AND to_event_id = ANY($1::uuid[])`,
              [visibleEventIds],
            )
          : { rows: [] };

      return {
        animeId: request.params.animeId,
        maxSpoiler,
        arcs: arcsRes.rows.map((a) => ({
          id: a.id,
          name: a.name,
          spoilerLevel: a.spoiler_level,
        })),
        events: eventsRes.rows.map((e) => ({
          id: e.id,
          storyArcId: e.story_arc_id,
          summary: e.summary,
          spoilerLevel: e.spoiler_level,
          confidence: e.confidence,
        })),
        relations: relsRes.rows.map((r) => ({
          id: r.id,
          fromEventId: r.from_event_id,
          toEventId: r.to_event_id,
          relationKind: r.relation_kind,
        })),
        characters: charsRes.rows,
        coverage: {
          arcsCount: arcsRes.rows.length,
          visibleEventsCount: eventsRes.rows.length,
          relationsCount: relsRes.rows.length,
        },
      };
    },
  );

  typedApp.get(
    '/api/v1/adaptation/works/:animeId',
    {
      schema: {
        tags: ['Sources'],
        summary: 'Get published AdaptationLab episode-to-chapter mappings and honest coverage',
        params: Type.Object({ animeId: Type.String({ minLength: 1, maxLength: 80 }) }),
      },
    },
    async (request) => {
      const pool = pgPool;
      if (!pool) {
        return {
          animeId: request.params.animeId,
          animeTitle: null,
          totalAnimeEpisodes: null,
          mangaTitle: null,
          episodes: [],
          chapters: [],
          mappings: [],
          coverage: {
            documentedEpisodes: 0,
            documentedChapters: 0,
            mappingsCount: 0,
            denominatorEpisodes: null,
          },
        };
      }

      const animeRes = await pool.query<{ title: string; episodes: number | null }>(
        `SELECT title, episodes FROM anime WHERE id = $1 LIMIT 1`,
        [request.params.animeId],
      );
      const animeRow = animeRes.rows[0];
      if (!animeRow) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime work not found.');
      }

      const [episodesRes, mappingsRes] = await Promise.all([
        pool.query<{
          id: string;
          episode_number: number;
          title: string | null;
          spoiler_level: string;
        }>(
          `SELECT id, episode_number, title, spoiler_level
           FROM anime_episode WHERE anime_id = $1 ORDER BY episode_number ASC`,
          [request.params.animeId],
        ),
        pool.query<{
          id: string;
          anime_episode_id: string;
          episode_number: number;
          manga_chapter_id: string | null;
          chapter_number: string | null;
          chapter_title: string | null;
          manga_title: string | null;
          mapping_kind: string;
          notes: string | null;
          spoiler_level: string;
          confidence: number;
          reviewer: string | null;
        }>(
          `SELECT am.id, am.anime_episode_id, ae.episode_number,
                  am.manga_chapter_id, mc.chapter_number, mc.title AS chapter_title,
                  mw.title AS manga_title, am.mapping_kind, am.notes,
                  am.spoiler_level, am.confidence, am.reviewer
           FROM adaptation_mapping am
           INNER JOIN anime_episode ae ON ae.id = am.anime_episode_id
           LEFT JOIN manga_chapter mc ON mc.id = am.manga_chapter_id
           LEFT JOIN manga_work mw ON mw.id = mc.manga_work_id
           WHERE ae.anime_id = $1 AND am.publication_status = 'PUBLISHED'
           ORDER BY ae.episode_number ASC`,
          [request.params.animeId],
        ),
      ]);

      const mangaTitle = mappingsRes.rows.find((m) => m.manga_title)?.manga_title ?? null;
      const chaptersMap = new Map<
        string,
        { id: string; chapterNumber: string; title: string | null }
      >();
      for (const m of mappingsRes.rows) {
        if (m.manga_chapter_id && m.chapter_number) {
          chaptersMap.set(m.manga_chapter_id, {
            id: m.manga_chapter_id,
            chapterNumber: m.chapter_number,
            title: m.chapter_title,
          });
        }
      }

      return {
        animeId: request.params.animeId,
        animeTitle: animeRow.title,
        totalAnimeEpisodes: animeRow.episodes,
        mangaTitle,
        episodes: episodesRes.rows.map((e) => ({
          id: e.id,
          episodeNumber: e.episode_number,
          title: e.title,
          spoilerLevel: e.spoiler_level,
        })),
        chapters: Array.from(chaptersMap.values()),
        mappings: mappingsRes.rows.map((m) => ({
          id: m.id,
          animeEpisodeId: m.anime_episode_id,
          episodeNumber: m.episode_number,
          mangaChapterId: m.manga_chapter_id,
          chapterNumber: m.chapter_number,
          chapterTitle: m.chapter_title,
          mappingKind: m.mapping_kind,
          notes: m.notes,
          spoilerLevel: m.spoiler_level,
          confidence: m.confidence,
          reviewer: m.reviewer,
        })),
        coverage: {
          documentedEpisodes: episodesRes.rows.length,
          documentedChapters: chaptersMap.size,
          mappingsCount: mappingsRes.rows.length,
          denominatorEpisodes: animeRow.episodes,
        },
      };
    },
  );
}
