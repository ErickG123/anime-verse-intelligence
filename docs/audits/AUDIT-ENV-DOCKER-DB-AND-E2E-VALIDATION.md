# Auditoria — Ambiente, Docker, PostgreSQL 17, Reconstrução Segura e Validação E2E

**Data:** 2026-11-23  
**Modalidade escolhida:** **Modalidade A — `REBUILD-ISOLATED`** (banco novo, projeto Compose dedicado `animeverse-validation`, volume dedicado `animeverse_validation_pgdata`, porta loopback `127.0.0.1:55432`).  
**Escopo:** Validação integral de reprodutibilidade do zero, migrações Drizzle, importação completa do `anime-offline-database`, API Fastify 5, Angular 22, segurança, performance (`EXPLAIN ANALYZE`), backup/restore e persistência pós-restart.

---

## 1. Gate Operacional 0 (Inspeção Inicial Segura)

| Item                                     | Resultado Observado                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `git status --short`                     | Árvore limpa (`0` modificações não commitadas)                                   |
| Node.js                                  | `v24.18.0` (compatível com `engines.node >= 24.15.0`)                            |
| pnpm                                     | `11.17.0` (exatamente `packageManager: pnpm@11.17.0`)                            |
| Docker Engine / Client                   | `29.8.1 / 29.8.1`                                                                |
| Docker Compose                           | `v5.5.1`                                                                         |
| Containers existentes                    | Nenhum container `animeverse-postgres` ativo; outros projetos estão `Exited`     |
| Volumes Docker existentes                | Nenhum volume `animeverse_pgdata` existente; volumes de outros projetos intactos |
| Portas (`5432`, `55432`, `3000`, `4200`) | Todas livres no host Windows                                                     |
| Arquivo `.env` na raiz                   | Ausente (nenhum segredo local alterado)                                          |

**Decisão de segurança operacional:**

- Nenhum comando destrutivo (`docker compose down -v`, `docker volume rm/prune`, `DROP DATABASE`, `TRUNCATE`) será executado sobre recursos existentes.
- Todo o fluxo de reconstrução ocorrerá em `compose.validation.yaml` com projeto `-p animeverse-validation`, porta `127.0.0.1:55432`, banco `animeverse_validation`, usuário `animeverse_val` e volume `animeverse_validation_pgdata`.

---

## 2. Auditoria de Configuração, Toolchain e Fases

### 2.1 Toolchain e Pacotes

- **Monorepo:** `packages/contracts`, `apps/api` (Fastify `5.3.0`, Drizzle ORM `0.41.0`, `pg` `8.14.1`, Vitest `4.0.8`), `apps/web` (Angular `22.0.2` Zoneless + Signals + OnPush, Cytoscape `3.31.2`, Transloco `8.0.0`), TypeScript `~6.0.x`.
- **Playwright:** Não está instalado no `package.json` do workspace (conforme `REPORT-PHASE-28-MVP-READINESS.md` e `TEST-MATRIX.md`). A validação browser E2E será marcada conforme disponibilidade real.

### 2.2 Divergências entre Escopo do Prompt e Estado Real do Repositório

- O prompt menciona "relatórios 21–32", porém o roadmap atual do repositório concluiu o ciclo **00–28** (`0.1.0-rc.1 CONDITIONAL-GO`). Não existem Fases 29–32 implementadas ainda.
- Não existe `CONTRATO-TRANSVERSAL.md` na raiz; os contratos canônicos residem em `AGENTS.md`, `.agents/rules/**`, `docs/specifications/` e `packages/contracts/`.
- Não existe `docs/operations/DATASET-IMPORT-RUNBOOK.md` nem `docs/operations/DOCKER-POSTGRES-REBUILD-RUNBOOK.md` ainda — ambos serão criados como entregáveis desta validação.

### 2.3 Migrações SQL Identificadas (`apps/api/drizzle/`)

1. `0000_initial.sql`
2. `0001_lore_adaptation_foundation.sql`
3. `0002_editorial_governance.sql`

Arquivos históricos de migração não serão editados.

---

## 3. Riscos Identificados

| ID           | Severidade | Descrição                                                                                   | Mitigação                                                                                    |
| ------------ | ---------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `RISK-VAL-1` | **ALTO**   | `compose.yaml` usa `container_name: animeverse-postgres` e volume fixo `animeverse_pgdata`. | Criar `compose.validation.yaml` isolado com projeto `animeverse-validation`.                 |
| `RISK-VAL-2` | **MÉDIO**  | Playwright não instalado no monorepo impede suíte browser automatizada nativa.              | Validar Angular via build/test + servidor real + curl/checks ou reportar bloqueio explícito. |
| `RISK-VAL-3` | **BAIXO**  | Dependência de rede para baixar release oficial do `anime-offline-database` no GitHub.      | Usar CLI oficial `dataset:download` com validação SHA-256 e metadata JSONL.                  |
| `RISK-VAL-4` | **BAIXO**  | Logs nunca devem imprimir `DATABASE_URL` ou senha.                                          | Passar credencial forte via variável de ambiente da sessão e mascarar em logs.               |

---

## 4. Plano de Execução

1. Subir PostgreSQL 17 isolado (`compose.validation.yaml`, porta `127.0.0.1:55432`) e validar `healthy` + `psql`.
2. Aplicar migrações Drizzle do zero (`db:migrate`), confirmar `db:status` (`pending: []`), inspecionar tabelas/índices/extensões (`pg_trgm`, `unaccent`) e reexecutar `db:migrate` para provar idempotência.
3. Baixar release oficial integral do `cedya77/anime-offline-database` (JSONL) via `dataset:download`, registrar SHA-256/versão/tamanho e importar via `dataset:import`.
4. Reexecutar `dataset:import` para provar idempotência (`createdCount = 0`, zero duplicações) e validar integridade referencial/Unicode.
5. Subir API Fastify 5 contra o banco isolado, validar `/api/v1/health`, `/api/v1/ready`, `/docs/json`, catálogo, buscas Unicode, StudioGraph, LoreGraph anti-spoiler, AdaptationLab e `/api/v1/admin/*` fail-closed `401`.
6. Executar `EXPLAIN (ANALYZE, BUFFERS)` nas consultas críticas com o dataset real.
7. Executar `pg_dump -Fc` + `pg_restore` em banco descartável separado no mesmo container isolado + teste de persistência pós-restart do container.
8. Executar `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` e validar Angular build/serve.
9. Consolidar runbooks e relatório final `docs/reports/REPORT-ENV-FULL-REBUILD-AND-VALIDATION.md`.
