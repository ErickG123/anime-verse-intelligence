# Backlog Priorizado — AnimeVerse Intelligence

**Status:** Aprovado (Fase 01)  
**Convenção de prioridade:** `P0` (essencial MVP), `P1` (importante MVP), `P2` (preparação estrutural MVP), `POST-MVP` (evolução futura).

| ID      | Épico / Entrega                                                           | Prioridade | Fase prevista | Especificação                      |
| ------- | ------------------------------------------------------------------------- | ---------- | ------------- | ---------------------------------- |
| `BL-01` | Arquitetura, ADRs e contratos conceituais                                 | P0         | Fase 02       | `SPEC-0001`..`0004`                |
| `BL-02` | Scaffolding monorepo pnpm (`apps/web`, `apps/api`, `packages/contracts`)  | P0         | Fase 03       | `RNF-0005`                         |
| `BL-03` | PostgreSQL Docker Compose + schema Drizzle + migrations                   | P0         | Fase 04       | `SPEC-0002`, `SPEC-0004`           |
| `BL-04` | Fundação API Fastify 5, TypeBox, OpenAPI, Problem Details, health/ready   | P0         | Fase 05       | `RNF-0003`, `RNF-0006`             |
| `BL-05` | Fundação Angular 22 standalone/zoneless, design system, i18n, temas       | P0         | Fase 06       | `RNF-0004`, `RNF-0007`             |
| `BL-06` | Governança de fontes, normalização de IDs externos e política de licenças | P0         | Fase 07       | `SPEC-0004`                        |
| `BL-07` | Coletor e importador streaming JSONL (`anime-offline-database`) via CLI   | P0         | Fase 08       | `SPEC-0002`                        |
| `BL-08` | API de catálogo, busca full-text/trigrama, filtros, detalhe e empresas    | P0         | Fase 09       | `SPEC-0001`                        |
| `BL-09` | Frontend de catálogo, filtros e página de detalhe com proveniência        | P0         | Fase 10       | `SPEC-0001`                        |
| `BL-10` | API e grafo interativo de relações entre obras (`UNSPECIFIED`)            | P1         | Fase 11       | `SPEC-0003`                        |
| `BL-11` | StudioGraph inicial (empresas `STUDIO`/`PRODUCER` ↔ obras)                | P1         | Fase 12       | `SPEC-0001`, `SPEC-0003`           |
| `BL-12` | Observatório read-only de fontes, snapshots e execuções de ingestão       | P1         | Fase 13       | `SPEC-0002`, `SPEC-0004`           |
| `BL-13` | Contratos e adaptadores desativados de enriquecimento opcional            | P2         | Fase 14       | `SPEC-0004`                        |
| `BL-14` | Fundações vazias/transparentes de LoreGraph e AdaptationLab               | P2         | Fase 15       | `PRODUCT-SCOPE.md`                 |
| `BL-15` | Refino de UX, i18n, acessibilidade WCAG AA e performance                  | P1         | Fase 16       | `RNF-0001`, `RNF-0004`, `RNF-0007` |
| `BL-16` | Segurança, observabilidade Pino, rate limit e resiliência                 | P1         | Fase 17       | `RNF-0002`, `RNF-0003`, `RNF-0006` |
| `BL-17` | Cobertura de testes, CI GitHub Actions e governança de release            | P0         | Fase 18       | `RNF-0005`                         |
| `BL-18` | Auditoria final E2E do MVP                                                | P0         | Fase 19       | Todas                              |
| `BL-19` | Roadmap evolutivo pós-MVP (staff, mangá, LoreGraph, AdaptationLab, LGPD)  | POST-MVP   | Fase 20       | `VISION.md`                        |
