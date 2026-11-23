import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ProblemDetails } from '@animeverse/contracts';

export class AppHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly title: string;

  constructor(statusCode: number, code: string, title: string, detail: string) {
    super(detail);
    this.statusCode = statusCode;
    this.code = code;
    this.title = title;
  }
}

export function buildProblemDetails(params: {
  status: number;
  code: string;
  title: string;
  detail: string;
  instance?: string;
  requestId?: string;
}): ProblemDetails {
  return {
    type: `https://animeverse.local/problems/${params.code.toLowerCase().replace(/_/g, '-')}`,
    title: params.title,
    status: params.status,
    detail: params.detail,
    instance: params.instance,
    code: params.code,
    requestId: params.requestId,
  };
}

export function registerProblemDetails(app: FastifyInstance): void {
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const problem = buildProblemDetails({
      status: 404,
      code: 'NOT_FOUND',
      title: 'Not Found',
      detail: `Route ${request.method} ${request.url} not found.`,
      instance: request.url,
      requestId: request.id,
    });
    return reply.code(404).type('application/problem+json').send(problem);
  });

  app.setErrorHandler(
    (error: FastifyError | AppHttpError, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppHttpError) {
        const problem = buildProblemDetails({
          status: error.statusCode,
          code: error.code,
          title: error.title,
          detail: error.message,
          instance: request.url,
          requestId: request.id,
        });
        return reply.code(error.statusCode).type('application/problem+json').send(problem);
      }

      if ('validation' in error && error.validation) {
        const problem = buildProblemDetails({
          status: 400,
          code: 'VALIDATION_ERROR',
          title: 'Bad Request',
          detail: error.message || 'Request validation failed.',
          instance: request.url,
          requestId: request.id,
        });
        return reply.code(400).type('application/problem+json').send(problem);
      }

      const statusCode =
        'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400
          ? error.statusCode
          : 500;

      if (statusCode >= 500) {
        request.log.error({ err: error, requestId: request.id }, 'Unhandled server error');
      }

      const problem = buildProblemDetails({
        status: statusCode,
        code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : 'INTERNAL_SERVER_ERROR',
        title: statusCode === 429 ? 'Too Many Requests' : 'Internal Server Error',
        detail:
          statusCode >= 500
            ? 'An unexpected error occurred. Reference requestId for diagnostics.'
            : error.message,
        instance: request.url,
        requestId: request.id,
      });

      return reply.code(statusCode).type('application/problem+json').send(problem);
    },
  );
}
