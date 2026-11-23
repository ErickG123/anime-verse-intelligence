import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import type {
  CompanyRole,
  CompanySummaryDto,
  GraphEdgeDto,
  GraphNodeDto,
  StudioGraphEdgeDto,
  StudioGraphMetadataDto,
  StudioGraphMode,
  StudioGraphNodeDto,
  StudioGraphPageDto,
} from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';
import type { AsyncViewState } from '@core/models/ui-state.model';
import { CytoscapeGraphComponent } from '@shared/components/cytoscape-graph/cytoscape-graph.component';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';
import {
  DEFAULT_STUDIO_GRAPH_FILTERS,
  STUDIO_GRAPH_LEGEND,
} from '@features/studios/constants/studio-graph.constants';
import type { StudioGraphExplorerFilters } from '@features/studios/models/studio-graph.model';
import { StudiosService } from '@features/studios/services/studios.service';
import { mergeStudioGraphPages } from '@features/studios/utils/subgraph-path.utils';

@Component({
  selector: 'app-studios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, CytoscapeGraphComponent, StatePanelComponent],
  templateUrl: './studios-page.component.html',
  styleUrl: './studios-page.component.scss',
})
export class StudiosPageComponent implements OnInit {
  private readonly studiosService = inject(StudiosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly graphComp = viewChild(CytoscapeGraphComponent);

  protected readonly legend = STUDIO_GRAPH_LEGEND;
  protected readonly metadata = signal<StudioGraphMetadataDto | null>(null);
  protected readonly filters = signal<StudioGraphExplorerFilters>({
    ...DEFAULT_STUDIO_GRAPH_FILTERS,
  });

  protected readonly role = signal<CompanyRole>('STUDIO');
  protected readonly search = signal<string>('');
  protected readonly companies = signal<CompanySummaryDto[]>([]);
  protected readonly listState = signal<AsyncViewState>('loading');
  protected readonly errorMessage = signal<string>('');

  protected readonly activeAnchorId = signal<string | null>(null);
  protected readonly graphPage = signal<StudioGraphPageDto | null>(null);
  protected readonly loadedNodes = signal<StudioGraphNodeDto[]>([]);
  protected readonly loadedEdges = signal<StudioGraphEdgeDto[]>([]);
  protected readonly graphLoading = signal<boolean>(false);
  protected readonly selectedNode = signal<StudioGraphNodeDto | null>(null);
  protected readonly viewMode = signal<'graph' | 'table'>('graph');
  protected readonly copiedFeedback = signal<boolean>(false);

  protected readonly filteredNodes = computed<StudioGraphNodeDto[]>(() => {
    const q = this.filters().nodeSearch.trim().toLowerCase();
    const all = this.loadedNodes();
    if (!q) return all;
    return all.filter((n) => n.label.toLowerCase().includes(q));
  });

  protected readonly cytoscapeNodes = computed<GraphNodeDto[]>(() =>
    this.filteredNodes().map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      type: n.animeType,
      seasonYear: n.seasonYear,
      roleLabel: n.roleLabel,
      isCenter: n.isCenter,
    })),
  );

  protected readonly cytoscapeEdges = computed<GraphEdgeDto[]>(() => {
    const allowedIds = new Set(this.filteredNodes().map((n) => n.id));
    return this.loadedEdges()
      .filter((e) => allowedIds.has(e.source) && allowedIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.creditRole ?? e.relationKind,
        relationType: e.relationKind,
      }));
  });

  ngOnInit(): void {
    this.studiosService
      .getStudioGraphMetadata()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((meta) => this.metadata.set(meta));

    this.loadCompanies();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const companyId = params.get('companyId');
      const anchorId = params.get('anchorId') ?? (companyId ? `company:${companyId}` : null);
      if (anchorId) {
        this.activeAnchorId.set(anchorId);
        this.loadStudioGraph(anchorId, 0, false);
      }
    });
  }

  protected setRole(role: CompanyRole): void {
    this.role.set(role);
    this.filters.update((f) => ({ ...f, role }));
    this.loadCompanies();
    const anchor = this.activeAnchorId();
    if (anchor) this.loadStudioGraph(anchor, 0, false);
  }

  protected setMode(mode: StudioGraphMode): void {
    this.filters.update((f) => ({ ...f, mode }));
    const anchor = this.activeAnchorId();
    if (anchor) this.loadStudioGraph(anchor, 0, false);
  }

  protected updateYearFilter(field: 'yearFrom' | 'yearTo', value: string): void {
    this.filters.update((f) => ({ ...f, [field]: value }));
    const anchor = this.activeAnchorId();
    if (anchor) this.loadStudioGraph(anchor, 0, false);
  }

  protected updateNodeSearch(value: string): void {
    this.filters.update((f) => ({ ...f, nodeSearch: value }));
  }

  protected resetFilters(): void {
    this.filters.set({ ...DEFAULT_STUDIO_GRAPH_FILTERS, role: this.role() });
    const anchor = this.activeAnchorId();
    if (anchor) this.loadStudioGraph(anchor, 0, false);
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.loadCompanies();
  }

  protected loadCompanies(): void {
    this.listState.set('loading');
    this.errorMessage.set('');
    this.studiosService
      .listCompanies(this.role(), this.search())
      .pipe(
        catchError((err: NormalizedHttpError) => {
          this.errorMessage.set(err?.detail ?? 'Unable to load companies.');
          this.listState.set('error');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.companies.set(res.items);
        this.listState.set(res.items.length === 0 ? 'empty' : 'ready');
      });
  }

  protected selectCompany(companyId: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { companyId, anchorId: `company:${companyId}` },
      queryParamsHandling: 'merge',
    });
  }

  protected onNodeSelect(node: GraphNodeDto): void {
    const full = this.loadedNodes().find((n) => n.id === node.id) ?? null;
    this.selectedNode.set(full);
  }

  protected expandSelectedNode(): void {
    const selected = this.selectedNode();
    if (!selected || selected.kind === 'PERSON') return;
    this.graphLoading.set(true);
    this.studiosService
      .getNodeNeighbors(selected.id, { role: this.filters().role, limit: 20, offset: 0 })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.graphLoading.set(false);
        if (!page) return;
        const merged = mergeStudioGraphPages(
          this.loadedNodes(),
          this.loadedEdges(),
          page.nodes,
          page.edges,
        );
        this.loadedNodes.set(merged.nodes);
        this.loadedEdges.set(merged.edges);
      });
  }

  protected loadMore(): void {
    const page = this.graphPage();
    const anchor = this.activeAnchorId();
    if (!page?.pageInfo.hasMore || page.pageInfo.nextOffset === null || !anchor) return;
    this.loadStudioGraph(anchor, page.pageInfo.nextOffset, true);
  }

  protected focusRoot(): void {
    const anchor = this.activeAnchorId();
    if (anchor) {
      this.graphComp()?.focusNode(anchor);
    } else {
      this.graphComp()?.resetView();
    }
  }

  protected copyShareableLink(): void {
    try {
      void globalThis.navigator?.clipboard?.writeText(globalThis.location?.href ?? '');
      this.copiedFeedback.set(true);
      setTimeout(() => this.copiedFeedback.set(false), 2000);
    } catch {
      // Ignore clipboard restrictions
    }
  }

  private loadStudioGraph(anchorId: string, offset: number, append: boolean): void {
    const f = this.filters();
    this.graphLoading.set(true);
    this.studiosService
      .queryStudioGraph({
        anchorId,
        mode: f.mode,
        role: f.role,
        yearFrom: f.yearFrom,
        yearTo: f.yearTo,
        limit: f.limit,
        offset,
      })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.graphLoading.set(false);
        if (!page) return;
        this.graphPage.set(page);
        if (append) {
          const merged = mergeStudioGraphPages(
            this.loadedNodes(),
            this.loadedEdges(),
            page.nodes,
            page.edges,
          );
          this.loadedNodes.set(merged.nodes);
          this.loadedEdges.set(merged.edges);
        } else {
          this.loadedNodes.set(page.nodes);
          this.loadedEdges.set(page.edges);
          this.selectedNode.set(page.nodes.find((n) => n.isCenter) ?? null);
        }
      });
  }
}
