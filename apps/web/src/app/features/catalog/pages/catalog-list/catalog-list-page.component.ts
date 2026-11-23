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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import type {
  AnimeSeason,
  AnimeSortField,
  AnimeStatus,
  AnimeSummaryDto,
  AnimeType,
  PaginationMeta,
  SortOrder,
} from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';
import type { AsyncViewState } from '@core/models/ui-state.model';
import { AppIconComponent } from '@shared/components/app-icon/app-icon.component';
import { PaginationBarComponent } from '@shared/components/pagination-bar/pagination-bar.component';
import { StatePanelComponent } from '@shared/components/state-panel/state-panel.component';
import {
  ANIME_SEASONS,
  ANIME_STATUSES,
  ANIME_TYPES,
  DEFAULT_CATALOG_FILTERS,
} from '@features/catalog/constants/catalog-filter.constants';
import type { CatalogFilterState } from '@features/catalog/models/catalog.model';
import { CatalogService } from '@features/catalog/services/catalog.service';

@Component({
  selector: 'app-catalog-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    AppIconComponent,
    StatePanelComponent,
    PaginationBarComponent,
  ],
  templateUrl: './catalog-list-page.component.html',
  styleUrl: './catalog-list-page.component.scss',
})
export class CatalogListPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput$ = new Subject<string>();

  protected readonly filters = signal<CatalogFilterState>({ ...DEFAULT_CATALOG_FILTERS });
  protected readonly items = signal<AnimeSummaryDto[]>([]);
  protected readonly pagination = signal<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  protected readonly viewState = signal<AsyncViewState>('loading');
  protected readonly errorMessage = signal<string>('');

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return Boolean(f.q || f.type || f.status || f.season || f.year || f.tag || f.studio);
  });

  protected readonly animeTypes = ANIME_TYPES;
  protected readonly animeStatuses = ANIME_STATUSES;
  protected readonly animeSeasons = ANIME_SEASONS;

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.updateFilters({ q, page: 1 }));

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const next: CatalogFilterState = {
            q: params.get('q') ?? '',
            type: (params.get('type') as AnimeType | null) ?? '',
            status: (params.get('status') as AnimeStatus | null) ?? '',
            season: (params.get('season') as AnimeSeason | null) ?? '',
            year: params.get('year') ?? '',
            tag: params.get('tag') ?? '',
            studio: params.get('studio') ?? '',
            sortBy: (params.get('sortBy') as AnimeSortField | null) ?? 'title',
            sortOrder: (params.get('sortOrder') as SortOrder | null) ?? 'asc',
            page: Math.max(1, Number(params.get('page') ?? 1) || 1),
            pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 20) || 20)),
          };
          this.filters.set(next);
          this.viewState.set('loading');
          this.errorMessage.set('');

          return this.catalogService.searchAnime(next).pipe(
            catchError((err: NormalizedHttpError) => {
              this.errorMessage.set(err?.detail ?? 'Unable to load catalog.');
              this.viewState.set('error');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.items.set(res.items);
        this.pagination.set(res.pagination);
        this.viewState.set(res.items.length === 0 ? 'empty' : 'ready');
      });
  }

  protected onSearchInput(value: string): void {
    this.filters.update((f) => ({ ...f, q: value }));
    this.searchInput$.next(value);
  }

  protected updateFilters(patch: Partial<CatalogFilterState>): void {
    const merged: CatalogFilterState = { ...this.filters(), ...patch };
    const queryParams: Record<string, string | null> = {
      q: merged.q.trim() || null,
      type: merged.type || null,
      status: merged.status || null,
      season: merged.season || null,
      year: merged.year.trim() || null,
      tag: merged.tag.trim() || null,
      studio: merged.studio.trim() || null,
      sortBy: merged.sortBy !== 'title' ? merged.sortBy : null,
      sortOrder: merged.sortOrder !== 'asc' ? merged.sortOrder : null,
      page: merged.page > 1 ? String(merged.page) : null,
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  protected clearFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected retry(): void {
    this.updateFilters({ page: this.filters().page });
  }
}
