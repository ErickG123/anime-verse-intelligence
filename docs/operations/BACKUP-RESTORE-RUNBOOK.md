# Runbook — Backup e Restore Verificado (PostgreSQL 17)

**Última atualização:** 2026-11-23  
**Evidência real:** Testado em `2026-11-23` no banco isolado `animeverse_validation` (`37.798.422` bytes, SHA-256 `05CE6715D60044A5D2C611EEE43CA6D98BABFB00A0C4C12993788923C818BCE5`, restaurado em `animeverse_restore_verify` com `38.519` animes, `138.093` relações e `3` migrações).

- **RPO alvo:** 24h (snapshot diário + dump pré-migração).
- **RTO alvo:** < 15 minutos para banco de ~40k obras.
- Procedimento detalhado Windows/Docker em [DOCKER-POSTGRES-REBUILD-RUNBOOK.md](DOCKER-POSTGRES-REBUILD-RUNBOOK.md).
