# Relatório — Fase 09: API de catálogo e busca

**Data:** 2026-11-23  
**Status:** PARCIAL (endpoints TypeBox, repositório Drizzle parametrizado, sorting allowlist e 19/19 testes `fastify.inject` APROVADOS; coleta de `EXPLAIN ANALYZE` em PostgreSQL real aguarda inicialização do Docker Desktop)

---

## 1. Escopo planejado e execução real

- Expandido `@animeverse/contracts` com DTOs de transporte para catálogo, detalhe, relacionados, estúdios, estatísticas, grafos, observatório de fontes e módulos futuros.
- Implementado `apps/api/src/modules/catalog/` (`schemas.ts`, `repository.ts`, `routes.ts`) com:
  - `GET /api/v1/anime` (paginação `pageSize <= 100`, busca acento-insensível em título e sinônimos, filtros combináveis `type`, `status`, `season`, `year`, `tag`, `studio`, `producer`, ordenação estrita por allowlist sem interpolação SQL).
  - `GET /api/v1/anime/:id` (detalhe completo com aliases, empresas por papel, referências externas, contagem de relacionados e proveniência).
  - `GET /api/v1/anime/:id/related` (relações explicitamente `UNSPECIFIED` + aviso).
  - `GET /api/v1/studios`, `GET /api/v1/studios/:id/anime` e `GET /api/v1/statistics/overview`.

## 2. Validações executadas

| Comando                                     | Resultado real                      | Classificação                                                     |
| ------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `pnpm --filter @animeverse/contracts build` | 0 erros                             | **APROVADO**                                                      |
| `pnpm --filter @animeverse/api typecheck`   | 0 erros                             | **APROVADO**                                                      |
| `pnpm lint`                                 | 0 erros                             | **APROVADO**                                                      |
| `pnpm --filter @animeverse/api test`        | 6/6 arquivos, 19/19 testes passando | **APROVADO**                                                      |
| `EXPLAIN ANALYZE` em PostgreSQL real        | Daemon Docker parado                | **BLOQUEADO** (reproduzível após `docker compose up -d postgres`) |

## 3. Próxima fase

- **Fase 10 — Frontend de catálogo e detalhe** (`prompts/PROMPT-10-catalogo-angular.md`).

---

## Atualização — Validação ao vivo com Docker Desktop (2026-11-23)

- **Status atualizado:** **APROVADO**
- `EXPLAIN ANALYZE` executado no PostgreSQL real para busca em `anime.normalized_title`: `Planning Time: 1.831 ms`, `Execution Time: 0.122 ms` (extensões `pg_trgm 1.6` e `unaccent 1.1` ativas).
- Criado e aprovado teste de integração ponta a ponta `apps/api/test/live-pg-catalog.spec.ts` validando `/api/v1/ready`, `/anime`, `/anime/:id`, `/anime/:id/network`, `/studios`, `/studios/:id/network`, `/statistics/overview` e `/data-sources/anime-offline-database/runs` contra PostgreSQL real (`1543 ms`).
