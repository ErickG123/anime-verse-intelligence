# Runbook de Incidentes — AnimeVerse Intelligence

**Última atualização:** 2026-11-23

| Cenário                           | Sintoma                                                      | Ação recomendada                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL indisponível           | `GET /api/v1/ready` retorna `503` (`database: down`)         | Verificar Docker Desktop (`docker compose ps`), logs do container (`docker compose logs postgres`), `DATABASE_URL` no `.env`.      |
| Ingestão `PARTIAL`                | `error_count > 0` ou `conflict_count > 0` em `ingestion_run` | Inspecionar `ingestion_error` e `ingestion_conflict` para o `run_id`; corrigir ou revisar manualmente sem apagar dados existentes. |
| Arquivo JSONL truncado/corrompido | Erro no parser na linha 1 ou múltiplas linhas `INVALID_JSON` | Rebaixar o asset via `dataset:download` e validar SHA-256 antes de reexecutar `dataset:import`.                                    |
| Rate limit atingido (`429`)       | Resposta RFC 7807 `RATE_LIMIT_EXCEEDED`                      | Verificar picos de tráfego ou ajustar `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` no `.env`.                                            |
