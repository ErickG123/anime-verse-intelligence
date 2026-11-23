import { Type } from '@sinclair/typebox';

export const UuidParamSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const CatalogQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ maxLength: 120 })),
  type: Type.Optional(
    Type.Union([
      Type.Literal('TV'),
      Type.Literal('MOVIE'),
      Type.Literal('OVA'),
      Type.Literal('ONA'),
      Type.Literal('SPECIAL'),
      Type.Literal('UNKNOWN'),
    ]),
  ),
  status: Type.Optional(
    Type.Union([
      Type.Literal('FINISHED'),
      Type.Literal('ONGOING'),
      Type.Literal('UPCOMING'),
      Type.Literal('UNKNOWN'),
    ]),
  ),
  season: Type.Optional(
    Type.Union([
      Type.Literal('SPRING'),
      Type.Literal('SUMMER'),
      Type.Literal('FALL'),
      Type.Literal('WINTER'),
      Type.Literal('UNDEFINED'),
    ]),
  ),
  year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
  tag: Type.Optional(Type.String({ maxLength: 80 })),
  studio: Type.Optional(Type.String({ maxLength: 120 })),
  producer: Type.Optional(Type.String({ maxLength: 120 })),
  sortBy: Type.Optional(
    Type.Union([
      Type.Literal('title'),
      Type.Literal('year'),
      Type.Literal('episodes'),
      Type.Literal('score'),
      Type.Literal('updatedAt'),
    ]),
  ),
  sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
});

export const StudiosQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ maxLength: 120 })),
  role: Type.Optional(Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')])),
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
});

export const PaginationMetaSchema = Type.Object({
  page: Type.Integer(),
  pageSize: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer(),
});

export const AnimeSummarySchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
  episodes: Type.Union([Type.Integer(), Type.Null()]),
  status: Type.String(),
  season: Type.String(),
  seasonYear: Type.Union([Type.Integer(), Type.Null()]),
  scoreArithmeticMean: Type.Union([Type.Number(), Type.Null()]),
  thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  studios: Type.Array(Type.String()),
  tags: Type.Array(Type.String()),
  updatedAt: Type.String(),
});

export const PaginatedAnimeSchema = Type.Object({
  items: Type.Array(AnimeSummarySchema),
  pagination: PaginationMetaSchema,
});

export const AnimeDetailSchema = Type.Intersect([
  AnimeSummarySchema,
  Type.Object({
    durationSeconds: Type.Union([Type.Integer(), Type.Null()]),
    scoreMedian: Type.Union([Type.Number(), Type.Null()]),
    pictureUrl: Type.Union([Type.String(), Type.Null()]),
    aliases: Type.Array(Type.String()),
    companies: Type.Array(
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        role: Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')]),
      }),
    ),
    externalReferences: Type.Array(
      Type.Object({
        provider: Type.String(),
        externalId: Type.Union([Type.String(), Type.Null()]),
        normalizedUrl: Type.String(),
      }),
    ),
    relatedCount: Type.Integer(),
    provenance: Type.Object({
      sourceSlug: Type.Union([Type.String(), Type.Null()]),
      sourceName: Type.Union([Type.String(), Type.Null()]),
      license: Type.Union([Type.String(), Type.Null()]),
      snapshotVersion: Type.Union([Type.String(), Type.Null()]),
      lastImportedAt: Type.Union([Type.String(), Type.Null()]),
    }),
  }),
]);

export const RelatedAnimeResponseSchema = Type.Object({
  animeId: Type.String(),
  notice: Type.String(),
  items: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      type: Type.String(),
      seasonYear: Type.Union([Type.Integer(), Type.Null()]),
      relationType: Type.Literal('UNSPECIFIED'),
    }),
  ),
});

export const PaginatedCompaniesSchema = Type.Object({
  items: Type.Array(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
      role: Type.Union([Type.Literal('STUDIO'), Type.Literal('PRODUCER')]),
      animeCount: Type.Integer(),
    }),
  ),
  pagination: PaginationMetaSchema,
});

export const StatisticsOverviewSchema = Type.Object({
  totalAnime: Type.Integer(),
  totalStudios: Type.Integer(),
  totalProducers: Type.Integer(),
  totalRelationships: Type.Integer(),
  lastSnapshotVersion: Type.Union([Type.String(), Type.Null()]),
  lastImportedAt: Type.Union([Type.String(), Type.Null()]),
});
