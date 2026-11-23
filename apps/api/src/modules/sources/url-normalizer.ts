export interface NormalizedExternalRef {
  provider: string;
  externalId: string | null;
  normalizedUrl: string;
  rawUrl: string;
}

interface ProviderPattern {
  provider: string;
  hostSuffix: string;
  idRegex: RegExp;
  canonicalize?: (id: string) => string;
}

const PROVIDER_PATTERNS: readonly ProviderPattern[] = [
  {
    provider: 'myanimelist',
    hostSuffix: 'myanimelist.net',
    idRegex: /^\/anime\/(\d+)/i,
    canonicalize: (id) => `https://myanimelist.net/anime/${id}`,
  },
  {
    provider: 'anilist',
    hostSuffix: 'anilist.co',
    idRegex: /^\/anime\/(\d+)/i,
    canonicalize: (id) => `https://anilist.co/anime/${id}`,
  },
  {
    provider: 'anidb',
    hostSuffix: 'anidb.net',
    idRegex: /^\/(?:anime\/|a)(\d+)/i,
    canonicalize: (id) => `https://anidb.net/anime/${id}`,
  },
  {
    provider: 'kitsu',
    hostSuffix: 'kitsu.app',
    idRegex: /^\/anime\/([^/?#]+)/i,
    canonicalize: (id) => `https://kitsu.app/anime/${id}`,
  },
  {
    provider: 'kitsu',
    hostSuffix: 'kitsu.io',
    idRegex: /^\/anime\/([^/?#]+)/i,
    canonicalize: (id) => `https://kitsu.app/anime/${id}`,
  },
  {
    provider: 'livechart',
    hostSuffix: 'livechart.me',
    idRegex: /^\/anime\/(\d+)/i,
    canonicalize: (id) => `https://livechart.me/anime/${id}`,
  },
  {
    provider: 'anime-planet',
    hostSuffix: 'anime-planet.com',
    idRegex: /^\/anime\/([^/?#]+)/i,
    canonicalize: (id) => `https://anime-planet.com/anime/${id.toLowerCase()}`,
  },
  {
    provider: 'anisearch',
    hostSuffix: 'anisearch.com',
    idRegex: /^\/anime\/(\d+)/i,
    canonicalize: (id) => `https://anisearch.com/anime/${id}`,
  },
  {
    provider: 'notify-moe',
    hostSuffix: 'notify.moe',
    idRegex: /^\/anime\/([^/?#]+)/i,
    canonicalize: (id) => `https://notify.moe/anime/${id}`,
  },
  {
    provider: 'simkl',
    hostSuffix: 'simkl.com',
    idRegex: /^\/anime\/(\d+)/i,
    canonicalize: (id) => `https://simkl.com/anime/${id}`,
  },
  {
    provider: 'animecountdown',
    hostSuffix: 'animecountdown.com',
    idRegex: /^\/(\d+)/i,
    canonicalize: (id) => `https://animecountdown.com/${id}`,
  },
];

export function normalizeExternalUrl(rawUrl: string): NormalizedExternalRef | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/';

  // Handle query-parameter-based providers (e.g. AnimeNewsNetwork encyclopedia/anime.php?id=123)
  if (host === 'animenewsnetwork.com' || host.endsWith('.animenewsnetwork.com')) {
    const annId = parsed.searchParams.get('id');
    if (annId && /^\d+$/.test(annId)) {
      return {
        provider: 'animenewsnetwork',
        externalId: annId,
        normalizedUrl: `https://animenewsnetwork.com/encyclopedia/anime.php?id=${annId}`,
        rawUrl: trimmed,
      };
    }
  }

  for (const rule of PROVIDER_PATTERNS) {
    if (host === rule.hostSuffix || host.endsWith(`.${rule.hostSuffix}`)) {
      const match = pathname.match(rule.idRegex);
      const externalId = match?.[1] ?? null;
      const normalizedUrl =
        externalId && rule.canonicalize
          ? rule.canonicalize(externalId)
          : `https://${host}${pathname}${parsed.search}`;
      return {
        provider: rule.provider,
        externalId,
        normalizedUrl,
        rawUrl: trimmed,
      };
    }
  }

  return {
    provider: host,
    externalId: null,
    normalizedUrl: `https://${host}${pathname}${parsed.search}`,
    rawUrl: trimmed,
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const ALLOWED_DOWNLOAD_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '::1' || lower.endsWith('.local')) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export function validateSafeDownloadUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`Disallowed protocol "${parsed.protocol}". Only https: is allowed.`);
  }

  const host = parsed.hostname.toLowerCase();
  if (isPrivateOrLoopbackHost(host)) {
    throw new Error(`Blocked SSRF attempt to private/loopback host "${host}".`);
  }

  if (!ALLOWED_DOWNLOAD_HOSTS.has(host)) {
    throw new Error(`Host "${host}" is not in the governed download allowlist.`);
  }

  return parsed;
}
