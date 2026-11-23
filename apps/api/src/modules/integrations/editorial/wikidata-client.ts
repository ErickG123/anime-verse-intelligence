import type { EditorialClientResult } from './mangaupdates-client.js';

export interface WikidataEntitySummary {
  qid: string;
  labels: Record<string, string>;
  basedOnQids: string[];
  authorQids: string[];
  publisherQids: string[];
  url: string;
}

const QID_REGEX = /^Q\d+$/;

export function isValidWikidataQid(qid: string): boolean {
  return QID_REGEX.test(qid.trim());
}

function extractClaimQids(claims: Record<string, unknown>, propertyId: string): string[] {
  const prop = claims[propertyId];
  if (!Array.isArray(prop)) return [];
  const qids: string[] = [];
  for (const statement of prop) {
    const mainsnak = (statement as { mainsnak?: { datavalue?: { value?: { id?: unknown } } } })
      ?.mainsnak;
    const id = mainsnak?.datavalue?.value?.id;
    if (typeof id === 'string' && QID_REGEX.test(id)) {
      qids.push(id);
    }
  }
  return [...new Set(qids)];
}

export class WikidataEditorialClient {
  private readonly cache = new Map<string, { value: WikidataEntitySummary; expiresAt: number }>();
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

  async fetchEntityByQid(qid: string): Promise<EditorialClientResult<WikidataEntitySummary>> {
    if (!this.options.enabled) {
      return {
        ok: false,
        kind: 'DISABLED',
        message: 'Wikidata integration is disabled (ENRICHMENT_WIKIDATA_ENABLED=false).',
      };
    }

    const cleanQid = qid.trim();
    if (!isValidWikidataQid(cleanQid)) {
      return { ok: false, kind: 'INVALID_PAYLOAD', message: `Invalid Wikidata QID: "${qid}".` };
    }

    const cached = this.cache.get(cleanQid);
    if (cached && Date.now() < cached.expiresAt) {
      return { ok: true, data: cached.value };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 6000);
    try {
      const response = await this.fetchImpl(
        `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(cleanQid)}.json`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AnimeVerse-Intelligence/0.1 (CC0 metadata research; non-bulk)',
          },
        },
      );

      if (response.status === 429) {
        return { ok: false, kind: 'RATE_LIMITED', message: 'Wikidata HTTP 429 rate limit.' };
      }
      if (!response.ok) {
        return {
          ok: false,
          kind: 'UNAVAILABLE',
          message: `Wikidata returned HTTP ${response.status}.`,
        };
      }

      const raw = (await response.json()) as {
        entities?: Record<
          string,
          { labels?: Record<string, { value?: string }>; claims?: Record<string, unknown> }
        >;
      };
      const entity = raw.entities?.[cleanQid];
      if (!entity) {
        return { ok: false, kind: 'INVALID_PAYLOAD', message: `Entity ${cleanQid} not found.` };
      }

      const labels: Record<string, string> = {};
      for (const lang of ['en', 'pt', 'pt-br', 'ja']) {
        const val = entity.labels?.[lang]?.value;
        if (val) labels[lang] = val;
      }

      const claims = entity.claims ?? {};
      const summary: WikidataEntitySummary = {
        qid: cleanQid,
        labels,
        basedOnQids: extractClaimQids(claims, 'P144'),
        authorQids: [...extractClaimQids(claims, 'P50'), ...extractClaimQids(claims, 'P170')],
        publisherQids: extractClaimQids(claims, 'P123'),
        url: `https://www.wikidata.org/wiki/${cleanQid}`,
      };

      this.cache.set(cleanQid, {
        value: summary,
        expiresAt: Date.now() + (this.options.cacheTtlMs ?? 600_000),
      });
      return { ok: true, data: summary };
    } catch (err) {
      return {
        ok: false,
        kind: 'UNAVAILABLE',
        message: err instanceof Error ? err.message : 'Wikidata network error',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
