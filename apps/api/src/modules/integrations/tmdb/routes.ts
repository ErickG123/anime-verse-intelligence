import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../../../db/client.js';
import { anime } from '../../../db/schema.js';
import { AppHttpError } from '../../../plugins/problem-details.js';
import type { TmdbClient } from './client.js';

export async function registerTmdbRoutes(
  app: FastifyInstance,
  deps: { db?: AppDatabase; tmdbClient: TmdbClient },
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/anime/:id/external/tmdb',
    {
      schema: {
        tags: ['Catalog'],
        summary:
          'Query on-demand TMDB supplementary metadata (transient cache, no image redistribution)',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
      },
    },
    async (request) => {
      if (!deps.db) {
        throw new AppHttpError(
          503,
          'DATABASE_UNAVAILABLE',
          'Service Unavailable',
          'Database not configured.',
        );
      }

      const [row] = await deps.db
        .select({
          id: anime.id,
          title: anime.title,
          type: anime.type,
          seasonYear: anime.seasonYear,
        })
        .from(anime)
        .where(eq(anime.id, request.params.id))
        .limit(1);

      if (!row) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      }

      const mediaKind = row.type === 'MOVIE' ? 'movie' : 'tv';
      const lookup = await deps.tmdbClient.searchByTitle(row.title, mediaKind, row.seasonYear);
      return {
        animeId: row.id,
        animeTitle: row.title,
        ...lookup,
      };
    },
  );
}
