import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import type { ProblemDetails } from '@animeverse/contracts';
import type { NormalizedHttpError } from '@core/models/http-error.model';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const body = error.error as Partial<ProblemDetails> | null;
        const normalized: NormalizedHttpError = {
          status: error.status || 0,
          code: body?.code ?? (error.status === 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR'),
          title: body?.title ?? (error.statusText || 'Request failed'),
          detail:
            body?.detail ??
            (error.status === 0
              ? 'Unable to reach the API server.'
              : 'An error occurred while communicating with the API.'),
          requestId: body?.requestId,
        };
        return throwError(() => normalized);
      }
      return throwError(() => error);
    }),
  );
