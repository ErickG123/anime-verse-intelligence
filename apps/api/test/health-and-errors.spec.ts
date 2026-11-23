import { Type } from '@sinclair/typebox';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

describe('API Foundation (Fastify 5, Health, Readiness, Problem Details, OpenAPI)', () => {
  it('GET /api/v1/health returns 200 with security headers and x-request-id', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', ENABLE_SWAGGER: 'true' }),
      checkDatabase: async () => true,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: { 'x-request-id': 'req-test-123' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-test-123');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    const body = response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('animeverse-api');
    await app.close();
  });

  it('GET /api/v1/ready returns 200 when database is reachable and 503 when down', async () => {
    const readyApp = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
    });
    const okRes = await readyApp.inject({ method: 'GET', url: '/api/v1/ready' });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json().checks.database).toBe('up');
    await readyApp.close();

    const downApp = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => false,
    });
    const downRes = await downApp.inject({ method: 'GET', url: '/api/v1/ready' });
    expect(downRes.statusCode).toBe(503);
    expect(downRes.json().status).toBe('not_ready');
    expect(downRes.json().checks.database).toBe('down');
    await downApp.close();
  });

  it('returns RFC 7807 Problem Details for 404, 400 validation, and sanitized 500 errors', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
    });

    app.get(
      '/api/v1/_test/validate',
      {
        schema: {
          querystring: Type.Object({
            page: Type.Integer({ minimum: 1 }),
          }),
        },
      },
      async () => ({ ok: true }),
    );

    app.get('/api/v1/_test/boom', async () => {
      throw new Error('secret database password leaked if unsanitized');
    });

    const notFound = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });
    expect(notFound.statusCode).toBe(404);
    expect(notFound.headers['content-type']).toContain('application/problem+json');
    expect(notFound.json().code).toBe('NOT_FOUND');

    const badReq = await app.inject({ method: 'GET', url: '/api/v1/_test/validate?page=0' });
    expect(badReq.statusCode).toBe(400);
    expect(badReq.headers['content-type']).toContain('application/problem+json');
    expect(badReq.json().code).toBe('VALIDATION_ERROR');

    const boom = await app.inject({ method: 'GET', url: '/api/v1/_test/boom' });
    expect(boom.statusCode).toBe(500);
    expect(boom.headers['content-type']).toContain('application/problem+json');
    expect(boom.json().code).toBe('INTERNAL_SERVER_ERROR');
    expect(boom.json().detail).not.toContain('secret database password');
    await app.close();
  });

  it('serves OpenAPI specification at /docs/json when ENABLE_SWAGGER=true', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', ENABLE_SWAGGER: 'true' }),
      checkDatabase: async () => true,
    });

    const docsRes = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(docsRes.statusCode).toBe(200);
    const spec = docsRes.json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/api/v1/health']).toBeDefined();
    expect(spec.paths['/api/v1/ready']).toBeDefined();
    await app.close();
  });
});
