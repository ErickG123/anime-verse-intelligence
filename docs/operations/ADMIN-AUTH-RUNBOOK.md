# Runbook — Autenticação Administrativa OIDC (`AUTH_MODE`)

**Última atualização:** 2026-11-23  
**ADR:** [ADR-0010-admin-oidc-bff-session.md](../architecture/decisions/ADR-0010-admin-oidc-bff-session.md)

## Variáveis Necessárias para Habilitar OIDC (Staging/Produção)

- `AUTH_MODE=oidc` (padrão seguro: `disabled` — mantém `/api/v1/admin/*` sempre `401`)
- `OIDC_ISSUER=https://<seu-idp>/realms/animeverse`
- `OIDC_CLIENT_ID=animeverse-web`
- `OIDC_SESSION_SECRET=<segredo-aleatorio-minimo-32-bytes>` (nunca commitar)
- `CORS_ORIGIN=https://<dominio-real>`

## Checklist Antes de Habilitar Escrita Editorial

1. IdP OIDC provisionado com TLS válido e redirect URIs exatas.
2. Grupos `animeverse-editor`, `animeverse-reviewer`, `animeverse-admin` configurados sem autoaprovação.
3. Teste E2E com IdP real de staging executado (login, decisão editorial, lock `409`, gate `422`, logout e revogação).
