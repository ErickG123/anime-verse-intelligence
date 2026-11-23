import { and, eq } from 'drizzle-orm';
import type { AppDatabase } from '../../../db/client.js';
import { anime, externalReference } from '../../../db/schema.js';
import { normalizeSearchText } from '../../sources/url-normalizer.js';

export interface ResolvedAniListIdentity {
  animeId: string;
  animeTitle: string;
  anilistId: number | null;
  siteUrl: string | null;
  confidence: 'EXACT_EXTERNAL_ID' | 'UNLINKED';
}

export interface TitleMatchCandidate {
  anilistId: number;
  title: string;
  format: string | null;
  seasonYear: number | null;
}

export interface TitleMatchEvaluation {
  status: 'SUGGESTED' | 'AMBIGUOUS' | 'NO_MATCH';
  candidates: TitleMatchCandidate[];
  reason: string;
}

export interface AniListIdentityResolver {
  resolveByAnimeId(animeId: string): Promise<ResolvedAniListIdentity | null>;
}

/**
 * Pure heuristic evaluator for title suggestions — NEVER auto-links;
 * flags remakes, different formats (TV vs MOVIE/OVA), or multiple matching years as AMBIGUOUS.
 */
export function evaluateTitleMatchSuggestions(
  local: { title: string; type: string; seasonYear: number | null },
  candidates: readonly TitleMatchCandidate[],
): TitleMatchEvaluation {
  const normLocal = normalizeSearchText(local.title);
  const matching = candidates.filter((c) => {
    const normCand = normalizeSearchText(c.title);
    const titleClose = normCand === normLocal || normCand.includes(normLocal);
    const formatCompatible =
      !c.format || local.type === 'UNKNOWN' || c.format.toUpperCase() === local.type.toUpperCase();
    const yearCompatible =
      local.seasonYear === null || c.seasonYear === null || local.seasonYear === c.seasonYear;
    return titleClose && formatCompatible && yearCompatible;
  });

  if (matching.length === 0) {
    return {
      status: 'NO_MATCH',
      candidates: [],
      reason: 'No candidate matched title, format, and year constraints.',
    };
  }

  if (matching.length > 1) {
    return {
      status: 'AMBIGUOUS',
      candidates: matching,
      reason:
        'Multiple candidates matched (possible remake, sequel, or alternate season); manual review required.',
    };
  }

  return {
    status: 'SUGGESTED',
    candidates: matching,
    reason:
      'Single high-confidence suggestion found; requires explicit confirmation before linking.',
  };
}

export class DrizzleAniListIdentityResolver implements AniListIdentityResolver {
  constructor(private readonly db: AppDatabase) {}

  async resolveByAnimeId(animeId: string): Promise<ResolvedAniListIdentity | null> {
    const [animeRow] = await this.db
      .select({ id: anime.id, title: anime.title })
      .from(anime)
      .where(eq(anime.id, animeId))
      .limit(1);

    if (!animeRow) return null;

    const [ref] = await this.db
      .select({
        externalId: externalReference.externalId,
        normalizedUrl: externalReference.normalizedUrl,
      })
      .from(externalReference)
      .where(and(eq(externalReference.animeId, animeId), eq(externalReference.provider, 'anilist')))
      .limit(1);

    const parsedId =
      ref?.externalId && /^\d+$/.test(ref.externalId) ? Number(ref.externalId) : null;

    if (parsedId !== null) {
      return {
        animeId: animeRow.id,
        animeTitle: animeRow.title,
        anilistId: parsedId,
        siteUrl: ref?.normalizedUrl ?? `https://anilist.co/anime/${parsedId}`,
        confidence: 'EXACT_EXTERNAL_ID',
      };
    }

    return {
      animeId: animeRow.id,
      animeTitle: animeRow.title,
      anilistId: null,
      siteUrl: null,
      confidence: 'UNLINKED',
    };
  }
}
