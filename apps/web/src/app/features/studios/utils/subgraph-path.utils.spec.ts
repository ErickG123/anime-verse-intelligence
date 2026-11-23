import type { StudioGraphEdgeDto, StudioGraphNodeDto } from '@animeverse/contracts';
import {
  findShortestPathInSubgraph,
  mergeStudioGraphPages,
} from '@features/studios/utils/subgraph-path.utils';

describe('StudioGraph subgraph utilities', () => {
  const nodes: StudioGraphNodeDto[] = [
    {
      id: 'company:1',
      kind: 'STUDIO',
      label: 'Sunrise',
      internalId: '1',
      provenance: 'LOCAL_DB',
      isCenter: true,
    },
    {
      id: 'anime:a',
      kind: 'ANIME',
      label: 'Cowboy Bebop',
      internalId: 'a',
      provenance: 'LOCAL_DB',
    },
    {
      id: 'person:anilist:9',
      kind: 'PERSON',
      label: 'Shinichirou Watanabe',
      internalId: null,
      provenance: 'ANILIST_ON_DEMAND',
    },
  ];

  const edges: StudioGraphEdgeDto[] = [
    {
      id: 'e1',
      source: 'company:1',
      target: 'anime:a',
      relationKind: 'STUDIO',
      provenance: 'LOCAL_DB',
    },
    {
      id: 'e2',
      source: 'anime:a',
      target: 'person:anilist:9',
      relationKind: 'STAFF_ROLE',
      creditRole: 'Director',
      provenance: 'ANILIST_ON_DEMAND',
    },
  ];

  it('finds shortest path over loaded subgraph with explicit scope notice', () => {
    const res = findShortestPathInSubgraph(nodes, edges, 'company:1', 'person:anilist:9');
    expect(res.found).toBe(true);
    expect(res.nodeIds).toEqual(['company:1', 'anime:a', 'person:anilist:9']);
    expect(res.edges).toHaveLength(2);
    expect(res.scopeNotice).toContain('loaded subgraph');
  });

  it('merges incremental graph pages without duplicating nodes or edges', () => {
    const merged = mergeStudioGraphPages(nodes, edges, [nodes[0]!], [edges[0]!]);
    expect(merged.nodes).toHaveLength(3);
    expect(merged.edges).toHaveLength(2);
  });
});
