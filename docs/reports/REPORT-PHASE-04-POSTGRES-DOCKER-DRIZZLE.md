# Relatório — Fase 04: Infraestrutura PostgreSQL e migrações

**Data:** 2026-11-23  
**Status:** PARCIAL (schema, `compose.yaml`, migração SQL e testes estáticos APROVADOS; execução contra PostgreSQL em Docker BLOQUEADA localmente porque o daemon do Docker Desktop está parado)

---

## 1. Escopo planejado e execução real

- Criado `compose.yaml` com `postgres:17-alpine`, volume nomeado `animeverse_pgdata`, healthcheck real (`pg_isready`), porta configurável e credenciais exclusivamente via `.env`.
- Configurado Drizzle ORM + pool `pg` (`apps/api/src/db/client.ts`), `drizzle.config.ts` e schema normalizado completo (`apps/api/src/db/schema.ts`) com as 14 tabelas: `data_source`, `source_snapshot`, `ingestion_run`, `anime`, `anime_alias`, `external_reference`, `company`, `anime_company` (`STUDIO`/`PRODUCER`), `tag`, `anime_tag`, `anime_relationship` (`UNSPECIFIED` por padrão), `ingestion_error`, `source_evidence`, `ingestion_conflict`.
- Criada migração SQL versionada `apps/api/drizzle/0000_initial.sql` (com extensões `pg_trgm` e `unaccent`, constraints únicas, `CHECK` e índices GIN trigrama) e runner transacional `apps/api/src/db/migrate.ts` (`db:migrate` / `db:status`), sem uso de `db push` destrutivo.
- Documentado backup, restauração e política de reset em `docs/operations/DATABASE-RUNBOOK.md`.

## 2. Validações executadas

| Comando                                     | Resultado real                                                                                | Classificação |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------- |
| `docker compose config --quiet`             | Exit code 0 (sintaxe `compose.yaml` válida)                                                   | **APROVADO**  |
| `docker info --format '{{.ServerVersion}}'` | Erro: pipe `//./pipe/dockerDesktopLinuxEngine` não encontrado (daemon parado)                 | **BLOQUEADO** |
| `pnpm install`                              | `Done in 8.2s`                                                                                | **APROVADO**  |
| `pnpm --filter @animeverse/api typecheck`   | 0 erros                                                                                       | **APROVADO**  |
| `pnpm --filter @animeverse/api build`       | 0 erros                                                                                       | **APROVADO**  |
| `pnpm lint`                                 | 0 erros                                                                                       | **APROVADO**  |
| `pnpm --filter @animeverse/api test`        | 2/2 arquivos, 4/4 testes (validação de schema/SQL passou; teste ao vivo no PG aguarda Docker) | **PARCIAL**   |

## 3. Teste reproduzível para desbloquear validação ao vivo

```powershell
# 1. Iniciar Docker Desktop (engine Linux)
docker info --format '{{.ServerVersion}}'
# 2. Copiar .env.example para .env e subir PostgreSQL
Copy-Item .env.example .env
docker compose up -d postgres
# 3. Rodar migrações e testes de integração contra PostgreSQL real
pnpm --filter @animeverse/api db:migrate
pnpm --filter @animeverse/api db:status
pnpm --filter @animeverse/api test
```

## 4. Próxima fase

- **Fase 05 — Fastify modular, Swagger e contratos** (`prompts/PROMPT-05-fundacao-api-fastify.md`).

---

## Atualização — Validação ao vivo com Docker Desktop (2026-11-23)

- **Status atualizado:** **APROVADO**
- Docker Engine `29.9.2` iniciado; container `animeverse-postgres` (`postgres:17-alpine`) subiu `healthy` na porta `5432` com volume `animeverse_pgdata`.
- `pnpm --filter @animeverse/api db:migrate` aplicou `0000_initial.sql` e `0001_lore_adaptation_foundation.sql` com sucesso (`pending: []` em `db:status`).
- Extensões confirmadas: `pg_trgm 1.6` e `unaccent 1.1`.
- `apps/api/test/schema-migrations.spec.ts` passou integralmente contra PostgreSQL real.
