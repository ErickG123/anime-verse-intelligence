import type { NavLinkItem } from '@layout/models/navigation.model';

export const PRIMARY_NAV_ITEMS: readonly NavLinkItem[] = [
  { route: '/catalog', labelKey: 'nav.catalog', icon: 'catalog' },
  { route: '/relations', labelKey: 'nav.relations', icon: 'relations' },
  { route: '/studios', labelKey: 'nav.studios', icon: 'studios' },
  { route: '/sources', labelKey: 'nav.sources', icon: 'sources' },
  { route: '/lore', labelKey: 'nav.lore', icon: 'lore' },
  { route: '/adaptation', labelKey: 'nav.adaptation', icon: 'adaptation' },
  { route: '/about', labelKey: 'nav.about', icon: 'about' },
];
