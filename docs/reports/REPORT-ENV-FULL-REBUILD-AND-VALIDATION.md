# Relatório — Validação Geral do Ambiente, Reconstrução Segura em Docker PostgreSQL 17 e Repopulação Completa

**Data:** 2026-11-23  
**Modalidade executada:** **Modalidade A — `REBUILD-ISOLATED`**  
**Auditoria de origem:** [AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md](../audits/AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md)  
**Decisão de prontidão:** **CONDITIONAL-GO** (MVP Read-Only + Reconstrução do Zero 100% comprovada; **E2E Browser Playwright** permanece **BLOQUEADO** por não estar instalado no workspace, e **Escrita Editorial** permanece **NO-GO / fail-closed `401`** até acoplamento de OIDC).

---

## 1. Contexto do Ambiente e Preservação de Dados

- **OS:** Windows 11 (PowerShell 5.1)
- **Toolchain:** Node `v24.18.0`, pnpm `11.17.0`, Docker Engine/Client `29.8.1`, Docker Compose `v5.5.1`, PostgreSQL `17.11` (`postgres:17-alpine`), Angular CLI `22.0.2`, Fastify `5.3.0`, Drizzle ORM `0.41.0`, TypeScript `~6.0.x`, Vitest `4.1.12`.
- **Ambiente original preservado:** Nenhum container ou volume pré-existente foi alterado ou removido. Todo o teste ocorreu em projeto Compose isolado:
  - **Compose file:** `compose.validation.yaml`
  - **Projeto Compose:** `animeverse-validation`
  - **Container:** `animeverse-validation-postgres` (`healthy`)
  - **Porta publicada:** `127.0.0.1:55432->5432/tcp` (somente loopback)
  - **Volume dedicado:** `animeverse_validation_pgdata`
  - **Banco / Usuário:** `animeverse_validation` / `animeverse_val` (credencial forte efêmera de sessão, nunca commitada)
- **Comando seguro para parar sem remover o volume:**
  ```powershell
  docker compose -p animeverse-validation -f compose.validation.yaml stop postgres
  ```

---

## 2. Migrações Drizzle e Esquema do Zero

| Verificação                         | Resultado                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `db:migrate` (1ª execução)          | `0000_initial.sql`, `0001_lore_adaptation_foundation.sql`, `0002_editorial_governance.sql` |
| `db:status`                         | `applied: 3`, `pending: []`                                                                |
| `db:migrate` (2ª execução — idemp.) | `No pending migrations.`                                                                   |
| Extensões PostgreSQL                | `pg_trgm 1.6`, `unaccent 1.1`, `plpgsql 1.0`                                               |
| Objetos criados                     | `26` tabelas, `57` índices, `33` FKs, `2` unique constraints (+ PKs/unique indexes)        |

---

## 3. Dataset Oficial, Importação Completa e Prova de Idempotência

- **Fonte:** `https://github.com/cedya77/anime-offline-database`
- **Release / `lastUpdate`:** `2026-47` (`2026-11-22`)
- **Licença:** Open Data Commons Open Database License (ODbL) v1.0 + Database Contents License (DbCL) v1.0
- **Tamanho / Linhas:** `61.367.063` bytes (`38.520` linhas: `1` metadata + `38.519` obras)
- **SHA-256:** `0a0ae3888f125cc32640480624e1d13611491cb0a0a76bb7925a7e3f310c1d85`

| Métrica                    | 1ª Importação (Banco Vazio) | 2ª Importação (Idempotência) |
| -------------------------- | --------------------------- | ---------------------------- |
| `status`                   | `COMPLETED`                 | `COMPLETED`                  |
| `totalRecords` / `valid`   | `38.519` / `38.519`         | `38.519` / `38.519`          |
| `createdCount`             | `38.519`                    | `0`                          |
| `updatedCount`             | `0`                         | `0`                          |
| `unchangedCount`           | `0`                         | `38.519`                     |
| `relationsCreated`         | `138.093`                   | `0`                          |
| `relationsUnchanged`       | `0`                         | `138.093`                    |
| `relationsPending`         | `0`                         | `0`                          |
| `rejectedCount` / `errors` | `0` / `0`                   | `0` / `0`                    |
| Duração / Throughput       | `132,6 s` (`291 rec/s`)     | `54,2 s` (`711 rec/s`)       |
| Pico de memória (RSS)      | `320 MB`                    | `354 MB`                     |

### Integridade Referencial e Cobertura por Módulo

- `anime`: `38.519` | `anime_alias`: `230.761` | `external_reference`: `192.520` | `company`: `7.037` | `anime_company`: `97.181` (`26.248` obras com empresa = `68,1%`) | `tag`: `3.137` | `anime_relationship`: `138.093` | `ingestion_run`: `2`.
- `self_refs = 0`, `empty_titles = 0`, `dup_ext_refs = 0`.
- **Separação de camadas (zero dados inventados):** `story_event = 0`, `adaptation_mapping = 0`, `editorial_review_item = 0`, `editorial_audit_event = 0`. Personagens/staff do StudioGraph permanecem sob demanda via AniList (cache transitório em memória, zero persistência não autorizada).

---

## 4. Validação da API Fastify 5 e `EXPLAIN (ANALYZE, BUFFERS)`

### Smoke Test HTTP Real (`node apps/api/dist/server.js` contra `127.0.0.1:55432`)

| Endpoint                                                           | HTTP  | Tempo / Resultado                               |
| ------------------------------------------------------------------ | ----- | ----------------------------------------------- |
| `GET /api/v1/health`                                               | `200` | `ok`                                            |
| `GET /api/v1/ready`                                                | `200` | `ready`                                         |
| `GET /docs/json`                                                   | `200` | `34` rotas documentadas                         |
| `GET /api/v1/anime?page=1&pageSize=24`                             | `200` | `24` itens em `33 ms`                           |
| `GET /api/v1/anime?q=bebop&page=1&pageSize=24`                     | `200` | `68 ms`                                         |
| `GET /api/v1/anime?q=カウボーイ&page=1&pageSize=24`                | `200` | `70 ms` (Unicode CJK)                           |
| `GET /api/v1/anime/:id`                                            | `200` | `"Be-Bop Highschool"`                           |
| `GET /api/v1/anime/:id/network?depth=1&limit=20`                   | `200` | `2` nós, `1` aresta (`UNSPECIFIED`)             |
| `GET /api/v1/data-sources`                                         | `200` | `5` fontes listadas                             |
| `POST /api/v1/admin/reviews/:id/decisions` (sem sessão + inválido) | `401` | Fail-closed no hook `onRequest` antes do schema |
| `POST /api/v1/anime`                                               | `404` | Zero escrita pública no MVP                     |

### Planos SQL (`EXPLAIN (ANALYZE, BUFFERS)`)

- **Busca textual (`normalized_title LIKE '%bebop%'`):** `Bitmap Index Scan on idx_anime_title_trgm` — **`0.247 ms`**.
- **Busca Unicode CJK (`anime` + `anime_alias`):** `Bitmap Index Scan on idx_anime_alias_trgm` — **`8.174 ms`**.

---

## 5. Backup, Restore e Persistência Pós-Restart

| Etapa                                                         | Resultado                                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pg_dump -Fc` (`animeverse_validation`)                       | **PASS** — `37.798.422` bytes, SHA-256 `05CE6715D60044A5D2C611EEE43CA6D98BABFB00A0C4C12993788923C818BCE5` |
| `pg_restore` em banco descartável `animeverse_restore_verify` | **PASS** — `animes = 38.519`, `relations = 138.093`, `migrations = 3`                                     |
| `docker restart animeverse-validation-postgres`               | **PASS** — retornou `healthy`; `animes = 38.519`, `relations = 138.093`, `runs = 2`                       |

---

## 6. Qualidade, Angular e E2E Browser

| Comando / Suíte  | Resultado     | Detalhe                                                                              |
| ---------------- | ------------- | ------------------------------------------------------------------------------------ |
| `pnpm lint`      | **PASS**      | `0` erros (ESLint + regras AST `eslint-plugin-animeverse.mjs`)                       |
| `pnpm build`     | **PASS**      | `contracts` + `api` + `web` (`Initial total: 293.87 kB` raw / `79.66 kB` transfer)   |
| `pnpm typecheck` | **PASS**      | `0` erros nos 3 pacotes (nota: exige `contracts` compilado antes de `web typecheck`) |
| `pnpm test`      | **PASS**      | **`21/21` arquivos, `47/47` testes** (`contracts: 1`, `api: 41`, `web: 5`)           |
| Playwright E2E   | **BLOQUEADO** | Playwright não está instalado no workspace (`package.json` sem `@playwright/test`).  |

---

## 7. Arquivos Criados / Atualizados

- [compose.validation.yaml](../../compose.validation.yaml)
- [docs/audits/AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md](../audits/AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md)
- [docs/operations/DOCKER-POSTGRES-REBUILD-RUNBOOK.md](../operations/DOCKER-POSTGRES-REBUILD-RUNBOOK.md)
- [docs/operations/DATASET-IMPORT-RUNBOOK.md](../operations/DATASET-IMPORT-RUNBOOK.md)
- [docs/reports/REPORT-ENV-FULL-REBUILD-AND-VALIDATION.md](REPORT-ENV-FULL-REBUILD-AND-VALIDATION.md)
- [docs/testing/TEST-MATRIX.md](../testing/TEST-MATRIX.md), [docs/ROADMAP.md](../ROADMAP.md), [docs/operations/RELEASE-CHECKLIST.md](../operations/RELEASE-CHECKLIST.md)

---

## 8. Critérios de Aceite

- [x] Ambiente original preservado, sem perda/remoção de volumes.
- [x] PostgreSQL 17 sobe com healthcheck (`healthy`) e conexão testada (`127.0.0.1:55432`).
- [x] Banco novo criado do zero via migrations Drizzle, `pending: []`.
- [x] Dataset integral real (`2026-47`) obtido com SHA-256 e importado (`38.519` animes, `138.093` relações).
- [x] Importação repetida sem duplicação (`createdCount=0`, `updatedCount=0`, `unchangedCount=38519`).
- [x] FKs, uniques, extensões (`pg_trgm`, `unaccent`), Unicode e relações verificados.
- [x] Dados do catálogo separados de fixtures e conteúdo editorial não licenciado.
- [x] API Fastify testada contra o novo banco; OpenAPI (`34` rotas), health/readiness e buscas verificadas.
- [x] StudioGraph, LoreGraph e AdaptationLab testados conforme dados realmente disponíveis.
- [x] Anti-spoiler no payload e admin fail-closed (`401`) confirmados.
- [ ] E2E browser Playwright (**BLOQUEADO**: Playwright não instalado no workspace; Angular validado via build/unit).
- [x] Lint, typecheck, build e testes reportados com evidência (`47/47`).
- [x] Backup/restore (`pg_dump`/`pg_restore`) e persistência pós-restart comprovados.
- [x] Documentação atualizada, riscos e decisão `CONDITIONAL-GO` fundamentados.
