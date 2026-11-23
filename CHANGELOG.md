# Changelog

Todas as mudanças notáveis do **AnimeVerse Intelligence** são documentadas neste arquivo seguindo [Keep a Changelog](https://keepachangelog.com/) e [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Governança SDD completa (Fases 00–20): especificações `SPEC-0001`..`SPEC-0005`, ADRs `ADR-0001`..`ADR-0007`, políticas de dados e runbooks.
- Monorepo `pnpm workspaces` com `apps/web` (Angular 22 zoneless + Signals + Transloco pt-BR/en), `apps/api` (Fastify 5 + TypeBox + OpenAPI + Pino + Drizzle ORM) e `packages/contracts`.
- Infraestrutura PostgreSQL 17 em `compose.yaml` e migrações SQL versionadas (`0000_initial.sql`, `0001_lore_adaptation_foundation.sql`).
- Pipeline CLI streaming JSONL para `cedya77/anime-offline-database` (`dataset:download` com proteção SSRF e `dataset:import` idempotente em duas passagens).
- Endpoints read-only `/api/v1/health`, `/ready`, `/anime`, `/anime/:id`, `/anime/:id/related`, `/anime/:id/network`, `/studios`, `/studios/:id/anime`, `/studios/:id/network`, `/companies/:id`, `/statistics/overview`, `/data-sources`, `/data-sources/:id/runs`, `/enrichment/providers`, `/lore/status`, `/adaptation/status`.
- Frontend completo para Catálogo, Detalhe, Grafo de Relações (Cytoscape.js + alternativa tabular), StudioGraph (empresas↔obras), Observatório de Fontes, fundações vazias de LoreGraph/AdaptationLab e Sobre.
- Pipelines CI (`.github/workflows/ci.yml`) com PostgreSQL real e governança de release manual (`.github/workflows/release.yml`).
