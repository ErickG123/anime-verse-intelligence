import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const dataSource = pgTable(
  'data_source',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    kind: text('kind').notNull(), // 'DATASET_JSONL' | 'GRAPHQL_API' | 'REST_API' | 'SPARQL_API'
    endpoint: text('endpoint').notNull(),
    license: text('license').notNull(),
    attribution: text('attribution').notNull(),
    policyVersion: text('policy_version').notNull().default('1.0'),
    status: text('status').notNull().default('INACTIVE'), // 'ACTIVE' | 'INACTIVE'
    fetchAllowed: boolean('fetch_allowed').notNull().default(false),
    storageAllowed: boolean('storage_allowed').notNull().default(false),
    redistributeAllowed: boolean('redistribute_allowed').notNull().default(false),
    cacheTtlSeconds: integer('cache_ttl_seconds'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uq_data_source_slug').on(table.slug)],
);

export const sourceSnapshot = pgTable(
  'source_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dataSourceId: uuid('data_source_id')
      .notNull()
      .references(() => dataSource.id, { onDelete: 'restrict' }),
    versionLabel: text('version_label'),
    sha256: text('sha256').notNull(),
    etag: text('etag'),
    sourceLastUpdate: text('source_last_update'),
    recordCount: integer('record_count').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    status: text('status').notNull().default('PENDING'), // 'PENDING' | 'VALIDATED' | 'FAILED'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_source_snapshot_source_sha').on(table.dataSourceId, table.sha256),
    index('idx_source_snapshot_created_at').on(table.createdAt),
  ],
);

export const ingestionRun = pgTable(
  'ingestion_run',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dataSourceId: uuid('data_source_id')
      .notNull()
      .references(() => dataSource.id, { onDelete: 'restrict' }),
    snapshotId: uuid('snapshot_id').references(() => sourceSnapshot.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('RUNNING'), // 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    totalLines: integer('total_lines').notNull().default(0),
    validRecords: integer('valid_records').notNull().default(0),
    createdCount: integer('created_count').notNull().default(0),
    updatedCount: integer('updated_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    conflictCount: integer('conflict_count').notNull().default(0),
    relationsCount: integer('relations_count').notNull().default(0),
    summaryMessage: text('summary_message'),
  },
  (table) => [
    index('idx_ingestion_run_source_started').on(table.dataSourceId, table.startedAt),
    index('idx_ingestion_run_status').on(table.status),
  ],
);

export const anime = pgTable(
  'anime',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    normalizedTitle: text('normalized_title').notNull(),
    type: text('type').notNull().default('UNKNOWN'), // TV, MOVIE, OVA, ONA, SPECIAL, UNKNOWN
    episodes: integer('episodes'),
    status: text('status').notNull().default('UNKNOWN'), // FINISHED, ONGOING, UPCOMING, UNKNOWN
    season: text('season').notNull().default('UNDEFINED'), // SPRING, SUMMER, FALL, WINTER, UNDEFINED
    seasonYear: integer('season_year'),
    durationSeconds: integer('duration_seconds'),
    scoreArithmeticMean: real('score_arithmetic_mean'),
    scoreMedian: real('score_median'),
    pictureUrl: text('picture_url'),
    thumbnailUrl: text('thumbnail_url'),
    primarySourceId: uuid('primary_source_id').references(() => dataSource.id, {
      onDelete: 'set null',
    }),
    lastSnapshotId: uuid('last_snapshot_id').references(() => sourceSnapshot.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_anime_type').on(table.type),
    index('idx_anime_status').on(table.status),
    index('idx_anime_season_year').on(table.season, table.seasonYear),
    index('idx_anime_score').on(table.scoreArithmeticMean),
    index('idx_anime_normalized_title').on(table.normalizedTitle),
  ],
);

export const animeAlias = pgTable(
  'anime_alias',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    normalizedAlias: text('normalized_alias').notNull(),
  },
  (table) => [
    uniqueIndex('uq_anime_alias_anime_norm').on(table.animeId, table.normalizedAlias),
    index('idx_anime_alias_norm').on(table.normalizedAlias),
  ],
);

export const externalReference = pgTable(
  'external_reference',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    externalId: text('external_id'),
    normalizedUrl: text('normalized_url').notNull(),
    rawUrl: text('raw_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_external_ref_normalized_url').on(table.normalizedUrl),
    index('idx_external_ref_provider_id').on(table.provider, table.externalId),
    index('idx_external_ref_anime_id').on(table.animeId),
  ],
);

export const company = pgTable(
  'company',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uq_company_normalized_name').on(table.normalizedName)],
);

export const animeCompany = pgTable(
  'anime_company',
  {
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'STUDIO' | 'PRODUCER'
  },
  (table) => [
    primaryKey({ columns: [table.animeId, table.companyId, table.role] }),
    index('idx_anime_company_company_role').on(table.companyId, table.role),
  ],
);

export const tag = pgTable(
  'tag',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
  },
  (table) => [uniqueIndex('uq_tag_normalized_name').on(table.normalizedName)],
);

export const animeTag = pgTable(
  'anime_tag',
  {
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.animeId, table.tagId] }),
    index('idx_anime_tag_tag_id').on(table.tagId),
  ],
);

export const animeRelationship = pgTable(
  'anime_relationship',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceAnimeId: uuid('source_anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    targetAnimeId: uuid('target_anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull().default('UNSPECIFIED'),
    evidenceSourceId: uuid('evidence_source_id').references(() => dataSource.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_anime_relationship_pair').on(
      table.sourceAnimeId,
      table.targetAnimeId,
      table.relationType,
    ),
    index('idx_anime_relationship_target').on(table.targetAnimeId),
  ],
);

export const ingestionError = pgTable(
  'ingestion_error',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
      .notNull()
      .references(() => ingestionRun.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    errorCode: text('error_code').notNull(),
    message: text('message').notNull(),
    payloadExcerpt: text('payload_excerpt'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_ingestion_error_run_id').on(table.runId)],
);

export const sourceEvidence = pgTable(
  'source_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(), // 'ANIME' | 'RELATIONSHIP' | 'COMPANY'
    entityId: uuid('entity_id').notNull(),
    dataSourceId: uuid('data_source_id')
      .notNull()
      .references(() => dataSource.id, { onDelete: 'restrict' }),
    snapshotId: uuid('snapshot_id').references(() => sourceSnapshot.id, { onDelete: 'set null' }),
    fieldName: text('field_name'),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_source_evidence_entity').on(table.entityType, table.entityId)],
);

export const ingestionConflict = pgTable(
  'ingestion_conflict',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
      .notNull()
      .references(() => ingestionRun.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    conflictType: text('conflict_type').notNull(), // 'MULTI_ANIME_MATCH' | 'ATTRIBUTE_DIVERGENCE'
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    resolved: boolean('resolved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_ingestion_conflict_run_id').on(table.runId)],
);
