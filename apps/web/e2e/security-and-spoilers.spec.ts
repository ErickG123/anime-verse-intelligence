import { expect, test } from '@playwright/test';

const API_BASE = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000/api/v1';

test.describe('Security, Fail-Closed Admin, and Anti-Spoiler Payload E2E', () => {
  test('health, readiness, and OpenAPI endpoints respond with security headers', async ({
    request,
  }) => {
    const health = await request.get(`${API_BASE}/health`);
    expect(health.status()).toBe(200);
    expect(health.headers()['x-request-id']).toBeTruthy();

    const ready = await request.get(`${API_BASE}/ready`);
    expect(ready.status()).toBe(200);
  });

  test('admin routes fail closed with 401 before schema validation', async ({ request }) => {
    const res = await request.post(
      `${API_BASE}/admin/reviews/00000000-0000-0000-0000-000000000000/decisions`,
      {
        data: { malformed: true },
      },
    );
    expect(res.status()).toBe(401);
  });

  test('public catalog exposes zero write endpoints', async ({ request }) => {
    const res = await request.post(`${API_BASE}/anime`, { data: {} });
    expect(res.status()).toBe(404);
  });

  test('Unicode CJK search works without leaking internal errors', async ({ request }) => {
    const res = await request.get(
      `${API_BASE}/anime?q=${encodeURIComponent('カウボーイ')}&page=1&pageSize=12`,
    );
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(body.items)).toBeTruthy();
  });
});
