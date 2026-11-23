import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import type {
  EditorialActor,
  EditorialAuditEvent,
  EditorialPublicationStatus,
  EditorialReviewItem,
} from '../src/modules/editorial-governance/state-machine.js';
import type { EditorialGovernanceStore } from '../src/modules/editorial-governance/routes.js';

function createInMemoryGovernanceStore(initial: EditorialReviewItem[]): EditorialGovernanceStore {
  const items = new Map(initial.map((i) => [i.id, { ...i }]));
  const audit: EditorialAuditEvent[] = [];
  return {
    async listQueue() {
      return [...items.values()];
    },
    async getById(id) {
      const found = items.get(id);
      return found ? { ...found } : null;
    },
    async applyTransition(id, toStatus: EditorialPublicationStatus, event: EditorialAuditEvent) {
      const existing = items.get(id)!;
      const updated = { ...existing, publicationStatus: toStatus, version: existing.version + 1 };
      items.set(id, updated);
      audit.push(event);
      return updated;
    },
    async listAuditEvents() {
      return [...audit];
    },
  };
}

describe('Phase 27: Editorial Governance — RBAC, Rights Gate, Optimistic Lock & Audit Trail', () => {
  it('fails closed (401) when unauthenticated and enforces RBAC (403), self-approval, rights gate (422), and optimistic lock (409)', async () => {
    const store = createInMemoryGovernanceStore([
      {
        id: 'rev-1',
        resourceType: 'STORY_EVENT',
        resourceId: 'ev-1',
        authorId: 'editor-1',
        publicationStatus: 'DRAFT',
        verificationStatus: 'VERIFIED',
        rightsStatus: 'ORIGINAL_CURATION',
        evidenceRef: 'curated://source-1',
        version: 1,
      },
      {
        id: 'rev-restricted',
        resourceType: 'STORY_EVENT',
        resourceId: 'ev-2',
        authorId: 'editor-1',
        publicationStatus: 'APPROVED',
        verificationStatus: 'VERIFIED',
        rightsStatus: 'RESTRICTED_EXTERNAL',
        evidenceRef: 'https://anilist.co/anime/1',
        version: 1,
      },
    ]);

    const actorsByHeader: Record<string, EditorialActor> = {
      'tok-viewer': { id: 'viewer-1', role: 'VIEWER' },
      'tok-editor': { id: 'editor-1', role: 'EDITOR' },
      'tok-reviewer': { id: 'reviewer-1', role: 'REVIEWER' },
      'tok-admin-self': { id: 'editor-1', role: 'ADMIN' },
    };

    const app = await buildApp({
      env: loadEnv({ NODE_ENV: 'test' }),
      checkDatabase: async () => true,
      editorialStore: store,
      editorialAuthenticator: async (req) => {
        const tok = String(req.headers['x-test-actor'] ?? '');
        return actorsByHeader[tok] ?? null;
      },
    });

    // 1. Unauthenticated -> 401
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/admin/review-queue' })).statusCode,
    ).toBe(401);

    // 2. VIEWER cannot read audit events or decide -> 403
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/api/v1/admin/audit-events',
          headers: { 'x-test-actor': 'tok-viewer' },
        })
      ).statusCode,
    ).toBe(403);

    // 3. EDITOR submits DRAFT -> SUBMITTED (v1 -> v2)
    const submit = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-editor' },
      payload: {
        targetStatus: 'SUBMITTED',
        expectedVersion: 1,
        reason: 'Ready for editorial review',
      },
    });
    expect(submit.statusCode).toBe(200);
    expect(submit.json().item.version).toBe(2);

    // 4. Stale version -> 409 Conflict
    const stale = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-reviewer' },
      payload: { targetStatus: 'IN_REVIEW', expectedVersion: 1, reason: 'Stale click' },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().code).toBe('VERSION_CONFLICT');

    // 5. REVIEWER moves SUBMITTED -> IN_REVIEW -> APPROVED -> PUBLISHED
    await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-reviewer' },
      payload: { targetStatus: 'IN_REVIEW', expectedVersion: 2, reason: 'Starting review' },
    });

    // Self-approval blocked even for ADMIN if authorId === actor.id
    const selfApprove = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-admin-self' },
      payload: { targetStatus: 'APPROVED', expectedVersion: 3, reason: 'Trying self-approve' },
    });
    expect(selfApprove.statusCode).toBe(403);
    expect(selfApprove.json().code).toBe('SELF_APPROVAL_FORBIDDEN');

    const approved = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-reviewer' },
      payload: { targetStatus: 'APPROVED', expectedVersion: 3, reason: 'Verified evidence' },
    });
    expect(approved.statusCode).toBe(200);

    const published = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-1/decisions',
      headers: { 'x-test-actor': 'tok-reviewer' },
      payload: { targetStatus: 'PUBLISHED', expectedVersion: 4, reason: 'Cleared for public' },
    });
    expect(published.statusCode).toBe(200);

    // 6. RESTRICTED_EXTERNAL rights cannot be published -> 422
    const blockedRights = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/reviews/rev-restricted/decisions',
      headers: { 'x-test-actor': 'tok-reviewer' },
      payload: {
        targetStatus: 'PUBLISHED',
        expectedVersion: 1,
        reason: 'Attempt restricted publish',
      },
    });
    expect(blockedRights.statusCode).toBe(422);
    expect(blockedRights.json().code).toBe('RIGHTS_NOT_CLEARED');

    // 7. Audit trail is append-only and recorded all 4 valid transitions
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit-events',
      headers: { 'x-test-actor': 'tok-reviewer' },
    });
    expect(auditRes.statusCode).toBe(200);
    expect(auditRes.json().items).toHaveLength(4);

    await app.close();
  });
});
