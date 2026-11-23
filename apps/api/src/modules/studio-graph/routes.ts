import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import type { StudioGraphMetadataDto } from '@animeverse/contracts';
import type { AppEnv } from '../../config/env.js';
import { AppHttpError } from '../../plugins/problem-details.js';
import { parseTypedNodeId, type StudioGraphRepository } from './repository.js';

export const STUDIO_GRAPH_DEFAULT_LIMIT = 30;
export const STUDIO_GRAPH_MAX_LIMIT = 80;

const StudioGraphNodeSchema = Type.Object({
  id: Type.String(),
  kind: Type.Union([
    Type.Literal('ANIME'),
    Type.Literal('STUDIO'),
    Type.Literal('PRODUCER'),
    Type.Literal('PERSON'),
  ]),
  label: Type.String(),
  internalId: Type.Union([Type.String(), Type.Null()]),
  provenance: Type.Union([Type.Literal('LOCAL_DB'), Type.Literal('ANILIST_ON_DEMAND')]),
  animeType: Type.Optional(Type.String()),
  seasonYear: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
  roleLabel: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  accessibleUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isCenter: Type.Optional(Type.Boolean()),
});

const StudioGraphEdgeSchema = Type.Object({
  id: Type.String(),
  source: Type.String(),
  target: Type.String(),
  relationKind: Type.Union([
    Type.Literal('STUDIO'),
    Type.Literal('PRODUCER'),
    Type.Literal('STAFF_ROLE'),
  ]),
  creditRole: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  provenance: Type.Union([Type.Literal('LOCAL_DB'), Type.Literal('ANILIST_ON_DEMAND')]),
  evidenceContext: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const StudioGraphPageSchema = Type.Object({
  anchorId: Type.String(),
  mode: Type.Union([Type.Literal('PRODUCTION'), Type.Literal('COLLABORATION')]),
  nodes: Type.Array(StudioGraphNodeSchema),
  edges: Type.Array(StudioGraphEdgeSchema),
  pageInfo: Type.Object({
    limit: Type.Integer(),
    offset: Type.Integer(),
    hasMore: Type.Boolean(),
    nextOffset: Type.Union([Type.Integer(), Type.Null()]),
  }),
  truncated: Type.Boolean(),
  truncationReason: Type.Union([Type.String(), Type.Null()]),
  partialScopeNotice: Type.String(),
  externalState: Type.String(),
  metrics: Type.Object({
    nodeCount: Type.Integer(),
    edgeCount: Type.Integer(),
    animeCount: Type.Integer(),
    companyCount: Type.Integer(),
    personCount: Type.Integer(),
    sourceScope: Type.String(),
  }),
});

export async function registerStudioGraphRoutes(
  app: FastifyInstance,
  env: AppEnv,
  repo?: StudioGraphRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  const requireRepo = (): StudioGraphRepository => {
    if (!repo) {
      throw new AppHttpError(
        503,
        'DATABASE_UNAVAILABLE',
        'Service Unavailable',
        'Database connection is not configured for StudioGraph.',
      );
    }
    return repo;
  };

  typedApp.get(
    '/api/v1/studio-graph/metadata',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Get StudioGraph modes, safe limits and collaboration availability',
      },
    },
    async (): Promise<StudioGraphMetadataDto> => ({
      modes: ['PRODUCTION', 'COLLABORATION'],
      defaultLimit: STUDIO_GRAPH_DEFAULT_LIMIT,
      maxLimit: STUDIO_GRAPH_MAX_LIMIT,
      collaborationEnabled: env.enrichmentFlags.anilist,
      policyNotice:
        'Production links come from local anime-offline-database (ODbL/DbCL). Collaboration staff credits are queried on-demand from AniList only when ENRICHMENT_ANILIST_ENABLED=true and are never permanently replicated.',
    }),
  );

  typedApp.get(
    '/api/v1/studio-graph',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Query bounded StudioGraph by typed anchorId (company:<uuid> or anime:<uuid>)',
        querystring: Type.Object({
          anchorId: Type.String({ minLength: 5, maxLength: 80 }),
          mode: Type.Optional(
            Type.Union([Type.Literal('PRODUCTION'), Type.Literal('COLLABORATION')]),
          ),
          role: Type.Optional(Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')])),
          yearFrom: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
          yearTo: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
          limit: Type.Optional(
            Type.Integer({
              minimum: 1,
              maximum: STUDIO_GRAPH_MAX_LIMIT,
              default: STUDIO_GRAPH_DEFAULT_LIMIT,
            }),
          ),
          offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        }),
        response: { 200: StudioGraphPageSchema },
      },
    },
    async (request) => {
      const q = request.query;
      if (!parseTypedNodeId(q.anchorId)) {
        throw new AppHttpError(
          400,
          'INVALID_NODE_ID',
          'Bad Request',
          'anchorId must follow typed format "company:<uuid>", "studio:<uuid>", or "anime:<uuid>".',
        );
      }
      if (q.yearFrom !== undefined && q.yearTo !== undefined && q.yearFrom > q.yearTo) {
        throw new AppHttpError(
          400,
          'INVALID_YEAR_RANGE',
          'Bad Request',
          'yearFrom cannot be greater than yearTo.',
        );
      }

      const page = await requireRepo().queryGraph({
        anchorId: q.anchorId,
        mode: q.mode ?? 'PRODUCTION',
        role: q.role,
        yearFrom: q.yearFrom,
        yearTo: q.yearTo,
        limit: q.limit ?? STUDIO_GRAPH_DEFAULT_LIMIT,
        offset: q.offset ?? 0,
      });

      if (!page) {
        throw new AppHttpError(
          404,
          'ANCHOR_NOT_FOUND',
          'Not Found',
          'StudioGraph anchor node not found.',
        );
      }
      return page;
    },
  );

  typedApp.get(
    '/api/v1/studio-graph/nodes/:nodeId/neighbors',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Incrementally expand bounded neighbors for a typed StudioGraph node',
        params: Type.Object({ nodeId: Type.String({ minLength: 5, maxLength: 80 }) }),
        querystring: Type.Object({
          role: Type.Optional(Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')])),
          yearFrom: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
          yearTo: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
          limit: Type.Optional(
            Type.Integer({
              minimum: 1,
              maximum: STUDIO_GRAPH_MAX_LIMIT,
              default: STUDIO_GRAPH_DEFAULT_LIMIT,
            }),
          ),
          offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        }),
        response: { 200: StudioGraphPageSchema },
      },
    },
    async (request) => {
      if (!parseTypedNodeId(request.params.nodeId)) {
        throw new AppHttpError(
          400,
          'INVALID_NODE_ID',
          'Bad Request',
          'nodeId must follow typed format "company:<uuid>", "studio:<uuid>", or "anime:<uuid>".',
        );
      }
      const page = await requireRepo().getNodeNeighbors(request.params.nodeId, {
        role: request.query.role,
        yearFrom: request.query.yearFrom,
        yearTo: request.query.yearTo,
        limit: request.query.limit ?? STUDIO_GRAPH_DEFAULT_LIMIT,
        offset: request.query.offset ?? 0,
      });
      if (!page) {
        throw new AppHttpError(404, 'NODE_NOT_FOUND', 'Not Found', 'StudioGraph node not found.');
      }
      return page;
    },
  );
}
