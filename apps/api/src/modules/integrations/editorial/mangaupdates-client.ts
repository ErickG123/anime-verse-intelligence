export interface MangaUpdatesSeriesSummary {
  seriesId: number;
  title: string;
  alternativeTitles: string[];
  mediaType: string;
  year: string | null;
  status: string | null;
  authors: Array<{ name: string; type: string }>;
  publishers: Array<{ name: string; type: string }>;
  url: string;
}

export type EditorialClientResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      kind: 'DISABLED' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'INVALID_PAYLOAD';
      message: string;
    };

export class MangaUpdatesClient {
  private readonly cache = new Map<
    number,
    { value: MangaUpdatesSeriesSummary; expiresAt: number }
  >();
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly options: { enabled: boolean; timeoutMs?: number; cacheTtlMs?: number },
    fetchImpl?: typeof fetch,
  ) {
    this.fetchImpl = fetchImpl ?? fetch;
  }

  isEnabled(): boolean {
    return this.options.enabled;
  }

  async fetchSeriesById(
    seriesId: number,
  ): Promise<EditorialClientResult<MangaUpdatesSeriesSummary>> {
    if (!this.options.enabled) {
      return {
        ok: false,
        kind: 'DISABLED',
        message: 'MangaUpdates integration is disabled (ENRICHMENT_MANGAUPDATES_ENABLED=false).',
      };
    }

    const cached = this.cache.get(seriesId);
    if (cached && Date.now() < cached.expiresAt) {
      return { ok: true, data: cached.value };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 6000);
    try {
      const response = await this.fetchImpl(
        `https://api.mangaupdates.com/v1/series/${encodeURIComponent(String(seriesId))}`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AnimeVerse-Intelligence/0.1 (metadata attribution client)',
          },
        },
      );

      if (response.status === 429) {
        return { ok: false, kind: 'RATE_LIMITED', message: 'MangaUpdates HTTP 429 rate limit.' };
      }
      if (!response.ok) {
        return {
          ok: false,
          kind: 'UNAVAILABLE',
          message: `MangaUpdates returned HTTP ${response.status}.`,
        };
      }

      const raw = (await response.json()) as Record<string, unknown>;
      const title = typeof raw['title'] === 'string' ? raw['title'].trim() : '';
      if (!title) {
        return {
          ok: false,
          kind: 'INVALID_PAYLOAD',
          message: 'MangaUpdates payload missing title.',
        };
      }

      const associated = Array.isArray(raw['associated'])
        ? (raw['associated'] as Array<{ title?: unknown }>)
            .map((a) => (typeof a?.title === 'string' ? a.title.trim() : ''))
            .filter(Boolean)
        : [];

      const authors = Array.isArray(raw['authors'])
        ? (raw['authors'] as Array<{ name?: unknown; type?: unknown }>)
            .filter((a) => typeof a?.name === 'string')
            .map((a) => ({
              name: String(a.name).trim(),
              type: typeof a.type === 'string' ? a.type.trim() : 'Author',
            }))
        : [];

      const publishers = Array.isArray(raw['publishers'])
        ? (raw['publishers'] as Array<{ publisher_name?: unknown; type?: unknown }>)
            .filter((p) => typeof p?.publisher_name === 'string')
            .map((p) => ({
              name: String(p.publisher_name).trim(),
              type: typeof p.type === 'string' ? p.type.trim() : 'Original',
            }))
        : [];

      // Explicitly omit descriptions, reviews, and cover images per MANGAUPDATES-SOURCE-POLICY.md
      const summary: MangaUpdatesSeriesSummary = {
        seriesId,
        title,
        alternativeTitles: associated,
        mediaType: typeof raw['type'] === 'string' ? raw['type'] : 'Manga',
        year: typeof raw['year'] === 'string' ? raw['year'] : null,
        status: typeof raw['status'] === 'string' ? raw['status'] : null,
        authors,
        publishers,
        url:
          typeof raw['url'] === 'string' && raw['url'].startsWith('https://')
            ? raw['url']
            : `https://www.mangaupdates.com/series.html?id=${seriesId}`,
      };

      this.cache.set(seriesId, {
        value: summary,
        expiresAt: Date.now() + (this.options.cacheTtlMs ?? 300_000),
      });
      return { ok: true, data: summary };
    } catch (err) {
      return {
        ok: false,
        kind: 'UNAVAILABLE',
        message: err instanceof Error ? err.message : 'MangaUpdates network error',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
