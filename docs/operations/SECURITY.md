# Segurança — AnimeVerse Intelligence

**Última atualização:** 2026-11-23

## Controles implementados no MVP

1. **Superfície HTTP estritamente read-only:** CORS restrito a `GET, HEAD, OPTIONS`; zero rotas `POST/PUT/PATCH/DELETE`; ingestão executada exclusivamente via CLI local (`ADR-0004`).
2. **Validação estrita de entrada e saída:** TypeBox JSON Schema em todas as rotas `/api/v1/*`, sorting por allowlist (sem interpolação SQL), queries parametrizadas via Drizzle ORM.
3. **Headers e rate-limit:** `@fastify/helmet` (`nosniff`, CORP `same-site`) e `@fastify/rate-limit` configurável via env.
4. **Sanitização de erros e logs:** Problem Details RFC 7807 ocultando stack traces em `500`; Pino com redaction de `authorization`, `cookie`, `x-api-key`, `password`, `databaseUrl`, `token`.
5. **Proteção contra SSRF e redirects:** `validateSafeDownloadUrl` exige `https:`, bloqueia IPs privados/loopback e aplica allowlist de hosts GitHub + limite de 5 redirects manuais.
6. **Segredos:** `.env` listado no `.gitignore`; zero credenciais em `apps/web` ou Git.
