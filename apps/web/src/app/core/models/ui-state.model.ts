export type AsyncViewState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface BreadcrumbItem {
  labelKey: string;
  route?: string;
}
