# Auditoria — Fase 31: Autenticação OIDC, Sessões Seguras e RBAC

**Data:** 2026-11-23  
**Decisão de identidade:** Nenhum IdP OIDC de produção foi configurado no repositório ou especificado pelo operador. Portanto, o modo padrão permanece `AUTH_MODE=disabled` (**escrita administrativa = NO-GO em produção**, fail-closed `401`).

## Modelo de Ameaças Coberto

| Ameaça                | Mitigação Implementada (`apps/api/src/modules/auth/oidc-session.ts`)                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Schema oracle         | Hook `onRequest` executa antes da validação TypeBox (`401` em payload malformado).          |
| Token theft via XSS   | Cookie BFF `HttpOnly`, zero tokens em `localStorage`.                                       |
| CSRF                  | Verificação de `Origin` (allowlist) + `X-CSRF-Token` timing-safe em toda mutação.           |
| Privilege escalation  | Mapeamento explícito de claims (`mapClaimsToRole`); ausência de claim retorna `null`.       |
| Session replay/logout | `exp` validado + lista de revogação por `jti`.                                              |
| Misconfiguration      | `AUTH_MODE=disabled` ou segredo/issuer ausentes retornam sempre `null` (`401` fail-closed). |
