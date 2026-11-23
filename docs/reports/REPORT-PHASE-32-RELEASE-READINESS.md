# Relatório — Fase 32: Preparação da Release Pública, Operação e Gate Go/No-Go

**Data:** 2026-11-23  
**Decisão Final:** **CONDITIONAL-GO (MVP Público Read-Only `0.1.0-rc.1`)** | **NO-GO para Escrita Editorial** (mantida `AUTH_MODE=disabled` fail-closed até provisionamento de IdP OIDC real).

---

## 1. Consolidação das Fases 29–32

| Fase | Entrega                                                            | Status               | Evidência                                                              |
| ---- | ------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------- |
| 29   | Playwright E2E cross-browser + CI job `e2e`                        | **Concluído**        | `48/48` testes PASS (`chromium`, `firefox`, `webkit`, `mobile`)        |
| 30   | Auditoria UX/UI, `color-scheme` dark/light, zero overflow          | **Concluído**        | `AUDIT-PHASE-30-UX-UI.md`, `REPORT-PHASE-30-UX-UI.md`                  |
| 31   | OIDC BFF + PKCE S256 + CSRF + revogação + ADR-0010                 | **Parcial (No IdP)** | `oidc-auth.spec.ts` PASS; produção permanece `AUTH_MODE=disabled`      |
| 32   | Runbooks de Deploy/Backup/Rollback, `.dockerignore`, Gate Go/No-Go | **Conditional-GO**   | Backup/restore + persistência pós-restart + `51/51` unit + `48/48` E2E |

---

## 2. Gate Final de Release

- [x] `pnpm lint`, `pnpm typecheck`, `pnpm build` — `0` erros.
- [x] `pnpm test` — `22/22` arquivos (`51/51` testes PASS).
- [x] `pnpm test:e2e` — `48/48` testes PASS em 4 navegadores/viewports.
- [x] PostgreSQL 17 isolado + `db:migrate` do zero + `2026-47` (`38.519` obras) idempotente + `pg_dump`/`pg_restore` + persistência pós-restart comprovados.
- [x] Anti-spoiler no payload e `/api/v1/admin/*` fail-closed `401` confirmados.
- [x] Nenhum deploy externo executado sem aprovação explícita.
