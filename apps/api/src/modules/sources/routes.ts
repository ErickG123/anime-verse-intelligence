import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { AppHttpError } from '../../plugins/problem-details.js';
import { getGovernedSource } from './source-registry.js';
import type { SourcesRepository } from './repository.js';

export async function registerSourcesRoutes(
  app: FastifyInstance,
  repo: SourcesRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    '/api/v1/data-sources',
    {
      schema: {
        tags: ['Sources'],
        summary:
          'List governed data sources, licenses, permissions and latest snapshot (read-only)',
        response: {
          200: Type.Object({
            items: Type.Array(
              Type.Object({
                sourceId: Type.String(),
                name: Type.String(),
                kind: Type.String(),
                documentationUrl: Type.String(),
                status: Type.Union([Type.Literal('ACTIVE'), Type.Literal('INACTIVE')]),
                license: Type.String(),
                attribution: Type.String(),
                policyVersion: Type.String(),
                permissions: Type.Object({
                  fetch: Type.Boolean(),
                  store: Type.Boolean(),
                  redistribute: Type.Boolean(),
                }),
                notes: Type.String(),
                lastSnapshotVersion: Type.Union([Type.String(), Type.Null()]),
                lastRunAt: Type.Union([Type.String(), Type.Null()]),
              }),
            ),
          }),
        },
      },
    },
    async () => ({ items: await repo.listDataSources() }),
  );

  typedApp.get(
    '/api/v1/data-sources/:id/runs',
    {
      schema: {
        tags: ['Sources'],
        summary: 'List recent ingestion runs for a governed data source (read-only)',
        params: Type.Object({ id: Type.String({ minLength: 1, maxLength: 64 }) }),
        querystring: Type.Object({
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 20 })),
        }),
        response: {
          200: Type.Object({
            sourceId: Type.String(),
            items: Type.Array(
              Type.Object({
                id: Type.String(),
                sourceId: Type.String(),
                status: Type.String(),
                startedAt: Type.String(),
                finishedAt: Type.Union([Type.String(), Type.Null()]),
                totalLines: Type.Integer(),
                validRecords: Type.Integer(),
                createdCount: Type.Integer(),
                updatedCount: Type.Integer(),
                skippedCount: Type.Integer(),
                errorCount: Type.Integer(),
                conflictCount: Type.Integer(),
                relationsCount: Type.Integer(),
                summaryMessage: Type.Union([Type.String(), Type.Null()]),
              }),
            ),
          }),
        },
      },
    },
    async (request) => {
      const sourceId = request.params.id;
      if (!getGovernedSource(sourceId)) {
        throw new AppHttpError(404, 'DATA_SOURCE_NOT_FOUND', 'Not Found', 'Unknown data source.');
      }
      const items = await repo.listRunsForSource(sourceId, request.query.limit ?? 20);
      return { sourceId, items };
    },
  );
}
