import type {
  AnimeSeason,
  AnimeSortField,
  AnimeStatus,
  AnimeType,
  RelatedAnimeItemDto,
  SortOrder,
} from '@animeverse/contracts';

export interface CatalogFilterState {
  q: string;
  type: AnimeType | '';
  status: AnimeStatus | '';
  season: AnimeSeason | '';
  year: string;
  tag: string;
  studio: string;
  sortBy: AnimeSortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface RelatedAnimeApiResponse {
  animeId: string;
  notice: string;
  items: RelatedAnimeItemDto[];
}
