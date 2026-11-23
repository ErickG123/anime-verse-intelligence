# Auditoria Inicial — Fase 22: Integração AniList, Enriquecimento e Expansão do StudioGraph

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Pré-requisito verificado (Fase 21):** Dataset completo `cedya77/anime-offline-database` release `2026-47` (`38.519` registros) em conclusão/validação com correção do bug de normalização de URLs com query string (`animenewsnetwork.com/encyclopedia/anime.php?id=...`).

---

## 1. O que já existe e será reaproveitado

- **Identificadores externos no PostgreSQL (`external_reference`):** milhares de animes importados já possuem `provider = 'anilist'` com `external_id` numérico extraído deterministicamente por `url-normalizer.ts`.
- **Governança de fontes (`source-registry.ts` + `GET /api/v1/data-sources`):** `anilist` já está registrado com `permissions.store = false` e `ENRICHMENT_ANILIST_ENABLED=false` em `config/env.ts`.
- **Contratos base de enriquecimento (`apps/api/src/modules/enrichment/contracts.ts`):** `SourceCapabilities`, `FetchPolicy`, `SourceAttribution`, `EnrichmentResult`.
- **API modular Fastify 5 + TypeBox + Problem Details RFC 7807 + Pino redaction.**
- **Frontend Angular 22 feature-based (`apps/web/src/app/`):**
  - `features/catalog/pages/anime-detail/` — pronto para receber abas/seções de Personagens, Equipe de Produção, Estúdios e Status Externo.
  - `features/studios/` + `shared/components/cytoscape-graph/` — pronto para expandir StudioGraph com nós de profissionais (`PERSON`) e arestas de função sob demanda.
  - `features/sources/` — pronto para exibir métricas em tempo real (em memória, da sessão atual da API) da integração AniList.

## 2. O que precisa ser desenvolvido na Fase 22

1. **Política formal AniList (`docs/data-sources/ANILIST-SOURCE-POLICY.md`):** refletindo estritamente os termos oficiais de uso (`docs.anilist.co/guide/terms-of-use`) e rate limiting (`docs.anilist.co/guide/rate-limiting`).
2. **Conector modular AniList (`apps/api/src/modules/integrations/anilist/`):**
   - `client.ts` (`AniListClient`): HTTP POST para `https://graphql.anilist.co` com timeout, `AbortController`, leitura de headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`, backoff exponencial com jitter, circuit breaker e zero GraphQL arbitrário do cliente.
   - `rate-limiter.ts` (`AniListRateLimiter`): limite conservador configurável (padrão `25 req/min`, abaixo do limite temporário documentado de `30 req/min`), controle de concorrência (`maxConcurrent = 2`) e deduplicação de requisições simultâneas in-flight!
   - `queries.ts`: queries GraphQL estáticas e parametrizadas (`Media` com `characters` paginado + `voiceActors`, `staff` paginado com `role`, `studios` com `isMain`, e busca sugestiva controlada).
   - `mapper.ts`: conversão tipada (sem `any`) para contratos internos, sanitização (strip HTML) e preservação de papéis/funções originais.
   - `identity-resolver.ts`: prioridade (1) `external_reference` AniList local → (2) sugestão por título sem auto-vinculação em caso de ambiguidade (remakes/temporadas/filmes).
   - `service.ts`: orquestração com cache transitório em memória de curto TTL (configurável, sem persistência permanente do catálogo/créditos do AniList no PostgreSQL!) e telemetria real da sessão (consultas, falhas, 429s, latência média).
   - `routes.ts`: endpoints read-only sob `/api/v1/anime/:id/external/anilist`, `/api/v1/anime/:id/characters`, `/api/v1/anime/:id/staff`, `/api/v1/anime/:id/studios`, `/api/v1/anime/:id/external-status`, `/api/v1/anime/:id/studio-graph-staff` e `/api/v1/data-sources/anilist/metrics`.
3. **Frontend Angular (`apps/web`):**
   - Enriquecimento na página de detalhe do anime (`Personagens`, `Equipe de Produção`, `Estúdios` e `Status Externo`) com todos os estados honestos (`loading`, `ready`, `disabled`, `unlinked`, `rate_limited`, `unavailable`, `error`).
   - Expansão sob demanda do StudioGraph com profissionais verificados (limitada e sem coleta massiva de filmografia).
   - Painel de acompanhamento da fonte AniList em `/sources`.

## 3. Riscos e decisões críticas

- **Proibição de replicação/storage permanente:** conforme `docs.anilist.co/guide/terms-of-use`, NÃO persistiremos personagens, dubladores ou créditos completos do AniList no PostgreSQL; apenas consulta sob demanda mediada pelo Fastify com cache transitório em memória (TTL curto) para proteger o rate limit!
- **Resiliência:** se AniList estiver desabilitado (`ENRICHMENT_ANILIST_ENABLED=false`) ou indisponível (`429`/`500`/timeout), o catálogo local continua 100% operacional.
