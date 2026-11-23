export interface NormalizedHttpError {
  status: number;
  code: string;
  title: string;
  detail: string;
  requestId?: string;
}
