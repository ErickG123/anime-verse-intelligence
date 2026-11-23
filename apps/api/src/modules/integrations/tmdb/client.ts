export interface TmdbClientOptions {
  enabled: boolean;
  apiKey?: string;
  readAccessToken?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface TmdbMatchDto {
  tmdbId: number;
  mediaType: 'tv' | 'movie';
  name: string;
  originalName: string | null;
  firstAirDate: string | null;
  overview: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  usageStatus: 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
}

export interface TmdbLookupResult {
  state: 'OK' | 'DISABLED' | 'MISSING_CREDENTIALS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'UNAVAILABLE';
  match: TmdbMatchDto | null;
  attribution: string;
}

const TMDB_ATTRIBUTION = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

export class TmdbClient {
  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly readAccessToken?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, { expiresAt: number; value: TmdbLookupResult }>();

  constructor(options: TmdbClientOptions) {
    this.enabled = options.enabled;
    this.apiKey = options.apiKey;
    this.readAccessToken = options.readAccessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  hasCredentials(): boolean {
    return Boolean(this.readAccessToken || this.apiKey);
  }

  async searchByTitle(
    title: string,
    mediaKind: 'tv' | 'movie',
    year?: number | null,
  ): Promise<TmdbLookupResult> {
    if (!this.enabled) {
      return { state: 'DISABLED', match: null, attribution: TMDB_ATTRIBUTION };
    }
    if (!this.hasCredentials()) {
      return { state: 'MISSING_CREDENTIALS', match: null, attribution: TMDB_ATTRIBUTION };
    }

    const cacheKey = `${mediaKind}::${title.toLowerCase()}::${year ?? ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const endpoint = new URL(`https://api.themoviedb.org/3/search/${mediaKind}`);
    endpoint.searchParams.set('query', title);
    endpoint.searchParams.set('include_adult', 'false');
    if (year) {
      endpoint.searchParams.set(mediaKind === 'tv' ? 'first_air_date_year' : 'year', String(year));
    }
    if (!this.readAccessToken && this.apiKey) {
      endpoint.searchParams.set('api_key', this.apiKey);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'AnimeVerse-Intelligence/0.1.0',
    };
    if (this.readAccessToken) {
      headers['Authorization'] = `Bearer ${this.readAccessToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetchImpl(endpoint.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (res.status === 429) {
        return { state: 'RATE_LIMITED', match: null, attribution: TMDB_ATTRIBUTION };
      }
      if (!res.ok) {
        return { state: 'UNAVAILABLE', match: null, attribution: TMDB_ATTRIBUTION };
      }

      const body = (await res.json()) as {
        results?: Array<{
          id: number;
          name?: string;
          title?: string;
          original_name?: string;
          original_title?: string;
          first_air_date?: string;
          release_date?: string;
          overview?: string;
          vote_average?: number;
          vote_count?: number;
          poster_path?: string | null;
          backdrop_path?: string | null;
        }>;
      };

      const first = body.results?.[0];
      const result: TmdbLookupResult = first
        ? {
            state: 'OK',
            match: {
              tmdbId: first.id,
              mediaType: mediaKind,
              name: first.name ?? first.title ?? title,
              originalName: first.original_name ?? first.original_title ?? null,
              firstAirDate: first.first_air_date ?? first.release_date ?? null,
              overview: first.overview ?? null,
              voteAverage: typeof first.vote_average === 'number' ? first.vote_average : null,
              voteCount: typeof first.vote_count === 'number' ? first.vote_count : null,
              posterUrl: first.poster_path
                ? `https://image.tmdb.org/t/p/w500${first.poster_path}`
                : null,
              backdropUrl: first.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${first.backdrop_path}`
                : null,
              usageStatus: first.poster_path ? 'ALLOWED' : 'UNKNOWN',
            },
            attribution: TMDB_ATTRIBUTION,
          }
        : { state: 'NOT_FOUND', match: null, attribution: TMDB_ATTRIBUTION };

      this.cache.set(cacheKey, { expiresAt: Date.now() + 10 * 60_000, value: result });
      return result;
    } catch {
      return { state: 'UNAVAILABLE', match: null, attribution: TMDB_ATTRIBUTION };
    } finally {
      clearTimeout(timer);
    }
  }
}
