# Relatório — Fase 08: Pipeline completo do anime-offline-database

**Data:** 2026-11-23  
**Status:** PARCIAL (parser streaming, CLIs `dataset:download` e `dataset:import`, dry-run, validação e 16/16 testes unitários APROVADOS; persistência ao vivo no PostgreSQL aguarda inicialização do Docker Desktop)

---

## 1. Escopo planejado e execução real

- Criado parser streaming JSONL (`apps/api/src/modules/ingestion/jsonl-parser.ts`) que trata a linha 1 como metadata do snapshot, calcula SHA-256 via stream, valida registros opcionais/obrigatórios, normaliza URLs e isola linhas inválidas.
- Criado importador idempotente em duas passagens (`apps/api/src/modules/ingestion/importer.ts`): passagem 1 em transações curtas (matching por `external_reference` normalizada, conflito `MULTI_ANIME_MATCH` registrado em `ingestion_conflict`, upsert de `anime`, `anime_alias`, `company`, `anime_company`, `tag`, `anime_tag`, `source_evidence`); passagem 2 resolvendo `relatedAnime` como `UNSPECIFIED` sem self-reference e contabilizando links órfãos.
- Criadas CLIs locais `dataset:download` (timeout, maxBytes, allowlist SSRF, redirects manuais seguros, `--file`, `--dry-run`) e `dataset:import` (`--file`, `--dry-run`).
- Adicionada fixture de teste versionada `apps/api/test/fixtures/anime-offline-sample.jsonl` (explicitamente restrita a testes, nunca seed de produção).

## 2. Validações executadas

| Comando                                                                                                     | Resultado real                                                                  | Classificação |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------- |
| `pnpm --filter @animeverse/api typecheck`                                                                   | 0 erros                                                                         | **APROVADO**  |
| `pnpm lint`                                                                                                 | 0 erros                                                                         | **APROVADO**  |
| `pnpm --filter @animeverse/api test`                                                                        | 5/5 arquivos, 16/16 testes passando (teste ao vivo PG condicional ao Docker)    | **PARCIAL**   |
| `pnpm --filter @animeverse/api dataset:download -- --dry-run`                                               | Validou URL oficial `cedya77/anime-offline-database` sob allowlist SSRF         | **APROVADO**  |
| `pnpm --filter @animeverse/api dataset:import -- --file test/fixtures/anime-offline-sample.jsonl --dry-run` | `totalLines: 4, validRecords: 2, errorCount: 2, status: PARTIAL, durationMs: 9` | **APROVADO**  |

## 3. Próxima fase

- **Fase 09 — API de catálogo e busca** (`prompts/PROMPT-09-catalogo-api-busca.md`).

---

## Atualização — Validação ao vivo com Docker Desktop (2026-11-23)

- **Status atualizado:** **APROVADO**
- `pnpm --filter @animeverse/api dataset:import -- --file test/fixtures/anime-offline-sample.jsonl`:
  - **Execução 1:** `createdCount: 2, updatedCount: 0, relationsCount: 2, unresolvedRelationsCount: 1, errorCount: 2, durationMs: 162`.
  - **Execução 2 (idempotência):** `createdCount: 0, updatedCount: 2, relationsCount: 0, unresolvedRelationsCount: 1, errorCount: 2, durationMs: 157`.
- `apps/api/test/ingestion-db.spec.ts` passou integralmente contra PostgreSQL real (`1070 ms`).
