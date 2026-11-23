import type { EditorialAssertionDto, EditorialConflictDto } from '@animeverse/contracts';

/**
 * Attribute-level source precedence matrix:
 * - Anime animation studio != manga publisher (different domains, never conflated)
 * - Manual verified curation always takes precedence over external assertions
 */
export const ATTRIBUTE_PRECEDENCE_MATRIX: Record<string, readonly string[]> = {
  anime_studio: ['manual_curation', 'anime-offline-database', 'wikidata'],
  manga_publisher: ['manual_curation', 'mangaupdates', 'wikidata'],
  original_media_type: ['manual_curation', 'mangaupdates', 'wikidata'],
  manga_author: ['manual_curation', 'mangaupdates', 'wikidata'],
  wikidata_qid: ['manual_curation', 'wikidata'],
};

export interface ReconciliationResult {
  canonicalByProperty: Record<string, EditorialAssertionDto>;
  conflicts: EditorialConflictDto[];
}

export function reconcileEditorialAssertions(
  assertions: readonly EditorialAssertionDto[],
): ReconciliationResult {
  const grouped = new Map<string, EditorialAssertionDto[]>();
  for (const a of assertions) {
    const list = grouped.get(a.property) ?? [];
    list.push(a);
    grouped.set(a.property, list);
  }

  const canonicalByProperty: Record<string, EditorialAssertionDto> = {};
  const conflicts: EditorialConflictDto[] = [];

  for (const [property, list] of grouped.entries()) {
    const distinctValues = new Set(list.map((a) => a.value.trim().toLowerCase()));
    const precedence = ATTRIBUTE_PRECEDENCE_MATRIX[property] ?? [
      'manual_curation',
      'wikidata',
      'mangaupdates',
    ];

    const sorted = [...list].sort((a, b) => {
      const rankA = precedence.indexOf(a.source);
      const rankB = precedence.indexOf(b.source);
      return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
    });

    if (sorted[0]) {
      canonicalByProperty[property] = sorted[0];
    }

    if (distinctValues.size > 1) {
      conflicts.push({
        property,
        assertions: sorted.map((a) => ({ ...a, verificationStatus: 'CONFLICT' })),
        resolutionStatus: 'OPEN',
      });
    }
  }

  return { canonicalByProperty, conflicts };
}
