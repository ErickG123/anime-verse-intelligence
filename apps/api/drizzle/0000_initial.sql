-- Migration 0000: Initial normalized schema for AnimeVerse Intelligence
-- Extensions for accent-insensitive and trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS data_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'INACTIVE',
  fetch_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  storage_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  redistribute_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  cache_ttl_seconds INTEGER,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_source_slug ON data_source (slug);

CREATE TABLE IF NOT EXISTS source_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_source(id) ON DELETE RESTRICT,
  version_label TEXT,
  sha256 TEXT NOT NULL,
  etag TEXT,
  source_last_update TEXT,
  record_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_source_snapshot_source_sha ON source_snapshot (data_source_id, sha256);
CREATE INDEX IF NOT EXISTS idx_source_snapshot_created_at ON source_snapshot (created_at);

CREATE TABLE IF NOT EXISTS ingestion_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_source(id) ON DELETE RESTRICT,
  snapshot_id UUID REFERENCES source_snapshot(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_lines INTEGER NOT NULL DEFAULT 0,
  valid_records INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  relations_count INTEGER NOT NULL DEFAULT 0,
  summary_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_ingestion_run_source_started ON ingestion_run (data_source_id, started_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_run_status ON ingestion_run (status);

CREATE TABLE IF NOT EXISTS anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'UNKNOWN',
  episodes INTEGER,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  season TEXT NOT NULL DEFAULT 'UNDEFINED',
  season_year INTEGER,
  duration_seconds INTEGER,
  score_arithmetic_mean REAL,
  score_median REAL,
  picture_url TEXT,
  thumbnail_url TEXT,
  primary_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL,
  last_snapshot_id UUID REFERENCES source_snapshot(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_anime_type ON anime (type);
CREATE INDEX IF NOT EXISTS idx_anime_status ON anime (status);
CREATE INDEX IF NOT EXISTS idx_anime_season_year ON anime (season, season_year);
CREATE INDEX IF NOT EXISTS idx_anime_score ON anime (score_arithmetic_mean);
CREATE INDEX IF NOT EXISTS idx_anime_normalized_title ON anime (normalized_title);
CREATE INDEX IF NOT EXISTS idx_anime_title_trgm ON anime USING GIN (normalized_title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS anime_alias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_anime_alias_anime_norm ON anime_alias (anime_id, normalized_alias);
CREATE INDEX IF NOT EXISTS idx_anime_alias_norm ON anime_alias (normalized_alias);
CREATE INDEX IF NOT EXISTS idx_anime_alias_trgm ON anime_alias USING GIN (normalized_alias gin_trgm_ops);

CREATE TABLE IF NOT EXISTS external_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT,
  normalized_url TEXT NOT NULL,
  raw_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_external_ref_normalized_url ON external_reference (normalized_url);
CREATE INDEX IF NOT EXISTS idx_external_ref_provider_id ON external_reference (provider, external_id);
CREATE INDEX IF NOT EXISTS idx_external_ref_anime_id ON external_reference (anime_id);

CREATE TABLE IF NOT EXISTS company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_normalized_name ON company (normalized_name);
CREATE INDEX IF NOT EXISTS idx_company_name_trgm ON company USING GIN (normalized_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS anime_company (
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('STUDIO', 'PRODUCER')),
  PRIMARY KEY (anime_id, company_id, role)
);
CREATE INDEX IF NOT EXISTS idx_anime_company_company_role ON anime_company (company_id, role);

CREATE TABLE IF NOT EXISTS tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_normalized_name ON tag (normalized_name);

CREATE TABLE IF NOT EXISTS anime_tag (
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_anime_tag_tag_id ON anime_tag (tag_id);

CREATE TABLE IF NOT EXISTS anime_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  target_anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  evidence_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_anime_id <> target_anime_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_anime_relationship_pair ON anime_relationship (source_anime_id, target_anime_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_anime_relationship_target ON anime_relationship (target_anime_id);

CREATE TABLE IF NOT EXISTS ingestion_error (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ingestion_run(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingestion_error_run_id ON ingestion_error (run_id);

CREATE TABLE IF NOT EXISTS source_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  data_source_id UUID NOT NULL REFERENCES data_source(id) ON DELETE RESTRICT,
  snapshot_id UUID REFERENCES source_snapshot(id) ON DELETE SET NULL,
  field_name TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_source_evidence_entity ON source_evidence (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS ingestion_conflict (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ingestion_run(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  conflict_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingestion_conflict_run_id ON ingestion_conflict (run_id);
