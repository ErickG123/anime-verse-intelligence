import type { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/catalog/pages/catalog-list/catalog-list-page.component').then(
        (m) => m.CatalogListPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('@features/catalog/pages/anime-detail/anime-detail-page.component').then(
        (m) => m.AnimeDetailPageComponent,
      ),
  },
];
