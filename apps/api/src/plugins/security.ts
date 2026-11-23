import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { AppEnv } from '../config/env.js';

export async function registerSecurityPlugins(app: FastifyInstance, env: AppEnv): Promise<void> {
  await app.register(cors, {
    origin: env.corsOrigin,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Request-Id'],
    credentials: false,
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.enableSwagger ? false : undefined,
    crossOriginResourcePolicy: { policy: 'same-site' },
  });

  await app.register(rateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });
}
