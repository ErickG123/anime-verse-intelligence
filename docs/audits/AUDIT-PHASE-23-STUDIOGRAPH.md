# Auditoria Inicial — Fase 23: StudioGraph Avançado

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 23 / studiograph-avancado

---

## 1. Confirmação do gate das Fases 21 e 22

- **Fase 21 (Dataset completo `2026-47`):** CONCLUÍDA e verificada no PostgreSQL 17 Docker — `38.519` animes, `7.037` empresas (`company`), `138.093` relações `UNSPECIFIED`, `0` rejeições/duplicatas/conflitos, idempotência 100% comprovada e `EXPLAIN (ANALYZE, BUFFERS)` `< 1 ms`.
- **Fase 22 (Integração AniList sob demanda):** CONCLUÍDA — conector `apps/api/src/modules/integrations/anilist/` implementado com `storagePolicy = 'TRANSIENT_MEMORY_ONLY'` (zero persistência de créditos AniList no PostgreSQL), rate limiter conservador (`25 req/min`), smoke test ao vivo (`HTTP 200`, `X-RateLimit-Limit: 30`) e `35/35` testes passando.

---

## 2. Inventário atual do StudioGraph

- **Backend:** `apps/api/src/modules/studios/` expõe `GET /api/v1/companies/:id` e `GET /api/v1/studios/:id/network` (bipartido simples `company ↔ anime`, sem paginação incremental de vizinhos, sem filtros por período/papel no grafo, sem modalidade explícita `PRODUCTION`/`COLLABORATION`).
- **Frontend:** `apps/web/src/app/features/studios/` lista empresas e renderiza grafo básico via `shared/components/cytoscape-graph/cytoscape-graph.component.ts` (que ainda não possui `ResizeObserver`, diferenciação por forma geométrica para todos os 4 tipos de nó, expansão incremental de vizinhos, painel de detalhes do nó selecionado ou busca de nó no subgrafo).
- **Banco de dados:** nenhuma migração ou tabela especulativa de grafo é necessária — `company`, `anime_company(anime_id, company_id, role)` e `anime` (com índices existentes) suportam integralmente o modo **Produção**, e o modo **Colaboração** utiliza exclusivamente consultas sob demanda ao conector AniList quando `ENRICHMENT_ANILIST_ENABLED=true`.

---

## 3. Política de fontes e riscos

- **Produção (`LOCAL_DB`):** proveniente de `cedya77/anime-offline-database` (ODbL 1.0 / DbCL 1.0) — empresas e papéis `STUDIO`/`PRODUCER` verificados.
- **Colaboração (`ANILIST_ON_DEMAND`):** proveniente sob demanda da API GraphQL do AniList — nunca armazenada permanentemente no PostgreSQL; desabilitada com aviso transparente quando `ENRICHMENT_ANILIST_ENABLED=false` ou quando o anime não possui `external_reference` AniList.
- **Limites obrigatórios:** `defaultLimit = 30`, `maxLimit = 80` nós/vizinhos por página para proteger API e navegador (incluindo mobile).
