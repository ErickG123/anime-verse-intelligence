import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  {
    path: 'catalog',
    loadChildren: () => import('@features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'relations',
    loadComponent: () =>
      import('@features/relations/pages/relations/relations-page.component').then(
        (m) => m.RelationsPageComponent,
      ),
  },
  {
    path: 'studios',
    loadComponent: () =>
      import('@features/studios/pages/studios/studios-page.component').then(
        (m) => m.StudiosPageComponent,
      ),
  },
  {
    path: 'sources',
    loadComponent: () =>
      import('@features/sources/pages/sources/sources-page.component').then(
        (m) => m.SourcesPageComponent,
      ),
  },
  {
    path: 'lore',
    loadComponent: () =>
      import('@features/lore-graph/pages/lore-explorer/lore-explorer-page.component').then(
        (m) => m.LoreExplorerPageComponent,
      ),
  },
  {
    path: 'adaptation',
    loadComponent: () =>
      import('@features/adaptation-lab/pages/adaptation-explorer/adaptation-explorer-page.component').then(
        (m) => m.AdaptationExplorerPageComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('@features/about/pages/about/about-page.component').then((m) => m.AboutPageComponent),
  },
  { path: '**', redirectTo: 'catalog' },
];
