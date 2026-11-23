# Runbook — Rollback de Aplicação (Sem Rollback Destrutivo de Schema)

**Última atualização:** 2026-11-23

1. **Nunca** executar `DROP TABLE`, `TRUNCATE` ou edição de migrações já aplicadas em produção.
2. **Rollback de código:** Reverter para o commit/tag anterior (`0.1.0-rc.1`), reconstruir (`pnpm build`) e reiniciar API/Web.
3. **Mudanças incompatíveis de schema:** Usar exclusivamente o padrão **Expand/Contract** em migrações incrementais.
4. **Recuperação catastrófica:** Restaurar o último dump verificado (`pg_restore`) em banco novo e redirecionar `DATABASE_URL` após validar `db:status` e contagens.
