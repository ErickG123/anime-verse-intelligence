# Relatório Final — Fase 21: Auditoria do Importador, Dataset Completo e Validação End-to-End

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Status geral:** **CONCLUÍDO** (carga completa de `38.519` animes e `138.093` relações validada com idempotência 100%, `EXPLAIN (ANALYZE, BUFFERS)` e 35/35 testes verdes)

---

## A. Estado inicial

Auditoria prévia registrada em [AUDIT-PHASE-21-DATASET-IMPORT.md](../audits/AUDIT-PHASE-21-DATASET-IMPORT.md):

- PostgreSQL 17 Docker ativo e migrações `0000` e `0001` aplicadas.
- Importador anterior fazia 1 transação por registro, relia o arquivo duas vezes, executava `UPDATE` incondicional mesmo em registros inalterados (`updatedCount: 2` na 2ª execução) e descartava query strings na normalização de URLs.

---

## B. Correções realizadas

1. **Explicação dos dois erros anteriores no fixture (`anime-offline-sample.jsonl`):**
   - Linha 4 (`{"title":"Missing Sources Anime","sources":[]}`) → `MISSING_VALID_SOURCES` (caso de teste intencional).
   - Linha 5 (`{malformed json line`) → `INVALID_JSON` (caso de teste intencional).
   - Separação clara em métricas entre `rejectedCount` (rejeições de validação/JSON) e `unexpectedErrors` (falhas inesperadas).
2. **Descoberta e correção crítica no dataset real (`url-normalizer.ts`):**
   - Na primeira tentativa sobre o dataset oficial `2026-47`, `12.766` registros foram falsamente marcados como duplicados porque `url-normalizer.ts` descartava `parsed.search`, colapsando todas as URLs `animenewsnetwork.com/encyclopedia/anime.php?id=<N>` em uma única URL sem query string.
   - **Correção:** suporte explícito a `animenewsnetwork` (`?id=...`) e `animecountdown`, além de preservação de `parsed.search` no fallback. Teste de regressão adicionado em `apps/api/test/source-governance.spec.ts`.
3. **Importador streaming em lotes (`apps/api/src/modules/ingestion/importer.ts`):**
   - Leitura streaming em única passagem (`streamJsonlBatches`, `BATCH_SIZE = 250`), upsert em lote de empresas/tags/aliases/referências, comparação real de diff (`computeQualitySafeAnimePatch`) preservando campos não nulos contra degradação por `null`/`UNKNOWN`/`UNDEFINED`, `source_evidence` sem duplicação em registros inalterados e passagem 2 em lote para `anime_relationship`.
   - CLI `dataset:import` ampliada com `--report-json` e `--report-md`, e nova CLI `dataset:sync --check-only` para sincronização manual verificável.

---

## C. Dataset oficial utilizado

- **Repositório:** `https://github.com/cedya77/anime-offline-database` (continuação `manami-project`)
- **Release:** `2026-47` (`2026-11-22T13:58:32Z`)
- **Arquivo:** `anime-offline-database.jsonl` (`61.367.063` bytes)
- **Licença:** ODbL 1.0 / DbCL 1.0
- **SHA-256:** `0a0ae3888f125cc32640480624e1d13611491cb0a0a76bb7925a7e3f310c1d85`
- **Registros na origem:** `38.519` animes

---

## D. Importação completa e E. Idempotência (Execução 1 vs. Execução 2)

| Métrica                                              |                          Execução 1 (carga completa pós-fix ANN) | Execução 2 (reimportação idempotente) |
| ---------------------------------------------------- | ---------------------------------------------------------------: | ------------------------------------: |
| `status`                                             |                                                      `COMPLETED` |                           `COMPLETED` |
| `totalRecords` / `validRecords`                      |                                              `38.519` / `38.519` |                   `38.519` / `38.519` |
| `createdCount`                                       |        `12.764` _(somados aos `25.755` já inseridos = `38.519`)_ |                               **`0`** |
| `updatedCount`                                       | `2` _(2 registros do fixture enriquecidos pela release oficial)_ |                               **`0`** |
| `unchangedCount`                                     |                                                         `25.753` |                          **`38.519`** |
| `rejectedCount` / `duplicateCount` / `conflictCount` |                                                  `0` / `0` / `0` |                       `0` / `0` / `0` |
| `relationsCreated`                                   |                                                        `113.287` |                               **`0`** |
| `relationsUnchanged`                                 |                                                         `24.806` |                         **`138.093`** |
| `relationsPending` / `unexpectedErrors`              |                                                        `0` / `0` |                             `0` / `0` |
| `durationMs` / `recordsPerSecond`                    |                                       `154.440 ms` (`249 rec/s`) |             `94.362 ms` (`408 rec/s`) |
| `peakMemoryMb` (RSS)                                 |                                                         `364 MB` |                              `356 MB` |

**Integridade referencial verificada no PostgreSQL:**

- `anime = 38.519`, `anime_alias = 230.761`, `external_reference = 192.521`, `company = 7.037`, `tag = 3.137`, `anime_relationship = 138.093` (`self_refs = 0`).
- `pnpm --filter @animeverse/api dataset:sync -- --check-only` → `"upToDate": true` (`2026-47`).

---

## F. Performance real no PostgreSQL (`EXPLAIN (ANALYZE, BUFFERS)` sobre 38.519 linhas)

Ambiente: Windows 11 x64 + Docker Desktop `29.9.2` + `postgres:17-alpine` local.

| Consulta crítica                                                       | Plano escolhido                                                      | Tempo de execução |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------: |
| Busca trigrama em `anime.normalized_title ILIKE '%bebop%'`             | `Bitmap Index Scan on idx_anime_title_trgm` (`shared hit=7 read=6`)  |    **`0,656 ms`** |
| Filtro composto `season = 'SPRING' AND season_year = 1998`             | `Bitmap Index Scan on idx_anime_season_year` (`top-N heapsort 28kB`) |    **`0,784 ms`** |
| Busca em sinônimos `anime_alias.normalized_alias ILIKE '%カウボーイ%'` | `Bitmap Index Scan on idx_anime_alias_trgm` (`shared hit=3 read=7`)  |    **`0,236 ms`** |

Zero Sequential Scans nas consultas críticas testadas; índices GIN trigrama (`pg_trgm 1.6`) e B-tree compostos efetivamente utilizados pelo planejador.

---

## G/H/I. Qualidade e Pendências

- **CONCLUÍDO:** `pnpm lint` (0 erros), `pnpm typecheck` (3/3), `pnpm build` (3/3), `pnpm test` (`15/15` arquivos, `35/35` testes incluindo PostgreSQL real com `38.519` animes), `dataset:sync --check-only`.
- **PENDENTE:** Execução de testes E2E em navegador real via Playwright (ainda não instalado/configurado no host).
