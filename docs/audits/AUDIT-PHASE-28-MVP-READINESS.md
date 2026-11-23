# Auditoria — Fase 28: Prontidão Integrada do MVP (Readiness Audit)

**Data:** 2026-11-23  
**Escopo:** Inventário real Fases 21–27, verificação das Jornadas A–F, alinhamento de contratos/OpenAPI/PostgreSQL, segurança, performance e matriz de riscos.

## 1. Inventário Real das Fases 21–27

| Fase   | Domínio                                                 | Estado Real    | Evidência Principal                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **21** | Importador JSONL + Dataset Completo `2026-47`           | `IMPLEMENTADO` | `38.519` animes, `230.761` aliases, `192.521` refs, `7.037` empresas, `3.137` tags, `138.093` relações (`0` self-refs, `0` erros); idempotência 100% comprovada (`REPORT-PHASE-21-DATASET-IMPORT-VALIDATION.md`).                                                                                           |
| **22** | Integração AniList Sob Demanda                          | `IMPLEMENTADO` | Conector read-only (`25 req/min`, cache transitório em memória, zero replicação PG), 1 query live `HTTP 200 OK`, `anilist-integration.spec.ts` (`5/5`).                                                                                                                                                     |
| **23** | StudioGraph Avançado                                    | `IMPLEMENTADO` | Endpoints `/api/v1/studio-graph*`, IDs tipados, modo `PRODUCTION`/`COLLABORATION`, expansão incremental, caminho mínimo, `studio-graph.spec.ts` (`2/2`), `subgraph-path.utils.spec.ts` (`2/2`), benchmark PG real `p50 <= 11.39 ms`.                                                                        |
| **24** | MangaUpdates + Wikidata Editorial                       | `IMPLEMENTADO` | Políticas (`MANGAUPDATES-SOURCE-POLICY.md`, `WIKIDATA-SOURCE-POLICY.md`), reconciliador por QID/identidade, detecção explícita de conflito, `editorial-sources.spec.ts` (`3/3`).                                                                                                                            |
| **25** | LoreGraph + Motor Anti-Spoiler Backend                  | `IMPLEMENTADO` | `apps/api/src/modules/lore/spoiler-engine.ts`, rotas protegidas contra vazamento por grafo/ID direto/busca/mídia, `loregraph-spoilers.spec.ts` (`1/1`). UI dedicada de timeline interativa pendente de curadoria publicada.                                                                                 |
| **26** | AdaptationLab (Motor de Mapeamento e Cobertura)         | `IMPLEMENTADO` | `apps/api/src/modules/adaptation/engine.ts`, classificação honesta (`UNKNOWN` ≠ `OMITTED`), suporte a anime-original/remakes/especiais, `adaptation-lab.spec.ts` (`3/3`).                                                                                                                                   |
| **27** | Governança Editorial, RBAC, Optimistic Lock & Auditoria | `IMPLEMENTADO` | Migração `0002_editorial_governance.sql` aplicada ao PG real, máquina de estados (`state-machine.ts`), `onRequest` fail-closed `401`, RBAC `403`, conflito `409`, gate de direitos `422`, `editorial-governance.spec.ts` (`1/1`). Provedor OIDC/sessão externa ainda não acoplado (fail-closed proposital). |

## 2. Verificação das Jornadas A–F

- **Jornada A (Catálogo & Dados Locais):** `APROVADO` — PostgreSQL 17 `healthy`, 3 migrações aplicadas (`0000`, `0001`, `0002`, `pending: []`), 38.519 obras carregadas, busca ASCII e Unicode (`カウボーイ`) funcionando com índices trigram/B-tree, paginação determinística e tratamento de imagens/URLs.
- **Jornada B (StudioGraph):** `APROVADO` — Filtros por modo/estúdio/ano, expansão incremental de vizinhos, alternativa tabular acessível, `ResizeObserver` com cleanup, limite estrito `<= 80` nós.
- **Jornada C (Dados Editoriais):** `APROVADO` — Endpoints `/api/v1/editorial/sources` e `/api/v1/anime/:id/editorial`, falha de provedor isolada do catálogo local, sem segredos em logs.
- **Jornada D (LoreGraph & Spoilers):** `APROVADO (Backend/Contratos)` — Bloqueio de spoilers futuros verificado em grafo, busca textual, ID direto (`403`) e progresso incompatível; zero rascunho (`DRAFT`) exposto.
- **Jornada E (AdaptationLab):** `APROVADO (Motor/Política)` — Mapeamento episódio↔capítulo com cobertura contextualizada, `UNKNOWN` nunca rotulado como `OMITTED`, `ANIME_ORIGINAL` explícito.
- **Jornada F (Curadoria):** `PARCIAL (Fail-Closed Seguro)` — Backend RBAC, lock otimista (`409`), proibição de autoaprovação, gate de licença (`422`) e auditoria append-only verificados; integração com provedor OIDC/UI administrativa depende de decisão de infraestrutura de identidade.

## 3. Checklist de Segurança & Conformidade

- [x] `.env` ignorado pelo Git (`git check-ignore -v .env` -> `.gitignore:6:.env`).
- [x] Zero credenciais padrão (`admin/admin`) ou bypass de autenticação.
- [x] Rotas `/api/v1/admin/*` protegidas por hook `onRequest` fail-closed (`401` antes da validação de schema do corpo, prevenindo _schema oracle_).
- [x] Rotas públicas do MVP sem endpoints de escrita/ingestão (`POST /api/v1/anime` -> `404`).
- [x] Headers de segurança (`@fastify/helmet`), rate limit (`@fastify/rate-limit`), RFC 7807 Problem Details e redação Pino (`authorization`, `cookie`, `token`).
- [x] Zero replicação permanente de dados AniList/MangaUpdates no PostgreSQL; políticas documentadas em `docs/data-sources/`.
- [x] Regras AST ESLint (`tooling/eslint-plugin-animeverse.mjs`) e `pnpm lint` passando com 0 erros e 0 violações feature-based/zoneless/OnPush.

## 4. Matriz de Riscos e Pendências

| ID           | Severidade | Componente                                            | Descrição                                                                                                                                                                                  | Ação / Status                                                                                                                 |
| ------------ | ---------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `RISK-28-01` | **ALTO**   | `apps/api/src/modules/editorial-governance/routes.ts` | Chamada sem autenticação com payload fora do schema retornava `400` antes de `401` (_schema oracle_).                                                                                      | **CORRIGIDO** nesta fase via hook `onRequest` fail-closed.                                                                    |
| `RISK-28-02` | **MÉDIO**  | Testes E2E Browser                                    | Playwright não está instalado no workspace; validação atual cobre Vitest + `fastify.inject` + PostgreSQL real (`47/47` testes).                                                            | **PENDENTE** — instalar Playwright e executar suíte browser desktop/mobile/a11y antes de release pública com UI de curadoria. |
| `RISK-28-03` | **MÉDIO**  | `editorial-governance` Auth                           | Autenticador padrão é `failClosedAuthenticator` (seguro); exige provedor OIDC/sessão real para habilitar curadoria em produção.                                                            | **PENDENTE** — decisão humana de provedor de identidade (Auth0/Keycloak/GitHub OIDC).                                         |
| `RISK-28-04` | **BAIXO**  | Busca textual `ILIKE` em 38.519 obras                 | Latência medida em API ao vivo: `p50 = 146.29 ms` (`q=bebop`), `p50 = 168.09 ms` (`q=カウボーイ`). Aceitável para MVP, porém pode ser reduzida com `tsvector`/trigram composto no pós-MVP. | **DOCUMENTADO** — otimização evolutiva.                                                                                       |
