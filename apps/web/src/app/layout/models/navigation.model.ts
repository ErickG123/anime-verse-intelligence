import type { IconName } from '@shared/models/icon-name.types';

export interface NavLinkItem {
  route: string;
  labelKey: string;
  icon: IconName;
}
