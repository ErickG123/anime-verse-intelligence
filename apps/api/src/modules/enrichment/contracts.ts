export interface SourceCapabilities {
  animeMetadata: boolean;
  mangaMetadata: boolean;
  characters: boolean;
  staffCredits: boolean;
  bulkSnapshotAllowed: boolean;
}

export interface FetchPolicy {
  enabled: boolean;
  timeoutMs: number;
  maxRequestsPerMinute: number;
  cacheTtlSeconds: number;
  allowPersistentMirror: boolean;
}

export interface SourceAttribution {
  name: string;
  license: string;
  documentationUrl: string;
  requiredNotice: string;
}

export interface ExternalIdentity {
  provider: string;
  externalId: string;
  normalizedUrl: string;
}

export interface EnrichmentConflict {
  field: string;
  existingValue: unknown;
  incomingValue: unknown;
  provider: string;
  requiresHumanReview: boolean;
}

export interface EnrichmentResult<TPayload = Record<string, unknown>> {
  provider: string;
  identity: ExternalIdentity;
  fetchedAt: string;
  payload: TPayload | null;
  conflicts: EnrichmentConflict[];
  status: 'OK' | 'DISABLED' | 'RATE_LIMITED' | 'ERROR';
  message?: string;
}

export interface IDataProvider {
  readonly sourceId: string;
  readonly capabilities: SourceCapabilities;
  readonly fetchPolicy: FetchPolicy;
  readonly attribution: SourceAttribution;
  fetchByExternalId(identity: ExternalIdentity): Promise<EnrichmentResult>;
}

// Post-MVP domain contracts (never populated with fabricated data in MVP)
export interface CharacterContract {
  id: string;
  name: string;
  localizedNames: Record<string, string>;
  provenanceSourceId: string;
}

export interface StaffCreditContract {
  personName: string;
  role: string;
  animeId: string;
  provenanceSourceId: string;
}

export interface MangaWorkContract {
  id: string;
  title: string;
  externalIds: ExternalIdentity[];
  provenanceSourceId: string;
}
