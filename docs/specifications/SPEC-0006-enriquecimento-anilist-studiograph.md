# SPEC-0006 — Enriquecimento Sob Demanda via AniList e Expansão do StudioGraph

**Status:** Aprovado (Fase 22)  
**Prioridade:** Evolução controlada (`P1`)

---

## 1. Requisitos funcionais (RF)

- **`RF-0022` (Resolução de identidade):** priorizar `external_reference` (`provider = 'anilist'`) da obra local; nunca vincular automaticamente correspondências ambíguas por título (temporadas/filmes/remakes).
- **`RF-0023` (Consulta sob demanda de personagens, dubladores, equipe e estúdios):** disponibilizar endpoints read-only paginados (`/api/v1/anime/:id/characters`, `/staff`, `/studios`, `/external/anilist`, `/external-status`, `/studio-graph-staff`) mediados pelo Fastify com validação TypeBox e sem persistir cópia permanente do catálogo AniList no PostgreSQL.
- **`RF-0024` (Rate limiting e deduplicação):** controlar taxa conservadora (`<= 25 req/min`), concorrência (`<= 2`), deduplicação de chamadas simultâneas idênticas, leitura de headers `Retry-After`/`X-RateLimit-Remaining`, tratamento de `429`/`403`/`500`/timeout e circuit breaker.
- **`RF-0025` (Integração Frontend e StudioGraph):** exibir abas/seções de Personagens, Equipe de Produção, Estúdios e Status Externo na página de detalhe, além da expansão sob demanda de profissionais no StudioGraph (nós tipados `ANIME`/`STUDIO`/`PERSON`, sem coleta massiva de filmografia) e métricas de sessão em `/sources`.

## 2. Requisitos não funcionais (RNF)

- **`RNF-0009` (Conformidade legal AniList):** zero armazenamento permanente de dados AniList no banco; atribuição visível; sem GraphQL arbitrário do cliente.
- **`RNF-0010` (Isolamento de falhas):** indisponibilidade do AniList nunca degrada as funcionalidades locais do catálogo.
