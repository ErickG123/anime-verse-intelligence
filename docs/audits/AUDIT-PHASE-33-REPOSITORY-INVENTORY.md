# Auditoria — Fase 33: Inventário Global do Repositório

**Data:** 2026-11-23  
**Ferramenta de auditoria:** `tooling/validate-repo.mjs` (`pnpm audit:repo`, `pnpm validate:docs`, `pnpm validate:architecture`)

---

## 1. Resumo Quantitativo do Inventário

| Métrica                                         | Quantidade | Status                                                               |
| ----------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| Total de arquivos analisados                    | `356`      | OK                                                                   |
| Arquivos Markdown (`.md`)                       | `165`      | OK (`0` links internos quebrados)                                    |
| Artefatos proibidos versionados                 | `0`        | OK (`.env`, `dist/`, `*.dump` ausentes)                              |
| Migrações SQL (`apps/api/drizzle/`)             | `3`        | Preservadas (`0000`, `0001`, `0002`)                                 |
| Features Angular (`apps/web/src/app/features/`) | `6`        | `about`, `catalog`, `placeholder`, `relations`, `sources`, `studios` |
| Agent Skills (`.agents/skills/`)                | `9`        | Todas com YAML frontmatter válido                                    |

---

## 2. Classificação por Categoria

| Categoria                     | Localização Principal                                                 | Classificação | Justificativa                                                                  |
| ----------------------------- | --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| Governança de Agentes         | `AGENTS.md`, `GEMINI.md`, `.agents/`                                  | `KEEP`        | Ponto de entrada canônico, 8 rules e 9 skills reutilizáveis.                   |
| Documentação SDD & ADRs       | `docs/architecture/`, `docs/specifications/`                          | `KEEP`        | Fonte de verdade arquitetural (`ADR-0001`..`ADR-0010`).                        |
| Relatórios & Auditorias       | `docs/reports/`, `docs/audits/`                                       | `KEEP`        | Rastreabilidade histórica preservada (Fases 00–33 + Extra).                    |
| Documentos Históricos na Raiz | `CHECKLIST-DE-EXECUCAO.md`, `PROMPT-MESTRE-23-28.md`, `MANIFEST.json` | `REVIEW`      | Mantidos por precaução (histórico de execução); confiança de exclusão `BAIXA`. |
| Frontend Angular 22           | `apps/web/`                                                           | `KEEP`        | Feature-based (ADR-0008), Zoneless, OnPush, `48/48` E2E PASS.                  |
| Backend Fastify 5 + Drizzle   | `apps/api/`                                                           | `KEEP`        | `45/45` testes PASS, `34` rotas OpenAPI, OIDC BFF fail-closed.                 |
| Contratos Compartilhados      | `packages/contracts/`                                                 | `KEEP`        | Fonte única de DTOs entre API e Web.                                           |
| Tooling & CI                  | `tooling/`, `.github/workflows/`                                      | `KEEP`        | ESLint AST customizado + `validate-repo.mjs` + CI `quality`/`e2e`.             |
