import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, forkJoin, of } from 'rxjs';
import type { AniListMetricsDto, DataSourceDto, IngestionRunDto } from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';
import type { AsyncViewState } from '@core/models/ui-state.model';
import { AppIconComponent } from '@shared/components/app-icon/app-icon.component';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';
import { SourcesService } from '@features/sources/services/sources.service';

@Component({
  selector: 'app-sources-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, AppIconComponent, StatePanelComponent],
  templateUrl: './sources-page.component.html',
  styleUrl: './sources-page.component.scss',
})
export class SourcesPageComponent implements OnInit {
  private readonly sourcesService = inject(SourcesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sources = signal<DataSourceDto[]>([]);
  protected readonly runs = signal<IngestionRunDto[]>([]);
  protected readonly anilistMetrics = signal<AniListMetricsDto | null>(null);
  protected readonly viewState = signal<AsyncViewState>('loading');
  protected readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.viewState.set('loading');
    this.errorMessage.set('');

    forkJoin({
      sources: this.sourcesService.listSources(),
      runs: this.sourcesService
        .listRuns('anime-offline-database')
        .pipe(catchError(() => of({ sourceId: 'anime-offline-database', items: [] }))),
      anilistMetrics: this.sourcesService.getAniListMetrics().pipe(catchError(() => of(null))),
    })
      .pipe(
        catchError((err: NormalizedHttpError) => {
          this.errorMessage.set(err?.detail ?? 'Unable to load data sources.');
          this.viewState.set('error');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.sources.set(res.sources.items);
        this.runs.set(res.runs.items);
        this.anilistMetrics.set(res.anilistMetrics);
        this.viewState.set('ready');
      });
  }
}
