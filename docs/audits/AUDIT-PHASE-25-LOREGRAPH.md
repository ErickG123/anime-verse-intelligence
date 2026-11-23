# Auditoria Inicial — Fase 25: LoreGraph e Proteção de Spoilers

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 25 / loregraph  
**Pré-requisito verificado (Fase 24):** CONCLUÍDO — Conectores editoriais MangaUpdates e Wikidata validados com políticas documentadas e matriz de precedência.

---

## 1. Reaproveitamento de infraestrutura existente

- `apps/api/drizzle/0001_lore_adaptation_foundation.sql` já cria `manga_work`, `manga_chapter`, `anime_episode`, `story_arc`, `character`, `story_event`, `event_relation`, `adaptation_mapping` e `curation_review` com `publication_status` e `spoiler_level`.
- `apps/api/src/modules/lore/curation.ts` já possui validações de status e fronteira de spoiler.
- `apps/api/src/modules/lore/routes.ts` já expõe `GET /api/v1/lore/status` (`UNAVAILABLE`, `CLI_ONLY`).
- **Segurança antes da Fase 27:** nenhuma rota pública de mutação/escrita será aberta nesta fase; somente endpoints read-only com filtro rigoroso de spoiler no backend e fixtures sintéticas isoladas exclusivamente nos testes.
