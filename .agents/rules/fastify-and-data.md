# Regra — Fastify 5, Dados e Licenças (`fastify-and-data.md`)

- Fastify 5 com schemas TypeBox completos, OpenAPI, Pino com redaction de segredos, Problem Details RFC 7807, CORS restrito, Helmet e rate-limit.
- Drizzle ORM + PostgreSQL com migrações SQL versionadas em `apps/api/drizzle/`; proibido `drizzle-kit push` em produção.
- UUID interno imutável como chave primária; deduplicação exclusivamente por `external_reference` normalizada; conflitos em `ingestion_conflict`.
- `cedya77/anime-offline-database` (ODbL 1.0 / DbCL 1.0, atribuição `cedya77` + `manami-project`) é a fonte inicial; primeira linha JSONL = metadata; `relatedAnime` sempre `UNSPECIFIED` sem evidência verificada; URL de imagem não é licença (usar fallback neutro).
- APIs externas adicionais (AniList, Wikidata, MangaUpdates, TMDB) permanecem desativadas por padrão no MVP; proibido espelhamento massivo do AniList.
