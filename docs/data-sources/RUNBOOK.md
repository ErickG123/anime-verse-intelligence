# Runbook de Operação e Auditoria de Fontes

**Última atualização:** 2026-11-23

## 1. Execução segura da ingestão semanal (CLI local)

1. Garantir PostgreSQL em execução (`docker compose up -d postgres`) e migrações aplicadas (`pnpm --filter @animeverse/api db:migrate`).
2. Testar download sem baixar (`--dry-run`):
   ```powershell
   pnpm --filter @animeverse/api dataset:download -- --dry-run
   ```
3. Baixar a release oficial `cedya77/anime-offline-database` (sujeita à allowlist HTTPS e validação SHA-256):
   ```powershell
   pnpm --filter @animeverse/api dataset:download
   ```
4. Importar de forma idempotente em streaming:
   ```powershell
   pnpm --filter @animeverse/api dataset:import -- --file apps/api/data/anime-offline-database.jsonl
   ```
5. Conferir o resultado no Observatório de Fontes (`/sources` na UI ou `GET /api/v1/data-sources/anime-offline-database/runs`).

## 2. Auditoria de erros e conflitos

- Linhas rejeitadas ficam registradas em `ingestion_error` com `line_number` e `error_code`.
- Divergências de matching ficam registradas em `ingestion_conflict` com `resolved = false` até revisão humana.
- Nunca apagar dados curados manualmente ao reimportar um snapshot.
