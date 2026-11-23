import crypto from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { EditorialActor, EditorialRole } from '../editorial-governance/state-machine.js';
import type { EditorialAuthenticator } from '../editorial-governance/routes.js';

export type AuthMode = 'disabled' | 'oidc';

export interface OidcAuthConfig {
  mode: AuthMode;
  issuer?: string;
  clientId?: string;
  sessionSecret?: string;
  cookieName?: string;
  allowedOrigins?: string[];
  roleClaim?: string;
  roleMap?: Record<string, EditorialRole>;
  sessionTtlSeconds?: number;
}

export interface SessionPayload {
  sub: string;
  iss: string;
  role: EditorialRole;
  csrfToken: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export function generatePkcePair(): PkcePair {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

export function verifyPkceChallenge(codeVerifier: string, expectedChallenge: string): boolean {
  if (!codeVerifier || !expectedChallenge) return false;
  const computed = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const a = Buffer.from(computed);
  const b = Buffer.from(expectedChallenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function mapClaimsToRole(
  claims: Record<string, unknown>,
  roleClaim = 'roles',
  roleMap: Record<string, EditorialRole> = {
    'animeverse-admin': 'ADMIN',
    'animeverse-reviewer': 'REVIEWER',
    'animeverse-editor': 'EDITOR',
  },
): EditorialRole | null {
  const raw = claims[roleClaim];
  const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  const precedence: EditorialRole[] = ['ADMIN', 'REVIEWER', 'EDITOR'];
  const matched = new Set<EditorialRole>();

  for (const val of values) {
    if (typeof val === 'string' && roleMap[val]) {
      matched.add(roleMap[val]!);
    }
  }

  for (const role of precedence) {
    if (matched.has(role)) return role;
  }
  return null;
}

function signData(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function sealSessionCookie(payload: SessionPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = signData(encoded, secret);
  return `${encoded}.${sig}`;
}

export function unsealSessionCookie(
  token: string,
  secret: string,
  nowEpochSec = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = signData(encoded, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8'),
    ) as SessionPayload;
    if (
      !parsed.sub ||
      !parsed.iss ||
      !parsed.role ||
      !parsed.csrfToken ||
      !parsed.jti ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= nowEpochSec
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

export function createOidcBffAuthenticator(
  config: OidcAuthConfig,
  revokedJtis: Set<string> = new Set(),
): EditorialAuthenticator {
  if (config.mode !== 'oidc' || !config.issuer || !config.clientId || !config.sessionSecret) {
    // Fail-closed: never allow fallback authentication when OIDC is disabled or misconfigured.
    return async () => null;
  }

  const cookieName = config.cookieName ?? 'av_session';
  const secret = config.sessionSecret;
  const expectedIssuer = config.issuer;
  const allowedOrigins = new Set(config.allowedOrigins ?? []);

  return async (request: FastifyRequest): Promise<EditorialActor | null> => {
    const cookies = parseCookies(request.headers.cookie);
    const rawCookie = cookies[cookieName];
    if (!rawCookie) return null;

    const session = unsealSessionCookie(rawCookie, secret);
    if (!session) return null;
    if (session.iss !== expectedIssuer) return null;
    if (revokedJtis.has(session.jti)) return null;

    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase());
    if (isMutation) {
      const origin = request.headers.origin;
      if (allowedOrigins.size > 0 && (!origin || !allowedOrigins.has(origin))) {
        return null;
      }
      const csrfHeader = request.headers['x-csrf-token'];
      if (typeof csrfHeader !== 'string' || !csrfHeader) {
        return null;
      }
      const a = Buffer.from(csrfHeader);
      const b = Buffer.from(session.csrfToken);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
      }
    }

    return {
      id: `${session.iss}::${session.sub}`,
      role: session.role,
    };
  };
}
