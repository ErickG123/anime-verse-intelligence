import type {
  AniListCharacterDto,
  AniListMediaOverviewDto,
  AniListPageInfoDto,
  AniListStaffDto,
  AniListStudioDto,
  AniListVoiceActorDto,
} from '@animeverse/contracts';
import type {
  RawAniListCharacterEdge,
  RawAniListMediaOverview,
  RawAniListPageInfo,
  RawAniListStaffEdge,
  RawAniListStudioEdge,
} from './models.js';

export const ANILIST_ATTRIBUTION =
  'External metadata provided on-demand by AniList GraphQL API (not permanently stored).';

export function sanitizeExternalText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const stripped = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || null;
}

export function mapPageInfo(
  raw: RawAniListPageInfo | null | undefined,
  fallbackPage: number,
  fallbackPerPage: number,
): AniListPageInfoDto {
  return {
    currentPage: raw?.currentPage ?? fallbackPage,
    perPage: raw?.perPage ?? fallbackPerPage,
    hasNextPage: Boolean(raw?.hasNextPage),
    total: raw?.total ?? null,
  };
}

export function mapMediaOverview(
  raw: RawAniListMediaOverview,
  cached: boolean,
): AniListMediaOverviewDto {
  const safeLinks: Array<{ site: string; url: string }> = [];
  for (const link of raw.externalLinks ?? []) {
    if (!link?.site || !link?.url) continue;
    try {
      const parsed = new URL(link.url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        safeLinks.push({ site: link.site.trim(), url: parsed.toString() });
      }
    } catch {
      // Ignore malformed external URL
    }
  }

  return {
    state: 'OK',
    source: 'anilist',
    attribution: ANILIST_ATTRIBUTION,
    cached,
    anilistId: raw.id,
    siteUrl: raw.siteUrl ?? `https://anilist.co/anime/${raw.id}`,
    format: raw.format ?? null,
    status: raw.status ?? null,
    descriptionPlain: sanitizeExternalText(raw.description),
    isAdult: Boolean(raw.isAdult),
    externalLinks: safeLinks,
  };
}

export function mapCharacterEdges(
  edges: Array<RawAniListCharacterEdge | null> | null | undefined,
): AniListCharacterDto[] {
  const result: AniListCharacterDto[] = [];
  for (const edge of edges ?? []) {
    const id = edge?.node?.id;
    const name = edge?.node?.name?.full?.trim();
    if (!id || !name) continue;

    const alternativeNames = (edge?.node?.name?.alternative ?? [])
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim());

    const voiceActors: AniListVoiceActorDto[] = [];
    for (const va of edge?.voiceActors ?? []) {
      const vaId = va?.id;
      const vaName = va?.name?.full?.trim();
      if (!vaId || !vaName) continue;
      voiceActors.push({
        id: vaId,
        name: vaName,
        language: va?.languageV2?.trim() || null,
      });
    }

    result.push({
      id,
      name,
      alternativeNames,
      role: edge?.role?.trim() || 'UNKNOWN',
      voiceActors,
    });
  }
  return result;
}

export function mapStaffEdges(
  edges: Array<RawAniListStaffEdge | null> | null | undefined,
): AniListStaffDto[] {
  const result: AniListStaffDto[] = [];
  for (const edge of edges ?? []) {
    const id = edge?.node?.id;
    const name = edge?.node?.name?.full?.trim();
    if (!id || !name) continue;
    result.push({
      id,
      name,
      role: edge?.role?.trim() || 'UNSPECIFIED',
    });
  }
  return result;
}

export function mapStudioEdges(
  edges: Array<RawAniListStudioEdge | null> | null | undefined,
): AniListStudioDto[] {
  const result: AniListStudioDto[] = [];
  for (const edge of edges ?? []) {
    const id = edge?.node?.id;
    const name = edge?.node?.name?.trim();
    if (!id || !name) continue;
    result.push({
      id,
      name,
      isMain: Boolean(edge?.isMain),
      isAnimationStudio: Boolean(edge?.node?.isAnimationStudio),
    });
  }
  return result;
}
