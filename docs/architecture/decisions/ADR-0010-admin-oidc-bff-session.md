# ADR-0010 — Autenticação Administrativa via OIDC + PKCE (S256) e Sessão BFF

- **Status:** Aceito (implementação contratual pronta; produção permanece `AUTH_MODE=disabled` até definição de IdP real)
- **Data:** 2026-11-23

## Contexto

As rotas `/api/v1/admin/*` operam em modo fail-closed (`401` no hook `onRequest` antes da validação de schema). Para habilitar curadoria editorial com segurança, é necessário escolher o modelo de identidade e sessão sem expor tokens sensíveis ao navegador.

## Decisão

1. **BFF (Backend-for-Frontend) no Fastify 5** com **Authorization Code + PKCE (`S256`)** e descoberta OIDC por issuer pré-configurado.
2. **Sessão em cookie `HttpOnly` + `SameSite=Lax` + `Secure` (HTTPS)** assinado com HMAC-SHA256 e `jti` revogável, sem armazenamento de tokens em `localStorage`.
3. **Defesa CSRF em profundidade:** validação simultânea de `Origin` (allowlist) e header `X-CSRF-Token` (comparação timing-safe) em todas as mutações (`POST`/`PUT`/`PATCH`/`DELETE`).
4. **Mapeamento explícito de claims (`mapClaimsToRole`):** ausência de claim/grupo nunca concede papel.
5. **Fail-closed por padrão (`AUTH_MODE=disabled`):** sem configuração completa (`issuer`, `clientId`, `sessionSecret`), o autenticador retorna `null` (`401`).

## Consequências

- Zero credenciais padrão (`admin/admin`) ou bypass de desenvolvimento.
- Escrita editorial em produção permanece **NO-GO** até provisionamento de IdP real.
