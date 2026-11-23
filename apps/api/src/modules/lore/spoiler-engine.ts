import type {
  LoreEntityDto,
  LoreEventDto,
  LoreGraphResponseDto,
  LoreMediaKind,
  LoreRelationDto,
} from '@animeverse/contracts';

export interface LoreDataset {
  workId: string;
  media: LoreMediaKind;
  version: string;
  events: LoreEventDto[];
  entities: LoreEntityDto[];
  relations: LoreRelationDto[];
}

export interface LoreFilterOptions {
  media: LoreMediaKind;
  version: string;
  progress?: number; // undefined -> conservative 0 (spoiler-free)
  allowSpoilers?: boolean;
}

/**
 * Enforces backend spoiler protection BEFORE serialization, counts, search, or graph output.
 * - Never leaks DRAFT / REVIEWED / RETRACTED items to public consumers.
 * - Never assumes completed work when progress is omitted (defaults conservatively to 0).
 * - Never auto-converts MANGA chapters to ANIME episodes (requires exact media + version match).
 */
export function filterLoreDataset(
  dataset: LoreDataset,
  options: LoreFilterOptions,
): LoreGraphResponseDto {
  const spoilersUnlocked = Boolean(options.allowSpoilers);
  const maxPosition = spoilersUnlocked
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, options.progress ?? 0);

  if (dataset.media !== options.media || dataset.version !== options.version) {
    return {
      workId: dataset.workId,
      media: options.media,
      version: options.version,
      appliedMaxPosition: spoilersUnlocked ? -1 : maxPosition,
      spoilersUnlocked,
      notice:
        'Requested media/version does not match this lore scope; cross-media progress conversion is prohibited.',
      events: [],
      entities: [],
      relations: [],
    };
  }

  const safeEvents = dataset.events
    .filter(
      (e) =>
        e.publicationStatus === 'PUBLISHED' &&
        e.media === options.media &&
        e.version === options.version &&
        e.spoilerPosition <= maxPosition,
    )
    .sort((a, b) => a.releaseOrder - b.releaseOrder);

  const safeEventIds = new Set(safeEvents.map((e) => e.id));

  const safeEntities = dataset.entities.filter((ent) => ent.firstSafePosition <= maxPosition);
  const safeEntityIds = new Set(safeEntities.map((ent) => ent.id));

  const safeRelations = dataset.relations.filter((rel) => {
    if (rel.minSafePosition > maxPosition) return false;
    const fromVisible = safeEventIds.has(rel.fromId) || safeEntityIds.has(rel.fromId);
    const toVisible = safeEventIds.has(rel.toId) || safeEntityIds.has(rel.toId);
    return fromVisible && toVisible;
  });

  return {
    workId: dataset.workId,
    media: options.media,
    version: options.version,
    appliedMaxPosition: spoilersUnlocked ? -1 : maxPosition,
    spoilersUnlocked,
    notice: spoilersUnlocked
      ? 'Explicit full-spoiler mode enabled by user.'
      : `Backend spoiler boundary enforced at ${options.media} position <= ${maxPosition}.`,
    events: safeEvents,
    entities: safeEntities,
    relations: safeRelations,
  };
}
