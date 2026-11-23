import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { AppHttpError } from '../../plugins/problem-details.js';
import type { RelationsRepository } from './repository.js';

export const NetworkGraphResponseSchema = Type.Object({
  centerId: Type.String(),
  depth: Type.Integer(),
  truncated: Type.Boolean(),
  notice: Type.String(),
  nodes: Type.Array(
    Type.Object({
      id: Type.String(),
      label: Type.String(),
      kind: Type.Union([
        Type.Literal('ANIME'),
        Type.Literal('STUDIO'),
        Type.Literal('PRODUCER'),
        Type.Literal('PERSON'),
      ]),
      type: Type.Optional(Type.String()),
      seasonYear: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
      roleLabel: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      isCenter: Type.Optional(Type.Boolean()),
    }),
  ),
  edges: Type.Array(
    Type.Object({
      id: Type.String(),
      source: Type.String(),
      target: Type.String(),
      label: Type.String(),
      relationType: Type.Union([
        Type.Literal('UNSPECIFIED'),
        Type.Literal('STUDIO'),
        Type.Literal('PRODUCER'),
        Type.Literal('STAFF_ROLE'),
      ]),
    }),
  ),
});

export async function registerRelationsRoutes(
  app: FastifyInstance,
  repo?: RelationsRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/anime/:id/network',
    {
      schema: {
        tags: ['Relations'],
        summary: 'Get bounded anime relationship subgraph (UNSPECIFIED)',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        querystring: Type.Object({
          depth: Type.Optional(Type.Integer({ minimum: 1, maximum: 2, default: 1 })),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
        }),
        response: { 200: NetworkGraphResponseSchema },
      },
    },
    async (request) => {
      if (!repo) {
        throw new AppHttpError(
          503,
          'DATABASE_UNAVAILABLE',
          'Service Unavailable',
          'Database connection is not configured.',
        );
      }
      const graph = await repo.getAnimeNetwork(
        request.params.id,
        request.query.depth ?? 1,
        request.query.limit ?? 50,
      );
      if (!graph) {
        throw new AppHttpError(404, 'ANIME_NOT_FOUND', 'Not Found', 'Anime not found.');
      }
      return graph;
    },
  );
}
