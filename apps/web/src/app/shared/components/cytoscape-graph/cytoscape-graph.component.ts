import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import cytoscape, { type Core } from 'cytoscape';
import type { GraphEdgeDto, GraphNodeDto } from '@animeverse/contracts';

@Component({
  selector: 'app-cytoscape-graph',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cytoscape-graph.component.html',
  styleUrl: './cytoscape-graph.component.scss',
})
export class CytoscapeGraphComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = viewChild<ElementRef<HTMLDivElement>>('graphHost');

  readonly nodes = input.required<GraphNodeDto[]>();
  readonly edges = input.required<GraphEdgeDto[]>();
  readonly ariaLabel = input<string>('Interactive network graph');
  readonly nodeSelect = output<GraphNodeDto>();

  private cy: Core | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const container = this.hostRef()?.nativeElement;
      const nodes = this.nodes();
      const edges = this.edges();
      if (!container) return;

      this.destroyGraph();
      if (nodes.length === 0) return;

      this.cy = cytoscape({
        container,
        elements: [
          ...nodes.map((n) => ({
            data: { id: n.id, label: n.label, kind: n.kind, isCenter: Boolean(n.isCenter) },
          })),
          ...edges.map((e) => ({
            data: { id: e.id, source: e.source, target: e.target, label: e.label },
          })),
        ],
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#f1f5f9',
              'font-size': '11px',
              'text-wrap': 'wrap',
              'text-max-width': '110px',
              'background-color': '#38bdf8',
              shape: 'ellipse',
              width: 30,
              height: 30,
            },
          },
          {
            selector: 'node[kind = "STUDIO"]',
            style: {
              'background-color': '#a78bfa',
              shape: 'round-rectangle',
              width: 36,
              height: 30,
            },
          },
          {
            selector: 'node[kind = "PRODUCER"]',
            style: {
              'background-color': '#fbbf24',
              shape: 'hexagon',
              width: 34,
              height: 34,
            },
          },
          {
            selector: 'node[kind = "PERSON"]',
            style: {
              'background-color': '#34d399',
              shape: 'diamond',
              width: 32,
              height: 32,
            },
          },
          {
            selector: 'node[?isCenter]',
            style: {
              'background-color': '#ff5c7c',
              width: 42,
              height: 42,
              'font-weight': 'bold',
            },
          },
          {
            selector: 'edge',
            style: {
              label: 'data(label)',
              'font-size': '9px',
              color: '#94a3b8',
              'line-color': '#475569',
              width: 2,
              'curve-style': 'bezier',
            },
          },
        ],
        layout: { name: 'cose', animate: false, padding: 24 },
      });

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      this.cy.on('tap', 'node', (evt) => {
        const id = String(evt.target.id());
        const found = nodeMap.get(id);
        if (found) {
          this.nodeSelect.emit(found);
        }
      });

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.cy?.resize();
        });
        this.resizeObserver.observe(container);
      }
    });

    this.destroyRef.onDestroy(() => this.destroyGraph());
  }

  resetView(): void {
    this.cy?.fit(undefined, 24);
  }

  focusNode(nodeId: string): void {
    if (!this.cy) return;
    const ele = this.cy.getElementById(nodeId);
    if (ele.length > 0) {
      this.cy.animate({ center: { eles: ele }, zoom: 1.35 }, { duration: 180 });
    }
  }

  private destroyGraph(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
  }
}
