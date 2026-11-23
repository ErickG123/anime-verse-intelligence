# Runbook — Docker PostgreSQL 17, Reconstrução Segura e Backup/Restore

**Última atualização:** 2026-11-23  
**Escopo:** Operação segura de PostgreSQL 17 em Docker no Windows (PowerShell) para desenvolvimento e validação isolada.

---

## 1. Regra de Ouro contra Perda de Dados

- **NUNCA** execute `docker compose down -v`, `docker volume rm`, `docker volume prune`, `DROP DATABASE` ou `TRUNCATE` sobre o ambiente de desenvolvimento principal (`animeverse-postgres` / `animeverse_pgdata`) sem backup verificado e aprovação explícita.
- Para testes de reconstrução do zero, utilize sempre a **Modalidade A (`REBUILD-ISOLATED`)**.

---

## 2. Modalidade A — `REBUILD-ISOLATED` (Padrão Recomendado)

Cria uma instância totalmente isolada usando `compose.validation.yaml`, projeto `-p animeverse-validation`, volume exclusivo `animeverse_validation_pgdata` e porta em loopback `127.0.0.1:55432`.

```powershell
# 1. Definir credencial forte apenas na sessão (nunca commitar)
$env:POSTGRES_VALIDATION_PASSWORD = "<SENHA_FORTE_DA_SESSAO>"

# 2. Subir PostgreSQL 17 isolado
docker compose -p animeverse-validation -f compose.validation.yaml up -d postgres

# 3. Verificar saúde (aguardar status healthy)
docker compose -p animeverse-validation -f compose.validation.yaml ps
docker exec animeverse-validation-postgres psql -U animeverse_val -d animeverse_validation -c "SELECT version(), current_database(), current_user;"

# 4. Aplicar migrações do zero e confirmar pending: []
$env:DATABASE_URL = "postgresql://animeverse_val:$($env:POSTGRES_VALIDATION_PASSWORD)@127.0.0.1:55432/animeverse_validation"
pnpm --filter @animeverse/api db:migrate
pnpm --filter @animeverse/api db:status
```

### Parada segura (preservando volume)

```powershell
docker compose -p animeverse-validation -f compose.validation.yaml stop postgres
```

> **Nota:** Para remover posteriormente o ambiente isolado (somente após aprovação explícita), use `docker compose -p animeverse-validation -f compose.validation.yaml down -v`.

---

## 3. Modalidade B — `UPSERT-EXISTING` (Banco Existente, Sem Recriação)

```powershell
# 1. Subir serviço existente
docker compose up -d postgres
docker compose ps

# 2. Backup lógico obrigatório antes de migrações ou importações
docker exec animeverse-postgres pg_dump -U animeverse -Fc -f /tmp/backup.dump animeverse
docker cp animeverse-postgres:/tmp/backup.dump .\backup-animeverse.dump
docker exec animeverse-postgres rm -f /tmp/backup.dump
Get-FileHash -Algorithm SHA256 .\backup-animeverse.dump

# 3. Aplicar migrações incrementais e importação idempotente
pnpm --filter @animeverse/api db:migrate
pnpm --filter @animeverse/api db:status
pnpm --filter @animeverse/api dataset:import -- --file data/anime-offline-database.jsonl
```

---

## 4. Procedimento de Restore Verificado (Banco Descartável)

> **Atenção no Windows PowerShell:** Evite redirecionamento `< arquivo.dump` em `docker exec -i` no PowerShell 5.1 (pode corromper fluxo binário). Prefira `docker cp` + `pg_restore` dentro do container.

```powershell
# Criar banco descartável no container alvo
docker exec animeverse-validation-postgres psql -U animeverse_val -d postgres -c "CREATE DATABASE animeverse_restore_verify OWNER animeverse_val;"

# Copiar dump e restaurar
docker cp .\animeverse_validation.dump animeverse-validation-postgres:/tmp/restore.dump
docker exec animeverse-validation-postgres pg_restore -U animeverse_val -d animeverse_restore_verify --no-owner /tmp/restore.dump
docker exec animeverse-validation-postgres rm -f /tmp/restore.dump

# Verificar contagens
docker exec animeverse-validation-postgres psql -U animeverse_val -d animeverse_restore_verify -c "SELECT count(*) FROM anime;"
```

---

## 5. Troubleshooting no Windows

- **Conflito de porta `5432`:** Verifique com `netstat -ano | Select-String ":5432 "`. Use `POSTGRES_VALIDATION_PORT` (ex.: `55432`) em `127.0.0.1`.
- **Docker Desktop parado:** `docker version` falhará no pipe `npipe:////./pipe/dockerDesktopLinuxEngine`. Inicie o Docker Desktop antes de subir o container.
- **Healthcheck demorando:** Inspecione logs com `docker logs animeverse-validation-postgres --tail 50`.
