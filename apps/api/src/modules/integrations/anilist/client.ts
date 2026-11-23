import type { AniListMetricsDto } from '@animeverse/contracts';
import type { AniListClientConfig, AniListGraphQLResponse } from './models.js';
import { AniListRateLimiter, AniListRateLimitError } from './rate-limiter.js';

export type AniListClientResult<TData> =
  | { ok: true; data: TData }
  | {
      ok: false;
      kind:
        | 'DISABLED'
        | 'RATE_LIMITED'
        | 'FORBIDDEN'
        | 'UNAVAILABLE'
        | 'GRAPHQL_ERROR'
        | 'INVALID_PAYLOAD';
      message: string;
      retryAfterSeconds?: number;
    };

export class AniListClient {
  private readonly rateLimiter: AniListRateLimiter;
  private readonly fetchImpl: typeof fetch;

  private requestsTotal = 0;
  private requestsFailed = 0;
  private rateLimitedCount = 0;
  private totalLatencyMs = 0;
  private lastRequestAt: string | null = null;
  private lastError: string | null = null;
  private rateLimitRemaining: number | null = null;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(
    private readonly config: AniListClientConfig,
    fetchImpl?: typeof fetch,
  ) {
    this.rateLimiter = new AniListRateLimiter(config.maxRequestsPerMinute, config.maxConcurrent);
    this.fetchImpl = fetchImpl ?? fetch;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getMetrics(cacheHits: number): AniListMetricsDto {
    return {
      provider: 'anilist',
      enabled: this.config.enabled,
      endpoint: this.config.endpoint,
      policySummary:
        'On-demand queries only; transient in-memory cache; no permanent PostgreSQL replication; conservative rate limit.',
      documentationUrl: 'https://docs.anilist.co/guide/terms-of-use',
      requestsTotal: this.requestsTotal,
      requestsFailed: this.requestsFailed,
      rateLimitedCount: this.rateLimitedCount,
      cacheHits,
      avgLatencyMs:
        this.requestsTotal > 0 ? Math.round(this.totalLatencyMs / this.requestsTotal) : 0,
      lastRequestAt: this.lastRequestAt,
      lastError: this.lastError,
      rateLimitRemaining: this.rateLimitRemaining,
    };
  }

  async execute<TData>(
    dedupeKey: string,
    query: string,
    variables: Record<string, unknown>,
  ): Promise<AniListClientResult<TData>> {
    if (!this.config.enabled) {
      return {
        ok: false,
        kind: 'DISABLED',
        message: 'AniList integration is disabled (ENRICHMENT_ANILIST_ENABLED=false).',
      };
    }

    if (Date.now() < this.circuitOpenUntil) {
      return {
        ok: false,
        kind: 'UNAVAILABLE',
        message: 'AniList circuit breaker is temporarily open after repeated upstream failures.',
      };
    }

    try {
      return await this.rateLimiter.schedule(dedupeKey, () =>
        this.executeWithRetries<TData>(query, variables),
      );
    } catch (err) {
      if (err instanceof AniListRateLimitError) {
        this.rateLimitedCount += 1;
        this.lastError = err.message;
        return {
          ok: false,
          kind: 'RATE_LIMITED',
          message: err.message,
          retryAfterSeconds: err.retryAfterSeconds,
        };
      }
      const msg = err instanceof Error ? err.message : 'AniList request failed';
      this.requestsFailed += 1;
      this.lastError = msg;
      return { ok: false, kind: 'UNAVAILABLE', message: msg };
    }
  }

  private async executeWithRetries<TData>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<AniListClientResult<TData>> {
    const maxAttempts = Math.max(1, this.config.maxRetries + 1);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const started = Date.now();
      this.requestsTotal += 1;
      this.lastRequestAt = new Date().toISOString();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await this.fetchImpl(this.config.endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'AnimeVerse-Intelligence/0.1 (UNOFFICIAL; analytical metadata tool)',
          },
          body: JSON.stringify({ query, variables }),
        });

        this.totalLatencyMs += Date.now() - started;

        const remainingHeader = response.headers.get('x-ratelimit-remaining');
        if (remainingHeader !== null && Number.isFinite(Number(remainingHeader))) {
          this.rateLimitRemaining = Number(remainingHeader);
        }

        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('retry-after') ?? 60) || 60;
          this.rateLimitedCount += 1;
          this.rateLimiter.registerUpstreamCooldown(retryAfter);
          this.lastError = `HTTP 429 Too Many Requests (Retry-After: ${retryAfter}s)`;
          return {
            ok: false,
            kind: 'RATE_LIMITED',
            message: this.lastError,
            retryAfterSeconds: retryAfter,
          };
        }

        if (response.status === 403) {
          this.requestsFailed += 1;
          this.lastError = 'HTTP 403 Forbidden from AniList.';
          return { ok: false, kind: 'FORBIDDEN', message: this.lastError };
        }

        if (!response.ok) {
          this.recordFailure(`HTTP ${response.status} from AniList`);
          if (attempt < maxAttempts && response.status >= 500) {
            await this.sleepBackoff(attempt);
            continue;
          }
          return {
            ok: false,
            kind: 'UNAVAILABLE',
            message: `AniList upstream returned HTTP ${response.status}.`,
          };
        }

        let parsed: AniListGraphQLResponse<TData>;
        try {
          parsed = (await response.json()) as AniListGraphQLResponse<TData>;
        } catch {
          this.recordFailure('Invalid JSON payload from AniList');
          return {
            ok: false,
            kind: 'INVALID_PAYLOAD',
            message: 'AniList returned malformed JSON.',
          };
        }

        if (parsed.errors && parsed.errors.length > 0 && !parsed.data) {
          const msg = parsed.errors.map((e) => e.message ?? 'GraphQL error').join('; ');
          this.requestsFailed += 1;
          this.lastError = msg;
          return { ok: false, kind: 'GRAPHQL_ERROR', message: msg };
        }

        if (!parsed.data) {
          this.recordFailure('Missing data field in AniList response');
          return {
            ok: false,
            kind: 'INVALID_PAYLOAD',
            message: 'AniList response missing data field.',
          };
        }

        this.consecutiveFailures = 0;
        return { ok: true, data: parsed.data };
      } catch (err) {
        this.totalLatencyMs += Date.now() - started;
        const msg = err instanceof Error ? err.message : 'Network error';
        this.recordFailure(msg);
        if (attempt < maxAttempts) {
          await this.sleepBackoff(attempt);
          continue;
        }
        return { ok: false, kind: 'UNAVAILABLE', message: msg };
      } finally {
        clearTimeout(timer);
      }
    }

    return { ok: false, kind: 'UNAVAILABLE', message: 'AniList request failed after retries.' };
  }

  private recordFailure(message: string): void {
    this.requestsFailed += 1;
    this.lastError = message;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= 3) {
      this.circuitOpenUntil = Date.now() + 60_000;
    }
  }

  private async sleepBackoff(attempt: number): Promise<void> {
    const baseMs = 150 * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 50);
    await new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
  }
}
