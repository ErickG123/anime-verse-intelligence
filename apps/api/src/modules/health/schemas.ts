import { Type } from '@sinclair/typebox';

export const HealthResponseSchema = Type.Object({
  status: Type.Literal('ok'),
  service: Type.String(),
  timestamp: Type.String({ format: 'date-time' }),
  uptimeSeconds: Type.Integer({ minimum: 0 }),
});

export const ReadinessResponseSchema = Type.Object({
  status: Type.Union([Type.Literal('ready'), Type.Literal('not_ready')]),
  checks: Type.Object({
    database: Type.Union([Type.Literal('up'), Type.Literal('down')]),
  }),
  timestamp: Type.String({ format: 'date-time' }),
});

export const ProblemDetailsSchema = Type.Object({
  type: Type.String(),
  title: Type.String(),
  status: Type.Integer(),
  detail: Type.String(),
  instance: Type.Optional(Type.String()),
  code: Type.String(),
  requestId: Type.Optional(Type.String()),
});
