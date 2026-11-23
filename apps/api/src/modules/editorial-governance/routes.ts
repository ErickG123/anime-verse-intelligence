import crypto from 'node:crypto';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AppHttpError } from '../../plugins/problem-details.js';
import {
  validateEditorialTransition,
  type EditorialActor,
  type EditorialAuditEvent,
  type EditorialPublicationStatus,
  type EditorialReviewItem,
} from './state-machine.js';

export type EditorialAuthenticator = (request: FastifyRequest) => Promise<EditorialActor | null>;

export interface EditorialGovernanceStore {
  listQueue(): Promise<EditorialReviewItem[]>;
  getById(id: string): Promise<EditorialReviewItem | null>;
  applyTransition(
    id: string,
    toStatus: EditorialPublicationStatus,
    event: EditorialAuditEvent,
  ): Promise<EditorialReviewItem>;
  listAuditEvents(reviewItemId?: string): Promise<EditorialAuditEvent[]>;
}

/**
 * Default fail-closed authenticator: never accepts unauthenticated requests or default passwords.
 */
export const failClosedAuthenticator: EditorialAuthenticator = async () => null;

export async function registerEditorialGovernanceRoutes(
  app: FastifyInstance,
  options: {
    authenticate?: EditorialAuthenticator;
    store?: EditorialGovernanceStore;
  } = {},
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();
  const authenticate = options.authenticate ?? failClosedAuthenticator;

  const requireAuth = async (request: FastifyRequest): Promise<EditorialActor> => {
    const actor = await authenticate(request);
    if (!actor) {
      throw new AppHttpError(
        401,
        'UNAUTHORIZED',
        'Unauthorized',
        'Valid editorial authentication is required.',
      );
    }
    return actor;
  };

  typedApp.get(
    '/api/v1/admin/review-queue',
    {
      onRequest: async (request) => {
        await requireAuth(request);
      },
      schema: {
        tags: ['Sources'],
        summary: 'List editorial review queue (RBAC protected, fail-closed)',
      },
    },
    async () => {
      const items = options.store ? await options.store.listQueue() : [];
      return { items };
    },
  );

  typedApp.post(
    '/api/v1/admin/reviews/:id/decisions',
    {
      onRequest: async (request) => {
        await requireAuth(request);
      },
      schema: {
        tags: ['Sources'],
        summary:
          'Apply RBAC-protected editorial state transition with optimistic lock & audit trail',
        params: Type.Object({ id: Type.String({ minLength: 1, maxLength: 80 }) }),
        body: Type.Object({
          targetStatus: Type.Union([
            Type.Literal('DRAFT'),
            Type.Literal('SUBMITTED'),
            Type.Literal('IN_REVIEW'),
            Type.Literal('CHANGES_REQUESTED'),
            Type.Literal('APPROVED'),
            Type.Literal('PUBLISHED'),
            Type.Literal('REJECTED'),
            Type.Literal('RETRACTED'),
            Type.Literal('ARCHIVED'),
          ]),
          expectedVersion: Type.Integer({ minimum: 1 }),
          reason: Type.String({ minLength: 3, maxLength: 500 }),
        }),
      },
    },
    async (request) => {
      const actor = await requireAuth(request);
      if (!options.store) {
        throw new AppHttpError(
          503,
          'GOVERNANCE_STORE_UNAVAILABLE',
          'Service Unavailable',
          'Editorial store not configured.',
        );
      }

      const item = await options.store.getById(request.params.id);
      if (!item) {
        throw new AppHttpError(404, 'REVIEW_ITEM_NOT_FOUND', 'Not Found', 'Review item not found.');
      }

      const check = validateEditorialTransition({
        item,
        actor,
        targetStatus: request.body.targetStatus,
        expectedVersion: request.body.expectedVersion,
        reason: request.body.reason,
      });

      if (!check.ok) {
        throw new AppHttpError(
          check.statusCode,
          check.code,
          'Editorial Policy Violation',
          check.message,
        );
      }

      const auditEvent: EditorialAuditEvent = {
        id: crypto.randomUUID(),
        reviewItemId: item.id,
        actorId: actor.id,
        actorRole: actor.role,
        action: `TRANSITION_${item.publicationStatus}_TO_${request.body.targetStatus}`,
        fromStatus: item.publicationStatus,
        toStatus: request.body.targetStatus,
        reason: request.body.reason.trim(),
        requestId: request.id,
        createdAt: new Date().toISOString(),
      };

      const updated = await options.store.applyTransition(
        item.id,
        request.body.targetStatus,
        auditEvent,
      );
      return { item: updated, auditEvent };
    },
  );

  typedApp.get(
    '/api/v1/admin/audit-events',
    {
      onRequest: async (request) => {
        await requireAuth(request);
      },
      schema: {
        tags: ['Sources'],
        summary: 'List append-only editorial audit events (REVIEWER/ADMIN only)',
      },
    },
    async (request) => {
      const actor = await requireAuth(request);
      if (actor.role !== 'ADMIN' && actor.role !== 'REVIEWER') {
        throw new AppHttpError(
          403,
          'FORBIDDEN',
          'Forbidden',
          'Only ADMIN or REVIEWER roles may inspect editorial audit events.',
        );
      }
      const items = options.store ? await options.store.listAuditEvents() : [];
      return { items };
    },
  );
}
