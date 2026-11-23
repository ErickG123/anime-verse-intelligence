# Relatório — Fase 12: StudioGraph inicial — empresas e obras

**Data:** 2026-11-23  
**Status:** APROVADO (grafo bipartido empresa↔obra validado sem créditos fictícios de pessoas; PG ao vivo condicional ao Docker)

---

## 1. Escopo planejado e execução real

- Backend: implementados `GET /api/v1/companies/:id` (contagens reais por tipo e década) e `GET /api/v1/studios/:id/network` (`apps/api/src/modules/studios/`) preservando papéis distintos `STUDIO` e `PRODUCER`.
- Frontend: criada `StudiosPageComponent` + `StudiosService` (`apps/web/src/app/features/studios/`) com busca de empresas, filtro `STUDIO`/`PRODUCER`, visualização Cytoscape bipartida, alternativa em lista acessível e aviso explícito _"Dados de estúdio e produtora; créditos individuais de profissionais (diretores, animadores) não estão disponíveis nesta fonte"_.

## 2. Validações executadas

- `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (`apps/api/test/graphs.spec.ts` incluído): **APROVADO**.

## 3. Próxima fase

- **Fase 13 — Painel de fontes e monitoramento de ingestões** (`prompts/PROMPT-13-observatorio-de-fontes.md`).
