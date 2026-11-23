# Runbook — Deploy Seguro (Read-Only `0.1.0-rc.1`)

**Última atualização:** 2026-11-23

1. **Pré-deploy:** Executar backup lógico `pg_dump -Fc` + SHA-256 conforme [BACKUP-RESTORE-RUNBOOK.md](BACKUP-RESTORE-RUNBOOK.md).
2. **Build reproduzível:** `pnpm install --frozen-lockfile && pnpm build && pnpm lint && pnpm typecheck && pnpm test`.
3. **Migrações incrementais:** `pnpm --filter @animeverse/api db:migrate` e confirmar `db:status` -> `pending: []`.
4. **Segurança de ambiente:** Garantir `AUTH_MODE=disabled` (até IdP OIDC real), `CORS_ORIGIN` restrito ao domínio real, TLS no reverse proxy e `.env` fora do repositório.
5. **Smoke pós-deploy:**
   - `GET /api/v1/health` -> `200`
   - `GET /api/v1/ready` -> `200`
   - `GET /api/v1/anime?page=1&pageSize=24` -> `200`
   - `POST /api/v1/admin/reviews/test/decisions` -> `401`
   - `POST /api/v1/anime` -> `404`
