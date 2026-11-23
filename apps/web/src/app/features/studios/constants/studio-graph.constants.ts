import type {
  StudioGraphExplorerFilters,
  StudioGraphLegendItem,
} from '@features/studios/models/studio-graph.model';

export const DEFAULT_STUDIO_GRAPH_FILTERS: StudioGraphExplorerFilters = {
  mode: 'PRODUCTION',
  role: 'STUDIO',
  yearFrom: '',
  yearTo: '',
  limit: 30,
  nodeSearch: '',
};

export const STUDIO_GRAPH_LEGEND: readonly StudioGraphLegendItem[] = [
  { kind: 'ANIME', shapeLabel: 'Circle', labelKey: 'studios.legendAnime' },
  { kind: 'STUDIO', shapeLabel: 'Rounded Rect', labelKey: 'studios.roleStudio' },
  { kind: 'PRODUCER', shapeLabel: 'Hexagon', labelKey: 'studios.roleProducer' },
  { kind: 'PERSON', shapeLabel: 'Diamond', labelKey: 'studios.legendPerson' },
];
