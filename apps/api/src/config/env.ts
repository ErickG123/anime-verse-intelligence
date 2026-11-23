export interface AppEnv {
  nodeEnv: 'development' | 'test' | 'production';
  apiHost: string;
  apiPort: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  corsOrigin: string[];
  enableSwagger: boolean;
  rateLimitMax: number;
  rateLimitWindow: string;
  databaseUrl?: string;
  tmdbApiKey?: string;
  tmdbReadAccessToken?: string;
  enrichmentFlags: {
    anilist: boolean;
    wikidata: boolean;
    mangaupdates: boolean;
    tmdb: boolean;
  };
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid environment variable ${name}: expected positive integer.`);
  }
  return parsed;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const rawEnv = source['NODE_ENV'] ?? 'development';
  const nodeEnv: AppEnv['nodeEnv'] =
    rawEnv === 'production' || rawEnv === 'test' || rawEnv === 'development'
      ? rawEnv
      : 'development';

  const rawLogLevel = source['LOG_LEVEL'] ?? (nodeEnv === 'test' ? 'silent' : 'info');
  const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
  const logLevel = (validLevels as readonly string[]).includes(rawLogLevel)
    ? (rawLogLevel as AppEnv['logLevel'])
    : 'info';

  const corsRaw = source['CORS_ORIGIN'] ?? 'http://localhost:4200';
  const corsOrigin = corsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    nodeEnv,
    apiHost: source['API_HOST'] ?? '127.0.0.1',
    apiPort: parsePositiveInt(source['API_PORT'], 3000, 'API_PORT'),
    logLevel,
    corsOrigin,
    enableSwagger: parseBool(source['ENABLE_SWAGGER'], nodeEnv !== 'production'),
    rateLimitMax: parsePositiveInt(source['RATE_LIMIT_MAX'], 200, 'RATE_LIMIT_MAX'),
    rateLimitWindow: source['RATE_LIMIT_WINDOW'] ?? '1 minute',
    databaseUrl: source['DATABASE_URL'],
    tmdbApiKey: source['TMDB_API_KEY']?.trim() || undefined,
    tmdbReadAccessToken: source['TMDB_READ_ACCESS_TOKEN']?.trim() || undefined,
    enrichmentFlags: {
      anilist: parseBool(source['ENRICHMENT_ANILIST_ENABLED'], false),
      wikidata: parseBool(source['ENRICHMENT_WIKIDATA_ENABLED'], false),
      mangaupdates: parseBool(source['ENRICHMENT_MANGAUPDATES_ENABLED'], false),
      tmdb: parseBool(source['ENRICHMENT_TMDB_ENABLED'], false),
    },
  };
}
