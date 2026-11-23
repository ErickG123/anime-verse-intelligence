import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { AppHttpError } from '../../plugins/problem-details.js';
import { NetworkGraphResponseSchema } from '../relations/routes.js';
import type { StudiosRepository } from './repository.js';

export async function registerStudiosRoutes(
  app: FastifyInstance,
  repo?: StudiosRepository,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  const requireRepo = (): StudiosRepository => {
    if (!repo) {
      throw new AppHttpError(
        503,
        'DATABASE_UNAVAILABLE',
        'Service Unavailable',
        'Database connection is not configured.',
      );
    }
    return repo;
  };

  typedApp.get(
    '/api/v1/companies/:id',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Get company detail with real counts by type and decade',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: {
          200: Type.Object({
            id: Type.String(),
            name: Type.String(),
            roles: Type.Array(Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')])),
            animeCount: Type.Integer(),
            byType: Type.Record(Type.String(), Type.Integer()),
            byDecade: Type.Record(Type.String(), Type.Integer()),
            notice: Type.String(),
          }),
        },
      },
    },
    async (request) => {
      const detail = await requireRepo().getCompanyDetail(request.params.id);
      if (!detail) {
        throw new AppHttpError(404, 'COMPANY_NOT_FOUND', 'Not Found', 'Company not found.');
      }
      return detail;
    },
  );

  typedApp.get(
    '/api/v1/studios/:id/network',
    {
      schema: {
        tags: ['Studios'],
        summary: 'Get bipartite StudioGraph (company <-> anime)',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        querystring: Type.Object({
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
        }),
        response: { 200: NetworkGraphResponseSchema },
      },
    },
    async (request) => {
      const network = await requireRepo().getCompanyNetwork(
        request.params.id,
        request.query.limit ?? 50,
      );
      if (!network) {
        throw new AppHttpError(404, 'COMPANY_NOT_FOUND', 'Not Found', 'Company not found.');
      }
      return network;
    },
  );
}
