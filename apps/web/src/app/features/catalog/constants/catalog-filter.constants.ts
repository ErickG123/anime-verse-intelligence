import type { AnimeSeason, AnimeStatus, AnimeType } from '@animeverse/contracts';
import type { CatalogFilterState } from '@features/catalog/models/catalog.model';

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  q: '',
  type: '',
  status: '',
  season: '',
  year: '',
  tag: '',
  studio: '',
  sortBy: 'title',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
};

export const ANIME_TYPES: readonly AnimeType[] = [
  'TV',
  'MOVIE',
  'OVA',
  'ONA',
  'SPECIAL',
  'UNKNOWN',
];

export const ANIME_STATUSES: readonly AnimeStatus[] = [
  'FINISHED',
  'ONGOING',
  'UPCOMING',
  'UNKNOWN',
];

export const ANIME_SEASONS: readonly AnimeSeason[] = [
  'SPRING',
  'SUMMER',
  'FALL',
  'WINTER',
  'UNDEFINED',
];
