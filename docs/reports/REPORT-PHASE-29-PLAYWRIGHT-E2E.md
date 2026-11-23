# Relatório — Fase 29: Playwright E2E Real, Matriz de Navegadores e Regressão de Segurança

**Data:** 2026-11-23  
**Status:** **CONCLUÍDO** (48/48 testes E2E passando em Chromium, Firefox, WebKit e Mobile Chromium contra API Fastify 5 + Angular 22 + PostgreSQL 17 com `38.519` obras).  
**Auditoria de origem:** [AUDIT-PHASE-29-BROWSER-E2E.md](../audits/AUDIT-PHASE-29-BROWSER-E2E.md)  
**Estratégia:** [E2E-PLAYWRIGHT-STRATEGY.md](../testing/E2E-PLAYWRIGHT-STRATEGY.md)

---

## 1. Matriz de Resultados por Navegador

Executado contra `http://127.0.0.1:4200` (Angular 22) + `http://127.0.0.1:3000` (Fastify 5) + PostgreSQL `17.11` isolado (`127.0.0.1:55432`, `38.519` obras):

| Projeto           | Viewport   | Testes   | Passaram | Falhas            |
| ----------------- | ---------- | -------- | -------- | ----------------- |
| `chromium`        | `1440x900` | `12`     | `12`     | `0`               |
| `firefox`         | `1440x900` | `12`     | `12`     | `0`               |
| `webkit`          | `1440x900` | `12`     | `12`     | `0`               |
| `mobile-chromium` | `390x844`  | `12`     | `12`     | `0`               |
| **Total**         | —          | **`48`** | **`48`** | **`0`** (`32.1s`) |

---

## 2. Cobertura Implementada (`apps/web/e2e/`)

| Suíte                           | Cenários Validados                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog.spec.ts`               | Carregamento sem erros JS, consistência com paginação real da API, navegação detalhe + back/forward, fallback de rota desconhecida.                        |
| `graphs-and-sources.spec.ts`    | Renderização sem erros JS em `/relations`, `/studios`, `/sources`, `/lore`, `/adaptation`, `/about`; atribuição ODbL/DbCL em `/sources`.                   |
| `security-and-spoilers.spec.ts` | `/api/v1/health` + `x-request-id`, `/api/v1/ready`, `/api/v1/admin/*` fail-closed `401` antes do schema, `POST /api/v1/anime` -> `404`, busca Unicode CJK. |
| `resilience-and-a11y.spec.ts`   | Degradação graciosa em HTTP `500`, zero overflow horizontal em desktop (`1440x900`) e mobile (`390x844`), navegação por teclado (`Tab`).                   |

---

## 3. CI GitHub Actions

- Job `e2e` adicionado em `.github/workflows/ci.yml` com PostgreSQL 17 efêmero, `db:migrate`, importação de fixture offline, build, execução `pnpm test:e2e:smoke` (Chromium) e upload de artefatos (`playwright-report/`, `test-results/`) em caso de falha.

---

## 4. Lacunas Conhecidas

- Escrita administrativa autenticada (OIDC) permanece **BLOQUEADA** até a Fase 31 (testado explicitamente o comportamento fail-closed `401`).
