export class AniListRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AniListRateLimiter {
  private readonly timestamps: number[] = [];
  private activeCount = 0;
  private blockedUntilMs = 0;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly maxPerMinute: number,
    private readonly maxConcurrent: number,
  ) {}

  registerUpstreamCooldown(seconds: number): void {
    const until = Date.now() + Math.max(1, seconds) * 1000;
    if (until > this.blockedUntilMs) {
      this.blockedUntilMs = until;
    }
  }

  async schedule<T>(dedupeKey: string, task: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(dedupeKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const now = Date.now();
    if (now < this.blockedUntilMs) {
      const waitSec = Math.ceil((this.blockedUntilMs - now) / 1000);
      throw new AniListRateLimitError(
        `AniList upstream cooldown active. Retry after ${waitSec}s.`,
        waitSec,
      );
    }

    this.pruneWindow(now);
    if (this.timestamps.length >= this.maxPerMinute) {
      const oldest = this.timestamps[0] ?? now;
      const waitSec = Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000));
      throw new AniListRateLimitError(
        `Conservative local AniList rate limit (${this.maxPerMinute}/min) reached.`,
        waitSec,
      );
    }

    if (this.activeCount >= this.maxConcurrent) {
      throw new AniListRateLimitError(
        `AniList concurrency limit (${this.maxConcurrent}) reached.`,
        2,
      );
    }

    this.timestamps.push(now);
    this.activeCount += 1;

    const promise = (async () => {
      try {
        return await task();
      } finally {
        this.activeCount -= 1;
        this.inFlight.delete(dedupeKey);
      }
    })();

    this.inFlight.set(dedupeKey, promise);
    return promise;
  }

  private pruneWindow(now: number): void {
    const cutoff = now - 60_000;
    while (this.timestamps.length > 0 && (this.timestamps[0] ?? 0) < cutoff) {
      this.timestamps.shift();
    }
  }
}
