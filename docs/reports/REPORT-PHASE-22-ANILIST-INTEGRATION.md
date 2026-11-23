# Relatório Final — Fase 22: Integração AniList, Enriquecimento de Dados e Expansão do StudioGraph

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Status geral:** **CONCLUÍDO**

---

## A. Diagnóstico inicial

- **Fase 21 verificada e concluída:** `38.519` animes e `138.093` relações da release oficial `2026-47` importados no PostgreSQL 17 com `0` rejeições, `0` duplicatas, `0` conflitos e idempotência comprovada (`createdCount: 0, updatedCount: 0, unchangedCount: 38519` na 2ª execução).
- Auditoria inicial registrada em [AUDIT-PHASE-22-ANILIST-INTEGRATION.md](../audits/AUDIT-PHASE-22-ANILIST-INTEGRATION.md).

---

## B. Política AniList

- Documentada em [ANILIST-SOURCE-POLICY.md](../data-sources/ANILIST-SOURCE-POLICY.md) e [ADR-0009](../architecture/decisions/ADR-0009-integracao-anilist-consulta-sob-demanda.md) com base em `docs.anilist.co/guide/terms-of-use` e `docs.anilist.co/guide/rate-limiting`:
  - **Rate limit real confirmado no smoke test:** `X-RateLimit-Limit: 30` req/min → rate limiter local configurado conservadoramente em **`25 req/min`** e `maxConcurrent = 2`.
  - **Persistência permanente no PostgreSQL:** **PROIBIDA** (`storagePolicy = 'TRANSIENT_MEMORY_ONLY'`); cache transitório em memória de curto TTL (`300s`, máx. `200` entradas) apenas para proteger o rate limit.
  - **Ativação:** opt-in via `ENRICHMENT_ANILIST_ENABLED` (`false` por padrão no `.env.example`).

---

## C. Implementação e D. Integração

- **Contratos (`packages/contracts/src/index.ts`):** `ExternalIntegrationState`, `AniListMediaOverviewDto`, `AniListCharactersResponseDto`, `AniListStaffResponseDto`, `AniListStudiosResponseDto`, `AniListExternalStatusDto`, `AniListMetricsDto`, e suporte a `kind: 'PERSON'` / `relationType: 'STAFF_ROLE'` em `GraphNodeDto`/`GraphEdgeDto`.
- **Conector modular (`apps/api/src/modules/integrations/anilist/`):**
  - `models.ts`, `queries.ts` (queries GraphQL estáticas e parametrizadas; zero GraphQL arbitrário do cliente).
  - `rate-limiter.ts` (`AniListRateLimiter`: janela deslizante conservadora, controle de concorrência, deduplicação in-flight e cooldown `Retry-After`).
  - `client.ts` (`AniListClient`: timeout `AbortController`, leitura de `X-RateLimit-Remaining`/`Retry-After`, backoff com jitter, circuit breaker, métricas reais de sessão).
  - `mapper.ts` (validação em runtime, sanitização HTML contra XSS e preservação de funções originais).
  - `identity-resolver.ts` (prioridade para `external_reference` `provider='anilist'` + avaliador de sugestões que sinaliza ambiguidade em remakes/temporadas sem auto-vincular).
  - `service.ts` e `routes.ts`:
    - `GET /api/v1/anime/:id/external-status`
    - `GET /api/v1/anime/:id/external/anilist`
    - `GET /api/v1/anime/:id/characters?page=1&perPage=15`
    - `GET /api/v1/anime/:id/staff?page=1&perPage=15`
    - `GET /api/v1/anime/:id/studios`
    - `GET /api/v1/anime/:id/studio-graph-staff?limit=20`
    - `GET /api/v1/data-sources/anilist/metrics`

---

## E. Frontend Angular 22

- Página de detalhe do anime (`apps/web/src/app/features/catalog/pages/anime-detail/`): seção de enriquecimento sob demanda exibindo status externo, Personagens + Dubladores, Equipe de Produção + Funções e botão para expandir o **StudioGraph** com nós `PERSON` (forma losango verde no `CytoscapeGraphComponent`).
- Observatório de Fontes (`apps/web/src/app/features/sources/`): painel em tempo real das métricas da sessão AniList (`requestsTotal`, `rateLimitedCount`, `cacheHits`, `avgLatencyMs`).
- Traduções `pt-BR.json` e `en.json` expandidas com 100% de paridade validada.

---

## F. Testes e Smoke Test Real

- **Suíte automatizada (`pnpm test`):** `15/15` arquivos, **`35/35` testes aprovados** (incluindo `apps/api/test/anilist-integration.spec.ts` com 5 testes cobrindo remakes/ambiguidade, XSS sanitization, modo `DISABLED`, mapeamento/paginação/cache/StudioGraph, e resiliência `429 Retry-After`, `403`, `500`, GraphQL errors e payload malformado).
- **Smoke test controlado ao vivo (1 única consulta em `https://graphql.anilist.co`):**
  - `HTTP/1.1 200 OK`, `X-RateLimit-Limit: 30`, `X-RateLimit-Remaining: 29`.
  - Resposta verificada: `{"data":{"Media":{"id":1,"format":"TV","status":"FINISHED","title":{"romaji":"Cowboy Bebop"}}}}`.

---

## G/H. Qualidade e Pendências

- **CONCLUÍDO:** `pnpm lint` (0 erros AST/ESLint), `pnpm typecheck` (3/3), `pnpm build` (3/3, `79.65 kB` initial transfer), `pnpm test` (`35/35`), PostgreSQL 17 com `38.519` animes, smoke test AniList 1-query.
- **PENDENTE:** Suíte E2E em navegador real (Playwright) para inspeção visual automatizada desktop/mobile.
