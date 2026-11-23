import type {
  CompanyRole,
  StudioGraphEdgeDto,
  StudioGraphMode,
  StudioGraphNodeDto,
} from '@animeverse/contracts';

export interface StudioGraphExplorerFilters {
  mode: StudioGraphMode;
  role: CompanyRole | '';
  yearFrom: string;
  yearTo: string;
  limit: number;
  nodeSearch: string;
}

export interface StudioGraphLegendItem {
  kind: 'ANIME' | 'STUDIO' | 'PRODUCER' | 'PERSON';
  shapeLabel: string;
  labelKey: string;
}

export interface SubgraphPathResult {
  found: boolean;
  nodeIds: string[];
  nodes: StudioGraphNodeDto[];
  edges: StudioGraphEdgeDto[];
  scopeNotice: string;
}
