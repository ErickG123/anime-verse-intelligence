# Relatório — Fase 11: Grafo interativo das relações entre obras

**Data:** 2026-11-23  
**Status:** APROVADO (backend + Cytoscape.js + alternativa tabular acessível validados; integração contra PG real condicional ao Docker Desktop)

---

## 1. Escopo planejado e execução real

- Backend: implementado `GET /api/v1/anime/:id/network?depth=1..2&limit=1..100` (`apps/api/src/modules/relations/`) com proteção contra ciclos, exclusão de self-references, flag `truncated` e todas as arestas marcadas como `UNSPECIFIED`.
- Frontend: criado componente reutilizável `CytoscapeGraphComponent` (`apps/web/src/app/shared/components/cytoscape-graph/`) com cleanup via `DestroyRef`, fit/reset e clique em nó, integrado na `RelationsPageComponent` com seletor de profundidade (`1` ou `2`), aviso explícito de `UNSPECIFIED` e alternância para tabela acessível por teclado.

## 2. Validações executadas

- `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (20 testes API + 2 suites Angular + 1 contracts): **APROVADO**. Cytoscape isolado em chunk lazy (`121.78 kB` transfer), sem impactar bundle inicial (`79.30 kB`).

## 3. Próxima fase

- **Fase 12 — StudioGraph inicial: empresas e obras** (`prompts/PROMPT-12-grafo-estudios-produtora.md`).
