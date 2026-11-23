import type {
  EnrichmentResult,
  ExternalIdentity,
  FetchPolicy,
  IDataProvider,
  SourceAttribution,
  SourceCapabilities,
} from './contracts.js';

export interface WikidataAdapterOptions {
  enabled: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class WikidataOptInProvider implements IDataProvider {
  readonly sourceId = 'wikidata';
  readonly capabilities: SourceCapabilities = {
    animeMetadata: true,
    mangaMetadata: true,
    characters: false,
    staffCredits: false,
    bulkSnapshotAllowed: false,
  };
  readonly fetchPolicy: FetchPolicy;
  readonly attribution: SourceAttribution = {
    name: 'Wikidata',
    license: 'CC0 1.0',
    documentationUrl: 'https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service',
    requiredNotice: 'Data from Wikidata contributors (CC0 1.0).',
  };

  private readonly fetchImpl: typeof fetch;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(options: WikidataAdapterOptions) {
    this.fetchPolicy = {
      enabled: options.enabled,
      timeoutMs: options.timeoutMs ?? 5000,
      maxRequestsPerMinute: 30,
      cacheTtlSeconds: 86400,
      allowPersistentMirror: false,
    };
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async fetchByExternalId(identity: ExternalIdentity): Promise<EnrichmentResult> {
    const fetchedAt = new Date().toISOString();

    if (!this.fetchPolicy.enabled) {
      return {
        provider: this.sourceId,
        identity,
        fetchedAt,
        payload: null,
        conflicts: [],
        status: 'DISABLED',
        message: 'Wikidata enrichment is disabled by default (ENRICHMENT_WIKIDATA_ENABLED=false).',
      };
    }

    if (Date.now() < this.circuitOpenUntil) {
      return {
        provider: this.sourceId,
        identity,
        fetchedAt,
        payload: null,
        conflicts: [],
        status: 'ERROR',
        message: 'Circuit breaker open after consecutive upstream failures.',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.fetchPolicy.timeoutMs);
    try {
      const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(identity.externalId)}.json`;
      const response = await this.fetchImpl(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'AnimeVerse-Intelligence/0.1' },
      });

      if (response.status === 429) {
        return {
          provider: this.sourceId,
          identity,
          fetchedAt,
          payload: null,
          conflicts: [],
          status: 'RATE_LIMITED',
          message: 'Upstream rate limit (429).',
        };
      }

      if (!response.ok) {
        this.recordFailure();
        return {
          provider: this.sourceId,
          identity,
          fetchedAt,
          payload: null,
          conflicts: [],
          status: 'ERROR',
          message: `Upstream HTTP ${response.status}`,
        };
      }

      this.consecutiveFailures = 0;
      const json = (await response.json()) as Record<string, unknown>;
      return {
        provider: this.sourceId,
        identity,
        fetchedAt,
        payload: json,
        conflicts: [],
        status: 'OK',
      };
    } catch (err) {
      this.recordFailure();
      return {
        provider: this.sourceId,
        identity,
        fetchedAt,
        payload: null,
        conflicts: [],
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Upstream fetch error',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= 3) {
      this.circuitOpenUntil = Date.now() + 60_000;
    }
  }
}
