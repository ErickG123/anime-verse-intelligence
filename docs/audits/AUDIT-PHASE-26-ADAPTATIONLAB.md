# Auditoria Inicial — Fase 26: AdaptationLab

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 26 / adaptationlab  
**Pré-requisito verificado (Fase 25):** CONCLUÍDO — motor backend de spoilers validado com suíte negativa (`loregraph-spoilers.spec.ts`).

---

## 1. Reaproveitamento e invariantes

- Reaproveita `0001_lore_adaptation_foundation.sql` (`manga_work`, `manga_chapter`, `anime_episode`, `adaptation_mapping`) e `apps/api/src/modules/lore/curation.ts`.
- Invariantes obrigatórias: mapeamento N:M (vários capítulos em 1 episódio, capítulos `0` e extras `12.5`), `UNKNOWN` nunca contado como `OMITTED`, `ANIME_ORIGINAL` distinto de não mapeado, cobertura calculada apenas sobre universo conhecido, filtro backend de spoilers antes de serialização e zero endpoints públicos de escrita antes da Fase 27.
