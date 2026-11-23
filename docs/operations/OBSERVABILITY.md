# Observabilidade — AnimeVerse Intelligence

**Última atualização:** 2026-11-23

## Sinais disponíveis no MVP

- **Logs estruturados (Pino):** JSON estruturado compatível com Docker/Windows, nível configurável por `LOG_LEVEL`, redaction ativa de campos sensíveis.
- **Correlação de requisições:** header `x-request-id` propagado ou gerado via `crypto.randomUUID()` em toda resposta HTTP e incluído no payload RFC 7807 (`requestId`).
- **Probes de saúde:**
  - `GET /api/v1/health` (liveness — independente de banco).
  - `GET /api/v1/ready` (readiness — executa `SELECT 1` no PostgreSQL, retorna `200` ou `503`).
- **Auditoria de ingestão:** tabela `ingestion_run` registra `started_at`, `finished_at`, `status`, contadores (`total_lines`, `valid_records`, `created_count`, `updated_count`, `error_count`, `conflict_count`, `relations_count`), além de `ingestion_error` e `ingestion_conflict`.
