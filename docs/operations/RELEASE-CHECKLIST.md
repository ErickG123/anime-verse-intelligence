# Release Checklist — AnimeVerse Intelligence

## 1. Critérios Obrigatórios de GO (Não-Negociáveis)

- [x] **Qualidade estática:** `pnpm lint`, `pnpm typecheck` e `pnpm build` finalizam com código `0`.
- [x] **Testes automatizados:** `pnpm test` passa integralmente (`packages/contracts`, `apps/api`, `apps/web`).
- [x] **Banco de dados:** PostgreSQL 17 `healthy`; `pnpm --filter @animeverse/api db:status` reporta `pending: []` (`0000`, `0001`, `0002`).
- [x] **Integridade do dataset:** Carga completa idempotente verificada (`38.519` animes, `0` self-refs, `0` erros inesperados).
- [x] **Segurança & Privacidade:** `.env` fora do Git, zero credenciais padrão, `/api/v1/admin/*` fail-closed `401` em `onRequest`, zero vazamento de spoilers em rotas públicas.
- [x] **Conformidade de fontes:** AniList e MangaUpdates apenas sob demanda com cache transitório em memória; atribuição ODbL/DbCL presente na UI e `/api/v1/data-sources`.
- [x] **OpenAPI & Saúde:** `/api/v1/health` (`200`), `/api/v1/ready` (`200`), `/docs/json` (`200`, 34 rotas).

## 2. Pré-Requisitos Antes de Habilitar Escrita Editorial em Produção

- [ ] Acoplar provedor OIDC/sessão real ao `registerEditorialGovernanceRoutes` (substituindo `failClosedAuthenticator` apenas em ambiente autenticado).
- [x] Instalar e executar suíte E2E Playwright (`chromium`, `firefox`, `webkit`, `mobile-chromium` — `48/48` PASS) em `2026-11-23`.
- [x] Executar teste de backup e restore (`pg_dump` -> banco isolado -> `db:status` + verificação de contagens) conforme [DOCKER-POSTGRES-REBUILD-RUNBOOK.md](DOCKER-POSTGRES-REBUILD-RUNBOOK.md) — validado em `2026-11-23` (`38.519` obras, `138.093` relações, `3` migrações, SHA-256 verificado).

## 3. Procedimento de Backup & Restore (PostgreSQL)

```powershell
# Backup lógico antes de qualquer migração ou deploy
docker exec animeverse-postgres pg_dump -U animeverse -Fc animeverse > backup-animeverse.dump

# Restore em banco isolado para verificação
docker exec -i animeverse-postgres pg_restore -U animeverse -d animeverse_verify --clean --if-exists < backup-animeverse.dump
```

## 4. Governança de Versão (SemVer)

- Seguir `CHANGELOG.md` e Conventional Commits.
- **Nunca** publicar tags, releases ou `git push --force` automaticamente sem aprovação humana explícita.
- Versão recomendada para o baseline atual (MVP Read-Only + Motores de Inteligência + Governança Fail-Closed): **`0.1.0-rc.1`**.
