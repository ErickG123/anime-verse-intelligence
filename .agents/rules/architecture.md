# Regra — Arquitetura Geral (`architecture.md`)

- Monorepo nativo `pnpm workspaces`: `apps/web` (Angular 22 SPA zoneless), `apps/api` (Fastify 5 + Drizzle ORM), `packages/contracts` (somente DTOs HTTP compartilhados, nunca schemas de banco ou migrações).
- Backend modular por domínio (`config/`, `db/`, `plugins/`, `modules/`, `cli/`), app factory testável com `fastify.inject` separada de `server.ts`.
- API HTTP do MVP estritamente read-only (`/api/v1/*`); ingestão e curadoria ocorrem exclusivamente via CLI local (`ADR-0004`).
- Alterações estruturais significativas exigem ADR em `docs/architecture/decisions/` antes da implementação.
