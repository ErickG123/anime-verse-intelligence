import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of, switchMap } from 'rxjs';
import type { AnimeSummaryDto, GraphNodeDto, NetworkGraphResponseDto } from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';
import type { AsyncViewState } from '@core/models/ui-state.model';
import { CytoscapeGraphComponent } from '@shared/components/cytoscape-graph/cytoscape-graph.component';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';
import { RelationsService } from '@features/relations/services/relations.service';

@Component({
  selector: 'app-relations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, CytoscapeGraphComponent, StatePanelComponent],
  templateUrl: './relations-page.component.html',
  styleUrl: './relations-page.component.scss',
})
export class RelationsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly relationsService = inject(RelationsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly graphComp = viewChild(CytoscapeGraphComponent);

  protected readonly animeId = signal<string>('');
  protected readonly searchQuery = signal<string>('');
  protected readonly searchResults = signal<AnimeSummaryDto[]>([]);
  protected readonly depth = signal<number>(1);
  protected readonly viewMode = signal<'graph' | 'table'>('graph');
  protected readonly graph = signal<NetworkGraphResponseDto | null>(null);
  protected readonly viewState = signal<AsyncViewState>('empty');
  protected readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const id = params.get('animeId') ?? '';
          const depthParam = Number(params.get('depth') ?? 1);
          const safeDepth = depthParam === 2 ? 2 : 1;
          this.animeId.set(id);
          this.depth.set(safeDepth);

          if (!id) {
            this.graph.set(null);
            this.viewState.set('empty');
            return of(null);
          }

          this.viewState.set('loading');
          this.errorMessage.set('');
          return this.relationsService.getAnimeNetwork(id, safeDepth).pipe(
            catchError((err: NormalizedHttpError) => {
              this.errorMessage.set(err?.detail ?? 'Unable to load relations graph.');
              this.viewState.set('error');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (!data) return;
        this.graph.set(data);
        this.viewState.set('ready');
      });
  }

  protected runSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.relationsService
      .searchAnimeWorks(q)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (res) this.searchResults.set(res.items);
      });
  }

  protected selectAnime(id: string): void {
    this.searchResults.set([]);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { animeId: id, depth: this.depth() },
      queryParamsHandling: 'merge',
    });
  }

  protected setDepth(depth: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { depth },
      queryParamsHandling: 'merge',
    });
  }

  protected onNodeSelect(node: GraphNodeDto): void {
    void this.router.navigate(['/catalog', node.id]);
  }

  protected resetGraphView(): void {
    this.graphComp()?.resetView();
  }
}
