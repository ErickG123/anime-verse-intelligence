# Runbook de Banco de Dados — PostgreSQL & Migrações

**Última atualização:** 2026-11-23

## 1. Subir PostgreSQL localmente (Windows 11 / Docker Desktop)

1. Copie `.env.example` para `.env` e defina `POSTGRES_PASSWORD` (nunca commitar `.env`).
2. Inicie o Docker Desktop (engine Linux).
3. Execute:
   ```powershell
   docker compose up -d postgres
   docker compose ps
   ```
4. Aplique migrações versionadas:
   ```powershell
   pnpm --filter @animeverse/api db:migrate
   pnpm --filter @animeverse/api db:status
   ```

## 2. Política de migrações

- **Proibido** executar `drizzle-kit push` em produção ou contra bases com dados curados.
- Toda alteração de schema deve ser versionada em `apps/api/drizzle/NNNN_<descricao>.sql` e aplicada transacionalmente pelo runner `src/db/migrate.ts`.

## 3. Backup e restauração local

- **Backup lógico:**
  ```powershell
  docker exec animeverse-postgres pg_dump -U animeverse -Fc animeverse > backup_animeverse.dump
  ```
- **Restauração (em banco novo ou após backup confirmado):**
  ```powershell
  Get-Content -Encoding Byte backup_animeverse.dump | docker exec -i animeverse-postgres pg_restore -U animeverse -d animeverse --clean --if-exists
  ```

## 4. Reset local (somente com confirmação explícita e backup)

> [!CAUTION]
> O comando abaixo remove o volume `animeverse_pgdata` e apaga todos os dados locais. Execute apenas com backup prévio e autorização explícita.

```powershell
docker compose down -v
docker compose up -d postgres
pnpm --filter @animeverse/api db:migrate
```
