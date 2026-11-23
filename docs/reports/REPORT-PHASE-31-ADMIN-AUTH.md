# Relatório — Fase 31: Autenticação OIDC, Sessões Seguras, RBAC e Liberação Controlada

**Data:** 2026-11-23  
**Status:** **PARCIAL / CONDITIONAL** (módulo OIDC BFF + PKCE S256 + CSRF + revogação + testes contratuais implementados e aprovados; **escrita administrativa em produção permanece `NO-GO` / `AUTH_MODE=disabled`** por ausência de IdP OIDC real configurado).

## Entregas

- `apps/api/src/modules/auth/oidc-session.ts`: PKCE S256, `mapClaimsToRole`, cookie BFF HMAC-SHA256 com `exp` e `jti` revogável, proteção CSRF (`Origin` + `X-CSRF-Token`) e fail-closed absoluto quando `AUTH_MODE=disabled`.
- `apps/api/test/oidc-auth.spec.ts`: 4 suítes de segurança cobrindo PKCE, claims, adulteração/expiração de cookie, CSRF, Origin, revogação e regressão `401` antes do schema.
- Documentação: [ADR-0010](../architecture/decisions/ADR-0010-admin-oidc-bff-session.md), [AUDIT-PHASE-31-ADMIN-AUTH.md](../audits/AUDIT-PHASE-31-ADMIN-AUTH.md) e [ADMIN-AUTH-RUNBOOK.md](../operations/ADMIN-AUTH-RUNBOOK.md).

## Bloqueio Explícito

- E2E browser de login com IdP real de teste permanece **BLOQUEADO** até provisionamento de IdP (Keycloak/Auth0/Entra) autorizado pelo operador.
