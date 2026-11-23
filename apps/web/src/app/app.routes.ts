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
      import('@features/placeholder/pages/placeholder/module-placeholder-page.component').then(
        (m) => m.ModulePlaceholderPageComponent,
      ),
    data: { titleKey: 'future.loreTitle', messageKey: 'future.loreDescription' },
  },
  {
    path: 'adaptation',
    loadComponent: () =>
      import('@features/placeholder/pages/placeholder/module-placeholder-page.component').then(
        (m) => m.ModulePlaceholderPageComponent,
      ),
    data: { titleKey: 'future.adaptationTitle', messageKey: 'future.adaptationDescription' },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('@features/about/pages/about/about-page.component').then((m) => m.AboutPageComponent),
  },
  { path: '**', redirectTo: 'catalog' },
];
