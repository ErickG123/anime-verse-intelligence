import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import type { AppEnv } from '../config/env.js';

export async function registerSwaggerPlugin(app: FastifyInstance, env: AppEnv): Promise<void> {
  if (!env.enableSwagger) {
    return;
  }

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'AnimeVerse Intelligence API',
        description:
          'Read-only intelligence API for anime metadata, relationships, studios and data source provenance.',
        version: '0.1.0',
      },
      tags: [
        { name: 'Health', description: 'Liveness and readiness probes' },
        { name: 'Catalog', description: 'Anime catalog search, filters and details' },
        { name: 'Relations', description: 'Anime relationship subgraph (UNSPECIFIED by default)' },
        { name: 'Studios', description: 'StudioGraph companies and associated anime' },
        { name: 'Sources', description: 'Read-only data source governance and ingestion runs' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
