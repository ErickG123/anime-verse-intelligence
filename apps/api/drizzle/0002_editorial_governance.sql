-- Migration 0002: Editorial governance review queue & append-only audit trail (non-destructive)

CREATE TABLE IF NOT EXISTS editorial_review_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (publication_status IN ('DRAFT','SUBMITTED','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','REJECTED','RETRACTED','ARCHIVED')),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (verification_status IN ('UNVERIFIED','VERIFIED','CONFLICT')),
  rights_status TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK (rights_status IN ('LICENSED','ORIGINAL_CURATION','RESTRICTED_EXTERNAL','UNKNOWN')),
  source_slug TEXT,
  evidence_ref TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_editorial_review_status ON editorial_review_item (publication_status);

CREATE TABLE IF NOT EXISTS editorial_audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_item_id UUID REFERENCES editorial_review_item(id) ON DELETE RESTRICT,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  reason TEXT NOT NULL,
  request_id TEXT,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_editorial_audit_item ON editorial_audit_event (review_item_id, created_at);
