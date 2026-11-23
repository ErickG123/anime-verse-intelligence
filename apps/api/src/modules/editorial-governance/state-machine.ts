export type EditorialRole = 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

export type EditorialPublicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'RETRACTED'
  | 'ARCHIVED';

export type EditorialVerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'CONFLICT';
export type EditorialRightsStatus =
  'LICENSED' | 'ORIGINAL_CURATION' | 'RESTRICTED_EXTERNAL' | 'UNKNOWN';

export interface EditorialActor {
  id: string;
  role: EditorialRole;
}

export interface EditorialReviewItem {
  id: string;
  resourceType: string;
  resourceId: string;
  authorId: string;
  publicationStatus: EditorialPublicationStatus;
  verificationStatus: EditorialVerificationStatus;
  rightsStatus: EditorialRightsStatus;
  evidenceRef: string | null;
  version: number;
}

export interface EditorialAuditEvent {
  id: string;
  reviewItemId: string;
  actorId: string;
  actorRole: EditorialRole;
  action: string;
  fromStatus: EditorialPublicationStatus;
  toStatus: EditorialPublicationStatus;
  reason: string;
  requestId?: string;
  createdAt: string;
}

const VALID_TRANSITIONS: Record<EditorialPublicationStatus, readonly EditorialPublicationStatus[]> =
  {
    DRAFT: ['SUBMITTED', 'ARCHIVED'],
    SUBMITTED: ['IN_REVIEW', 'CHANGES_REQUESTED', 'REJECTED'],
    IN_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
    CHANGES_REQUESTED: ['SUBMITTED', 'ARCHIVED'],
    APPROVED: ['PUBLISHED', 'CHANGES_REQUESTED', 'REJECTED'],
    PUBLISHED: ['RETRACTED', 'ARCHIVED'],
    REJECTED: ['DRAFT', 'ARCHIVED'],
    RETRACTED: ['DRAFT', 'ARCHIVED'],
    ARCHIVED: [],
  };

const ROLE_ALLOWED_TARGETS: Record<EditorialRole, readonly EditorialPublicationStatus[]> = {
  VIEWER: [],
  EDITOR: ['SUBMITTED', 'DRAFT', 'ARCHIVED'],
  REVIEWER: ['IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RETRACTED'],
  ADMIN: [
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'PUBLISHED',
    'REJECTED',
    'RETRACTED',
    'ARCHIVED',
  ],
};

export type TransitionCheckResult =
  { ok: true } | { ok: false; statusCode: 403 | 409 | 422; code: string; message: string };

export function validateEditorialTransition(params: {
  item: EditorialReviewItem;
  actor: EditorialActor;
  targetStatus: EditorialPublicationStatus;
  expectedVersion: number;
  reason: string;
}): TransitionCheckResult {
  const { item, actor, targetStatus, expectedVersion, reason } = params;

  if (!reason.trim()) {
    return {
      ok: false,
      statusCode: 422,
      code: 'REASON_REQUIRED',
      message: 'Decision reason is required.',
    };
  }

  if (expectedVersion !== item.version) {
    return {
      ok: false,
      statusCode: 409,
      code: 'VERSION_CONFLICT',
      message: `Optimistic lock conflict: expected version ${expectedVersion}, current version is ${item.version}.`,
    };
  }

  if (!ROLE_ALLOWED_TARGETS[actor.role].includes(targetStatus)) {
    return {
      ok: false,
      statusCode: 403,
      code: 'FORBIDDEN_ROLE_TRANSITION',
      message: `Role "${actor.role}" is not permitted to transition items to "${targetStatus}".`,
    };
  }

  if (!VALID_TRANSITIONS[item.publicationStatus].includes(targetStatus)) {
    return {
      ok: false,
      statusCode: 422,
      code: 'INVALID_STATE_TRANSITION',
      message: `Transition from "${item.publicationStatus}" to "${targetStatus}" is not allowed.`,
    };
  }

  // Separation of duties: author cannot approve or publish their own proposal
  if ((targetStatus === 'APPROVED' || targetStatus === 'PUBLISHED') && item.authorId === actor.id) {
    return {
      ok: false,
      statusCode: 403,
      code: 'SELF_APPROVAL_FORBIDDEN',
      message:
        'Separation of duties violation: authors cannot approve or publish their own proposal.',
    };
  }

  // Rights & provenance gate before publication
  if (targetStatus === 'PUBLISHED') {
    if (item.rightsStatus !== 'LICENSED' && item.rightsStatus !== 'ORIGINAL_CURATION') {
      return {
        ok: false,
        statusCode: 422,
        code: 'RIGHTS_NOT_CLEARED',
        message: `Cannot publish item with rightsStatus="${item.rightsStatus}". Only LICENSED or ORIGINAL_CURATION may be published.`,
      };
    }
    if (!item.evidenceRef || !item.evidenceRef.trim()) {
      return {
        ok: false,
        statusCode: 422,
        code: 'EVIDENCE_REQUIRED',
        message: 'Cannot publish item without a verified evidenceRef.',
      };
    }
    if (item.verificationStatus === 'CONFLICT') {
      return {
        ok: false,
        statusCode: 422,
        code: 'UNRESOLVED_CONFLICT',
        message: 'Cannot publish item while verificationStatus is CONFLICT.',
      };
    }
  }

  return { ok: true };
}
