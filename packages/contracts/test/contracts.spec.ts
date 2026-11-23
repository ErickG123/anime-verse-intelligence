import { describe, expect, it } from 'vitest';
import type { HealthResponse, ProblemDetails } from '../src/index.js';

describe('@animeverse/contracts', () => {
  it('defines HealthResponse and ProblemDetails structures', () => {
    const health: HealthResponse = {
      status: 'ok',
      service: 'animeverse-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 1,
    };
    const problem: ProblemDetails = {
      type: 'https://animeverse.local/problems/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Resource not found',
      code: 'NOT_FOUND',
    };

    expect(health.status).toBe('ok');
    expect(problem.status).toBe(404);
  });
});
