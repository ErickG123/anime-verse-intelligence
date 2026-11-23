import type { StudioGraphEdgeDto, StudioGraphNodeDto } from '@animeverse/contracts';
import type { SubgraphPathResult } from '@features/studios/models/studio-graph.model';

export function mergeStudioGraphPages(
  existingNodes: readonly StudioGraphNodeDto[],
  existingEdges: readonly StudioGraphEdgeDto[],
  incomingNodes: readonly StudioGraphNodeDto[],
  incomingEdges: readonly StudioGraphEdgeDto[],
): { nodes: StudioGraphNodeDto[]; edges: StudioGraphEdgeDto[] } {
  const nodeMap = new Map<string, StudioGraphNodeDto>();
  for (const n of existingNodes) nodeMap.set(n.id, n);
  for (const n of incomingNodes) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  }

  const edgeMap = new Map<string, StudioGraphEdgeDto>();
  for (const e of existingEdges) edgeMap.set(e.id, e);
  for (const e of incomingEdges) {
    if (!edgeMap.has(e.id)) edgeMap.set(e.id, e);
  }

  return { nodes: [...nodeMap.values()], edges: [...edgeMap.values()] };
}

export function findShortestPathInSubgraph(
  nodes: readonly StudioGraphNodeDto[],
  edges: readonly StudioGraphEdgeDto[],
  fromId: string,
  toId: string,
): SubgraphPathResult {
  const scopeNotice =
    'Path computed strictly over currently loaded subgraph nodes; additional paths may exist outside the loaded page.';

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  if (!nodeMap.has(fromId) || !nodeMap.has(toId)) {
    return { found: false, nodeIds: [], nodes: [], edges: [], scopeNotice };
  }
  if (fromId === toId) {
    const self = nodeMap.get(fromId)!;
    return { found: true, nodeIds: [fromId], nodes: [self], edges: [], scopeNotice };
  }

  const adj = new Map<string, Array<{ neighbor: string; edge: StudioGraphEdgeDto }>>();
  for (const edge of edges) {
    const a = adj.get(edge.source) ?? [];
    a.push({ neighbor: edge.target, edge });
    adj.set(edge.source, a);

    const b = adj.get(edge.target) ?? [];
    b.push({ neighbor: edge.source, edge });
    adj.set(edge.target, b);
  }

  const visited = new Set<string>([fromId]);
  const parent = new Map<string, { prev: string; edge: StudioGraphEdgeDto }>();
  const queue: string[] = [fromId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === toId) break;
    for (const next of adj.get(current) ?? []) {
      if (!visited.has(next.neighbor)) {
        visited.add(next.neighbor);
        parent.set(next.neighbor, { prev: current, edge: next.edge });
        queue.push(next.neighbor);
      }
    }
  }

  if (!parent.has(toId)) {
    return { found: false, nodeIds: [], nodes: [], edges: [], scopeNotice };
  }

  const nodeIds: string[] = [];
  const pathEdges: StudioGraphEdgeDto[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    nodeIds.unshift(cursor);
    const step = parent.get(cursor);
    if (!step) break;
    pathEdges.unshift(step.edge);
    cursor = step.prev;
  }
  nodeIds.unshift(fromId);

  return {
    found: true,
    nodeIds,
    nodes: nodeIds.map((id) => nodeMap.get(id)!).filter(Boolean),
    edges: pathEdges,
    scopeNotice,
  };
}
