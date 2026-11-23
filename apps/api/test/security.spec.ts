import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

describe('Security, observability and resilience checks', () => {
  it('exposes zero write endpoints on MVP API and enforces security & rate-limit headers', async () => {
    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test', RATE_LIMIT_MAX: '50' }),
      checkDatabase: async () => true,
    });

    const health = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(health.statusCode).toBe(200);
    expect(health.headers['x-ratelimit-limit']).toBe('50');
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['x-request-id']).toBeTruthy();

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const res = await app.inject({ method, url: '/api/v1/anime' });
      expect(res.statusCode).toBe(404);
    }

    const ingestAttempt = await app.inject({ method: 'POST', url: '/api/v1/ingest' });
    expect(ingestAttempt.statusCode).toBe(404);

    await app.close();
  });

  it('rejects invalid environment numeric variables at startup', () => {
    expect(() => loadEnv({ API_PORT: '-1' })).toThrow(/API_PORT/);
    expect(() => loadEnv({ RATE_LIMIT_MAX: 'not-a-number' })).toThrow(/RATE_LIMIT_MAX/);
  });
});
