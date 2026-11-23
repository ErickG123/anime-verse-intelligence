import type { FastifyInstance } from 'fastify';
import type { HealthResponse, ReadinessResponse } from '@animeverse/contracts';
import { HealthResponseSchema, ReadinessResponseSchema } from './schemas.js';

export interface HealthRoutesDeps {
  checkDatabase: () => Promise<boolean>;
}

export async function registerHealthRoutes(
  app: FastifyInstance,
  deps: HealthRoutesDeps,
): Promise<void> {
  app.get(
    '/api/v1/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Liveness probe',
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async (): Promise<HealthResponse> => ({
      status: 'ok',
      service: 'animeverse-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    }),
  );

  app.get(
    '/api/v1/ready',
    {
      schema: {
        tags: ['Health'],
        summary: 'Readiness probe checking PostgreSQL connectivity',
        response: {
          200: ReadinessResponseSchema,
          503: ReadinessResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const dbUp = await deps.checkDatabase();
      const payload: ReadinessResponse = {
        status: dbUp ? 'ready' : 'not_ready',
        checks: {
          database: dbUp ? 'up' : 'down',
        },
        timestamp: new Date().toISOString(),
      };
      return reply.code(dbUp ? 200 : 503).send(payload);
    },
  );
}
