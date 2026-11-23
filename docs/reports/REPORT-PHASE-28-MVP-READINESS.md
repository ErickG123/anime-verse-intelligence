# Relatório — Fase 28: Auditoria Integrada, Hardening, Performance e Prontidão do MVP

**Data:** 2026-11-23  
**Status:** **APROVADO (CONDITIONAL-GO para MVP Read-Only `0.1.0-rc.1`; NO-GO para escrita pública até acoplamento OIDC + Playwright E2E)**  
**Auditoria de origem:** [AUDIT-PHASE-28-MVP-READINESS.md](../audits/AUDIT-PHASE-28-MVP-READINESS.md)  
**Checklist de release:** [RELEASE-CHECKLIST.md](../operations/RELEASE-CHECKLIST.md)

---

## 1. Baseline e Ambiente

- **Sistema:** Windows 11 (PowerShell 5.1)
- **Runtime / Tooling:** Node `v24.16.0`, pnpm `11.17.0`, Angular CLI `22.0.2` (Zoneless + Signals + OnPush), Fastify `5`, TypeScript `6.0.3`, Vitest `4.1.12`
- **Banco de Dados:** Docker `29.9.2` com PostgreSQL `17-alpine` (`animeverse-postgres`, `healthy`, porta `5432`)
- **Dataset carregado:** `cedya77/anime-offline-database` release `2026-47` (`38.519` animes, `230.761` aliases, `192.521` refs externas, `7.037` empresas, `3.137` tags, `138.093` relações `UNSPECIFIED`)

## 2. Matriz Consolidada Fases 21–28

| Fase   | Entrega                                                                      | Status       | Testes / Evidências                                                                       |
| ------ | ---------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| **21** | Importador JSONL em lote + carga completa `2026-47`                          | **Aprovado** | `ingestion-parser.spec.ts` (3), `ingestion-db.spec.ts` (2), reimportação 100% idempotente |
| **22** | Integração AniList sob demanda (`25 req/min`, cache transitório)             | **Aprovado** | `anilist-integration.spec.ts` (5), 1 query live `HTTP 200 OK`                             |
| **23** | StudioGraph Avançado (modos, filtros, expansão incremental, caminho mínimo)  | **Aprovado** | `studio-graph.spec.ts` (2), `subgraph-path.utils.spec.ts` (2), benchmark PG real          |
| **24** | MangaUpdates + Wikidata (reconciliação editorial & conflitos)                | **Aprovado** | `editorial-sources.spec.ts` (3), políticas `MANGAUPDATES`/`WIKIDATA`                      |
| **25** | LoreGraph + Motor Anti-Spoiler Backend                                       | **Aprovado** | `loregraph-spoilers.spec.ts` (1), bloqueio em grafo/ID direto/busca/mídia                 |
| **26** | AdaptationLab (mapeamento, cobertura contextualizada, `UNKNOWN` ≠ `OMITTED`) | **Aprovado** | `adaptation-lab.spec.ts` (3), `ADAPTATION-CURATION-POLICY.md`                             |
| **27** | Governança Editorial (RBAC, lock otimista `409`, auditoria append-only)      | **Aprovado** | `0002_editorial_governance.sql` aplicada, `editorial-governance.spec.ts` (1)              |
| **28** | Auditoria integrada, hardening `onRequest`, benchmarks e prontidão MVP       | **Aprovado** | `21/21` arquivos de teste (`47/47` testes), `0` erros de build/typecheck/lint             |

## 3. Bugs Identificados e Solucionados

- **`RISK-28-01` (ALTO — Hardening `/api/v1/admin/*`):** Durante o smoke test da Fase 28, uma chamada não autenticada com payload divergente em `POST /api/v1/admin/reviews/:id/decisions` retornou `400` (validação de schema) antes da checagem de autenticação (`401`). **Correção:** adicionado hook `onRequest` fail-closed em todas as rotas `/api/v1/admin/*` em `apps/api/src/modules/editorial-governance/routes.ts`, garantindo `401 Unauthorized` antes do parsing/validação do corpo.

## 4. Esquema, Migrações e Integridade

- Migrações aplicadas no PostgreSQL 17: `0000_initial.sql`, `0001_lore_adaptation_foundation.sql`, `0002_editorial_governance.sql` (`pending: []`).
- Contagens reais verificadas via `psql`: `animes = 38519`, `aliases = 230761`, `ext_refs = 192521`, `companies = 7037`, `tags = 3137`, `rels = 138093`, `reviews = 0`, `audit_events = 0`.
- Integridade referencial: `0` auto-referências em `anime_relationship`.

## 5. Cobertura de Fontes, Dados e Direitos

- **anime-offline-database:** licença ODbL/DbCL respeitada, importação CLI-only idempotente, proveniência por snapshot/evidência.
- **AniList & MangaUpdates:** consulta estritamente sob demanda com rate limit conservador, cache transitório em memória e **zero replicação permanente** no PostgreSQL.
- **Wikidata:** CC0 com identificação por QID e detecção explícita de conflito editorial.
- **LoreGraph / AdaptationLab:** apenas conteúdo curado e publicado (`PUBLISHED`) com licença válida (`rightsStatus = VERIFIED`) é exposto ao público.

## 6. Segurança (Auth, Spoilers e Restrições Legais)

- `.env` confirmado no `.gitignore`; zero segredos rastreados no Git.
- Zero credenciais padrão (`admin/admin`).
- Todas as rotas `/api/v1/admin/*` operam em modo fail-closed (`401` no hook `onRequest`).
- Rotas públicas não possuem mutações (`POST /api/v1/anime` -> `404`).
- Motor anti-spoiler bloqueia eventos futuros e rascunhos em grafo, busca, ID direto (`403`) e progresso incompatível.

## 7. Resultados de Validação Automatizada

| Comando                                    | Resultado    | Detalhe                                                                            |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------------------------- |
| `pnpm --filter @animeverse/api db:migrate` | **PASS**     | `0002_editorial_governance.sql` aplicada                                           |
| `pnpm --filter @animeverse/api db:status`  | **PASS**     | `applied: 3`, `pending: 0`                                                         |
| `pnpm build`                               | **PASS**     | `contracts` + `api` + `web` (`Initial total: 293.87 kB` raw / `79.57 kB` transfer) |
| `pnpm typecheck`                           | **PASS**     | `0` erros nos 3 pacotes                                                            |
| `pnpm lint`                                | **PASS**     | `0` erros (incluindo `tooling/eslint-plugin-animeverse.mjs` AST)                   |
| `pnpm test`                                | **PASS**     | **`21/21` arquivos, `47/47` testes** (`contracts: 1`, `api: 41`, `web: 5`)         |
| OpenAPI (`/docs/json`)                     | **PASS**     | `HTTP 200`, `34` caminhos documentados                                             |
| Playwright E2E Browser                     | **PENDENTE** | Playwright não instalado no workspace (registrado explicitamente)                  |

## 8. Benchmarks Medidos (PostgreSQL 17 com 38.519 obras)

Medições reais via `app.inject` (10 execuções por endpoint contra PostgreSQL Docker local):

| Endpoint                                               | HTTP  | p50 (ms)       | p95 (ms)        | Observação                                     |
| ------------------------------------------------------ | ----- | -------------- | --------------- | ---------------------------------------------- |
| `GET /api/v1/anime?page=1&pageSize=24`                 | `200` | `18.14`        | `92.22`         | Listagem paginada principal                    |
| `GET /api/v1/anime?q=bebop&page=1&pageSize=24`         | `200` | `146.29`       | `863.36`        | Busca textual (38.519 obras + 230.761 aliases) |
| `GET /api/v1/anime?q=カウボーイ&page=1&pageSize=24`    | `200` | `168.09`       | `241.65`        | Busca Unicode CJK                              |
| `GET /api/v1/data-sources`                             | `200` | `40.20`        | `87.23`         | Observatório de fontes                         |
| `GET /api/v1/studio-graph` (Fase 23, `toei animation`) | `200` | `5.98` (`@30`) | `11.39` (`@80`) | Subgrafo em PG real                            |

Bundle Angular (`apps/web/dist/web`):

- **Initial:** `293.87 kB` raw (`79.57 kB` transfer).
- **Lazy chunks:** todas as rotas de features (`catalog`, `anime-detail`, `relations`, `studios`, `sources`, `about`) carregadas sob demanda.

## 9. UX, Responsividade e Acessibilidade

- Arquitetura Angular 22 standalone, Zoneless, Signals, `ChangeDetectionStrategy.OnPush`, `.ts/.html/.scss` separados e 100% de paridade i18n (`pt-BR`/`en`) validada em `i18n-parity.spec.ts`.
- Alternativa tabular acessível presente para grafos (Relações e StudioGraph) e `ResizeObserver` com cleanup.
- Auditoria visual automatizada em browser real (Playwright + axe) permanece pendente de instalação do Playwright.

## 10. Operabilidade, Backup e Troubleshooting

- Runbooks consolidados em `docs/operations/`: [DATABASE-RUNBOOK.md](../operations/DATABASE-RUNBOOK.md), [INCIDENT-RUNBOOK.md](../operations/INCIDENT-RUNBOOK.md), [OBSERVABILITY.md](../operations/OBSERVABILITY.md), [SECURITY.md](../operations/SECURITY.md) e [RELEASE-CHECKLIST.md](../operations/RELEASE-CHECKLIST.md).
- Health (`/api/v1/health`) desacoplado de readiness (`/api/v1/ready`) e de provedores externos.

## 11. Pendências Classificadas e Decisão GO / NO-GO

| Item                                                                | Classificação | Impacto                                                                                       |
| ------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| Instalação e execução da suíte E2E Playwright (desktop/mobile/a11y) | **MÉDIO**     | Não bloqueia `0.1.0-rc.1` read-only local/staging; obrigatório antes de GA pública.           |
| Integração de provedor OIDC/sessão real para UI de curadoria        | **MÉDIO**     | Sistema permanece **fail-closed (`401`)** de forma segura até a decisão humana de identidade. |
| Otimização `tsvector` na busca de 38.519 obras (`p50 ~146 ms`)      | **BAIXO**     | Melhoria incremental pós-MVP.                                                                 |

### Decisão Final

- **MVP Público Read-Only + Motores de Inteligência (`0.1.0-rc.1`):** **CONDITIONAL-GO** (todas as validações de build, lint AST, typecheck, 47/47 testes, 38.519 obras em PG 17, segurança fail-closed e conformidade de fontes estão aprovadas).
- **Módulo de Escrita Editorial em Produção:** **NO-GO** até acoplamento de provedor OIDC real e execução de E2E Playwright.
