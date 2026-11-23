export type SpoilerLevel = 'NONE' | 'MILD' | 'MAJOR';
export type LoreViewMode = 'timeline' | 'list';

export interface CuratedWorkOption {
  id: string;
  title: string;
  type: string;
  episodes: number | null;
  seasonYear: number | null;
}

export interface LoreArcItem {
  id: string;
  name: string;
  spoilerLevel: SpoilerLevel;
}

export interface LoreEventItem {
  id: string;
  storyArcId: string | null;
  summary: string;
  spoilerLevel: SpoilerLevel;
  confidence: number;
}

export interface LoreRelationItem {
  id: string;
  fromEventId: string;
  toEventId: string;
  relationKind: string;
}

export interface LoreCharacterItem {
  id: string;
  name: string;
}

export interface LoreWorkPayload {
  animeId: string;
  maxSpoiler: SpoilerLevel;
  arcs: LoreArcItem[];
  events: LoreEventItem[];
  relations: LoreRelationItem[];
  characters: LoreCharacterItem[];
  coverage: {
    arcsCount: number;
    visibleEventsCount: number;
    relationsCount: number;
  };
}
