import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import type {
  AniListCharactersResponseDto,
  AniListExternalStatusDto,
  AniListStaffResponseDto,
  AniListStudiosResponseDto,
  AnimeDetailDto,
  NetworkGraphResponseDto,
  RelatedAnimeItemDto,
} from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';
import type { AsyncViewState } from '@core/models/ui-state.model';
import { AppIconComponent } from '@shared/components/app-icon/app-icon.component';
import { CytoscapeGraphComponent } from '@shared/components/cytoscape-graph/cytoscape-graph.component';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';
import { CatalogService } from '@features/catalog/services/catalog.service';
import type { TmdbExternalResponse } from '@features/catalog/models/anime-media.model';

@Component({
  selector: 'app-anime-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    RouterLink,
    TranslocoPipe,
    AppIconComponent,
    CytoscapeGraphComponent,
    StatePanelComponent,
  ],
  templateUrl: './anime-detail-page.component.html',
  styleUrl: './anime-detail-page.component.scss',
})
export class AnimeDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly anime = signal<AnimeDetailDto | null>(null);
  protected readonly related = signal<RelatedAnimeItemDto[]>([]);
  protected readonly viewState = signal<AsyncViewState>('loading');
  protected readonly errorMessage = signal<string>('');
  protected readonly showAllAliases = signal<boolean>(false);
  protected readonly tmdbData = signal<TmdbExternalResponse | null>(null);
  protected readonly posterBroken = signal<boolean>(false);

  protected readonly authorizedPosterUrl = computed<string | null>(() => {
    if (this.posterBroken()) return null;
    const match = this.tmdbData()?.match;
    if (!match || match.usageStatus !== 'ALLOWED') return null;
    return match.posterUrl;
  });

  protected readonly externalStatus = signal<AniListExternalStatusDto | null>(null);
  protected readonly externalLoading = signal<boolean>(false);
  protected readonly characters = signal<AniListCharactersResponseDto | null>(null);
  protected readonly staff = signal<AniListStaffResponseDto | null>(null);
  protected readonly anilistStudios = signal<AniListStudiosResponseDto | null>(null);
  protected readonly staffGraph = signal<NetworkGraphResponseDto | null>(null);

  protected readonly visibleAliases = computed(() => {
    const list = this.anime()?.aliases ?? [];
    return this.showAllAliases() ? list : list.slice(0, 6);
  });

  protected readonly studioCompanies = computed(() =>
    (this.anime()?.companies ?? []).filter((c) => c.role === 'STUDIO'),
  );

  protected readonly producerCompanies = computed(() =>
    (this.anime()?.companies ?? []).filter((c) => c.role === 'PRODUCER'),
  );

  ngOnInit(): void {
    this.load();
  }

  protected toggleAliases(): void {
    this.showAllAliases.update((v) => !v);
  }

  protected onPosterError(): void {
    this.posterBroken.set(true);
  }

  protected load(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.viewState.set('loading');
          this.errorMessage.set('');
          this.showAllAliases.set(false);
          this.tmdbData.set(null);
          this.posterBroken.set(false);
          this.characters.set(null);
          this.staff.set(null);
          this.anilistStudios.set(null);
          this.staffGraph.set(null);

          return forkJoin({
            detail: this.catalogService.getAnimeDetail(id),
            related: this.catalogService.getRelatedAnime(id).pipe(catchError(() => of(null))),
            externalStatus: this.catalogService
              .getAniListStatus(id)
              .pipe(catchError(() => of(null))),
          }).pipe(
            catchError((err: NormalizedHttpError) => {
              this.errorMessage.set(err?.detail ?? 'Anime not found.');
              this.viewState.set('error');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.anime.set(res.detail);
        this.related.set(res.related?.items ?? []);
        this.externalStatus.set(res.externalStatus);
        this.viewState.set('ready');

        // Progressive TMDB media & overview enrichment (never blocks local catalog)
        this.catalogService
          .getTmdbMetadata(res.detail.id)
          .pipe(
            catchError(() => of(null)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe((tmdb) => this.tmdbData.set(tmdb));
      });
  }

  protected loadAniListData(): void {
    const id = this.anime()?.id;
    if (!id) return;
    this.externalLoading.set(true);

    forkJoin({
      characters: this.catalogService.getAniListCharacters(id).pipe(catchError(() => of(null))),
      staff: this.catalogService.getAniListStaff(id).pipe(catchError(() => of(null))),
      studios: this.catalogService.getAniListStudios(id).pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.characters.set(res.characters);
        this.staff.set(res.staff);
        this.anilistStudios.set(res.studios);
        this.externalLoading.set(false);
      });
  }

  protected loadStaffGraph(): void {
    const id = this.anime()?.id;
    if (!id) return;
    this.catalogService
      .getStudioGraphStaff(id, 15)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((graph) => this.staffGraph.set(graph));
  }
}
