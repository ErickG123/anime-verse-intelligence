# Relatório Final — Fase 23: StudioGraph Avançado

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Status geral:** **CONCLUÍDO**

---

## 1. Antes vs. Depois e Topologia

- **Antes:** `GET /api/v1/studios/:id/network` retornava grafo bipartido estático sem paginação incremental, sem filtros de período, sem modalidades explícitas `PRODUCTION`/`COLLABORATION`, sem `ResizeObserver`, sem formas geométricas por entidade e sem painel de detalhes/expansão de nó.
- **Depois:**
  - Contratos compartilhados em `packages/contracts/src/index.ts` (`StudioGraphMode`, `StudioGraphNodeDto`, `StudioGraphEdgeDto`, `StudioGraphPageDto`, `StudioGraphMetadataDto`).
  - Módulo backend `apps/api/src/modules/studio-graph/` (`repository.ts`, `routes.ts`) com IDs tipados (`anime:<uuid>`, `company:<uuid>`, `person:anilist:<id>`), validação TypeBox e 3 endpoints read-only:
    - `GET /api/v1/studio-graph/metadata`
    - `GET /api/v1/studio-graph?anchorId=...&mode=PRODUCTION|COLLABORATION&role=...&yearFrom=...&yearTo=...&limit=30&offset=0`
    - `GET /api/v1/studio-graph/nodes/:nodeId/neighbors`
  - Nenhuma tabela especulativa de grafo foi criada (zero migrações novas; zero persistência de créditos AniList no PostgreSQL).
  - Frontend `apps/web/src/app/features/studios/` (`models/studio-graph.model.ts`, `constants/studio-graph.constants.ts`, `utils/subgraph-path.utils.ts`, `services/studios.service.ts`, `pages/studios/studios-page.component.{ts,html,scss}`) + `CytoscapeGraphComponent` atualizado com `ResizeObserver` + cleanup, formas distintas (`ellipse`, `round-rectangle`, `hexagon`, `diamond`) + legenda acessível, busca de nó, filtros de período/papel, expansão incremental (`Load more` + `Expand selected neighbors`), painel de detalhes, cópia de URL compartilhável e tabela acessível.

---

## 2. Benchmark real (PostgreSQL 17 Docker — 38.519 animes, maior estúdio `toei animation co., ltd.`)

Ambiente: Windows 11 x64, Node `v24.16.0`, PostgreSQL `17-alpine` Docker local, 10 requisições `fastify.inject` por cenário.

| Cenário         | Limite | Nós / Arestas |       p50 (ms) |                         p95 (ms) |
| --------------- | -----: | ------------- | -------------: | -------------------------------: |
| Pequeno         |   `10` | `11` / `10`   |  **`4,89 ms`** | `200,31 ms` _(1ª req cold pool)_ |
| Médio (padrão)  |   `30` | `31` / `30`   |  **`5,98 ms`** |                   **`60,59 ms`** |
| Grande (máximo) |   `80` | `81` / `80`   | **`11,39 ms`** |                   **`35,97 ms`** |

---

## 3. Matriz de rastreabilidade (`RF → código → teste → evidência`)

| Requisito  | Arquivos                                                               | Testes                                                           | Resultado     | Evidência                                                                                               |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `RF-0026`  | `apps/api/src/modules/studio-graph/{repository,routes}.ts`             | `apps/api/test/studio-graph.spec.ts`                             | **CONCLUÍDO** | `limit <= 80`, filtros `role`/`yearFrom`/`yearTo`, paginação e vizinhos validados em PG real            |
| `RF-0027`  | `packages/contracts/src/index.ts`, `studio-graph/repository.ts`        | `apps/api/test/studio-graph.spec.ts`                             | **CONCLUÍDO** | IDs tipados (`anime:`, `company:`, `person:anilist:`), `LOCAL_DB` vs `ANILIST_ON_DEMAND`                |
| `RF-0028`  | `apps/web/src/app/features/studios/**`, `cytoscape-graph.component.ts` | `subgraph-path.utils.spec.ts`, `i18n-parity.spec.ts`, `ng build` | **CONCLUÍDO** | Modos, filtros, legenda forma+cor, painel de detalhes, tabela acessível e paridade `pt-BR`/`en`         |
| `RF-0029`  | `studio-graph/repository.ts`, `subgraph-path.utils.ts`                 | `studio-graph.spec.ts`, `subgraph-path.utils.spec.ts`            | **CONCLUÍDO** | Aviso explícito de escopo parcial; modo `COLLABORATION` degrada graciosamente quando AniList `DISABLED` |
| `RNF-0011` | `cytoscape-graph.component.ts`, `studio-graph/routes.ts`               | `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`         | **CONCLUÍDO** | `ResizeObserver` com cleanup, regras AST 0 erros, benchmark `p50 <= 11,39 ms`                           |

---

## 4. Validações executadas

- `pnpm build` → **CONCLUÍDO** (`contracts`, `api`, `web`)
- `pnpm typecheck` → **CONCLUÍDO** (3/3 pacotes TS 6.0.3 strict)
- `pnpm lint` → **CONCLUÍDO** (0 erros ESLint + regras AST)
- `pnpm test` (com PostgreSQL 17 populado com `38.519` animes) → **CONCLUÍDO** (`17/17` arquivos, **`39/39` testes**: `contracts` 1, `api` 33, `web` 5)

## 5. Pendências e próximo gate

- **PENDENTE (não bloqueante para a Fase 24):** E2E visual em navegador real via Playwright (não instalado neste host).
- **Gate para Fase 24 (`PROMPT-24-MANGAUPDATES-WIKIDATA.md`):** **LIBERADO** após revisão do operador.
