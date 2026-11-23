-- Migration 0001: Post-MVP LoreGraph & AdaptationLab foundation tables (empty in MVP, CLI curation only)

CREATE TABLE IF NOT EXISTS manga_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  localized_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED')),
  evidence_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manga_chapter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_work_id UUID NOT NULL REFERENCES manga_work(id) ON DELETE CASCADE,
  chapter_number TEXT NOT NULL,
  title TEXT,
  spoiler_level TEXT NOT NULL DEFAULT 'NONE' CHECK (spoiler_level IN ('NONE', 'MILD', 'MAJOR')),
  UNIQUE (manga_work_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS anime_episode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL CHECK (episode_number >= 1),
  title TEXT,
  spoiler_level TEXT NOT NULL DEFAULT 'NONE' CHECK (spoiler_level IN ('NONE', 'MILD', 'MAJOR')),
  UNIQUE (anime_id, episode_number)
);

CREATE TABLE IF NOT EXISTS story_arc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  manga_work_id UUID REFERENCES manga_work(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  localized_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  spoiler_level TEXT NOT NULL DEFAULT 'MILD' CHECK (spoiler_level IN ('NONE', 'MILD', 'MAJOR')),
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED'))
);

CREATE TABLE IF NOT EXISTS character (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  localized_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED')),
  evidence_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS story_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_arc_id UUID REFERENCES story_arc(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  spoiler_level TEXT NOT NULL DEFAULT 'MAJOR' CHECK (spoiler_level IN ('NONE', 'MILD', 'MAJOR')),
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED')),
  evidence_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS event_relation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_event_id UUID NOT NULL REFERENCES story_event(id) ON DELETE CASCADE,
  to_event_id UUID NOT NULL REFERENCES story_event(id) ON DELETE CASCADE,
  relation_kind TEXT NOT NULL,
  unidirectional BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (from_event_id <> to_event_id)
);

CREATE TABLE IF NOT EXISTS adaptation_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_episode_id UUID NOT NULL REFERENCES anime_episode(id) ON DELETE CASCADE,
  manga_chapter_id UUID REFERENCES manga_chapter(id) ON DELETE SET NULL,
  mapping_kind TEXT NOT NULL CHECK (mapping_kind IN ('DIRECT', 'PARTIAL', 'OMITTED', 'ANIME_ORIGINAL')),
  notes TEXT,
  spoiler_level TEXT NOT NULL DEFAULT 'MILD' CHECK (spoiler_level IN ('NONE', 'MILD', 'MAJOR')),
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  publication_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED')),
  reviewer TEXT,
  evidence_source_id UUID REFERENCES data_source(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS curation_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
