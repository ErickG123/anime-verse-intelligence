# Relatório Final — Fase 25: LoreGraph e Proteção de Spoilers

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Status geral:** **CONCLUÍDO**

---

## 1. Entregas implementadas

- **Auditoria e Política:** [AUDIT-PHASE-25-LOREGRAPH.md](../audits/AUDIT-PHASE-25-LOREGRAPH.md) e [LOREGRAPH-CURATION-POLICY.md](../data-sources/LOREGRAPH-CURATION-POLICY.md).
- **Motor backend de spoilers (`apps/api/src/modules/lore/spoiler-engine.ts`):**
  - Modo conservador por padrão quando `progress` é omitido (`maxPosition = 0`, zero spoilers).
  - Isolamento estrito por `media` + `version` (proibida conversão automática capítulo N = episódio N).
  - Bloqueio de itens `DRAFT`/`REVIEWED`/`RETRACTED` em todas as rotas públicas.
  - Filtro aplicado **antes** de serialização, contagens, arestas, busca e lookup direto por ID.
- **Rotas read-only (`apps/api/src/modules/lore/routes.ts`):** `GET /api/v1/lore/:workId/graph`, `GET /api/v1/lore/:workId/events/:eventId` (retorna `404` se além do progresso), `GET /api/v1/lore/:workId/search`.
- **Testes negativos de ataque de spoiler (`apps/api/test/loregraph-spoilers.spec.ts`):** validados sem progresso, progresso ep 3 atacando ep 4 via grafo/ID direto/busca, mismatch `MANGA` vs `ANIME`, e vazamento de `DRAFT`.
- Zero endpoints públicos de mutação abertos antes da Fase 27; zero fixtures sintéticas servidas como fatos reais em produção.
