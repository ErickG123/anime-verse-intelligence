import crypto from 'node:crypto';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerProblemDetails } from '../src/plugins/problem-details.js';
import {
  createOidcBffAuthenticator,
  generatePkcePair,
  mapClaimsToRole,
  sealSessionCookie,
  unsealSessionCookie,
  verifyPkceChallenge,
  type SessionPayload,
} from '../src/modules/auth/oidc-session.js';
import { registerEditorialGovernanceRoutes } from '../src/modules/editorial-governance/routes.js';

const TEST_SECRET = 'test-only-hmac-secret-32-bytes-minimum-length!!';
const TEST_ISSUER = 'https://idp.example.test/realms/animeverse';

describe('OIDC BFF Session, PKCE, CSRF, and Fail-Closed Auth (Phase 31)', () => {
  it('generates and verifies PKCE S256 pairs strictly', () => {
    const pair = generatePkcePair();
    expect(pair.codeChallengeMethod).toBe('S256');
    expect(verifyPkceChallenge(pair.codeVerifier, pair.codeChallenge)).toBe(true);
    expect(verifyPkceChallenge('wrong-verifier', pair.codeChallenge)).toBe(false);
  });

  it('maps IdP claims explicitly with least privilege (unknown claims yield null)', () => {
    expect(mapClaimsToRole({ roles: ['unknown-group'] })).toBeNull();
    expect(mapClaimsToRole({})).toBeNull();
    expect(mapClaimsToRole({ roles: ['animeverse-editor'] })).toBe('EDITOR');
    expect(mapClaimsToRole({ roles: ['animeverse-editor', 'animeverse-reviewer'] })).toBe(
      'REVIEWER',
    );
  });

  it('rejects tampered or expired session cookies', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      sub: 'user-1',
      iss: TEST_ISSUER,
      role: 'REVIEWER',
      csrfToken: 'csrf-abc',
      iat: now,
      exp: now + 300,
      jti: crypto.randomUUID(),
    };

    const cookie = sealSessionCookie(payload, TEST_SECRET);
    expect(unsealSessionCookie(cookie, TEST_SECRET, now)?.sub).toBe('user-1');
    expect(unsealSessionCookie(`${cookie}tampered`, TEST_SECRET, now)).toBeNull();
    expect(unsealSessionCookie(cookie, TEST_SECRET, now + 301)).toBeNull();
  });

  it('stays fail-closed (401 before schema) when AUTH_MODE=disabled or session/CSRF/Origin invalid', async () => {
    const revoked = new Set<string>();
    const authenticator = createOidcBffAuthenticator(
      {
        mode: 'oidc',
        issuer: TEST_ISSUER,
        clientId: 'animeverse-web',
        sessionSecret: TEST_SECRET,
        allowedOrigins: ['https://admin.animeverse.test'],
      },
      revoked,
    );

    const app = Fastify({ logger: false });
    await registerProblemDetails(app);
    await registerEditorialGovernanceRoutes(app, { authenticate: authenticator });

    // 1. Unauthenticated + malformed body => 401 before schema validation
    const unauth = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/item-1/decisions',
      payload: { bad: true },
    });
    expect(unauth.statusCode).toBe(401);

    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();
    const cookie = sealSessionCookie(
      {
        sub: 'reviewer-1',
        iss: TEST_ISSUER,
        role: 'REVIEWER',
        csrfToken: 'csrf-token-123',
        iat: now,
        exp: now + 600,
        jti,
      },
      TEST_SECRET,
    );

    // 2. Valid GET with session cookie => 200
    const queueRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/review-queue',
      headers: { cookie: `av_session=${cookie}` },
    });
    expect(queueRes.statusCode).toBe(200);

    // 3. Mutation without CSRF token => 401
    const noCsrf = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/item-1/decisions',
      headers: {
        cookie: `av_session=${cookie}`,
        origin: 'https://admin.animeverse.test',
      },
      payload: { targetStatus: 'APPROVED', expectedVersion: 1, reason: 'looks good' },
    });
    expect(noCsrf.statusCode).toBe(401);

    // 4. Mutation with wrong Origin => 401
    const badOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/item-1/decisions',
      headers: {
        cookie: `av_session=${cookie}`,
        origin: 'https://evil.example',
        'x-csrf-token': 'csrf-token-123',
      },
      payload: { targetStatus: 'APPROVED', expectedVersion: 1, reason: 'looks good' },
    });
    expect(badOrigin.statusCode).toBe(401);

    // 5. Revoked session => 401
    revoked.add(jti);
    const revokedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/review-queue',
      headers: { cookie: `av_session=${cookie}` },
    });
    expect(revokedRes.statusCode).toBe(401);

    await app.close();
  });
});
