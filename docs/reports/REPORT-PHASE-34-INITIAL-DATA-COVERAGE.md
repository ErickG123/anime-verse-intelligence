# Relatório — Fase 34: Cobertura Inicial de Dados (Antes vs. Depois)

**Data:** 2026-11-23  
**Universo / Denominador do catálogo:** `38.519` animes (`anime-offline-database` `2026-47`).

| Entidade             | Antes (`Phase 33`) | Depois (`Phase 34`) | Obras Cobertas / Universo                             |
| -------------------- | ------------------ | ------------------- | ----------------------------------------------------- |
| `manga_work`         | `0`                | `2`                 | `2` obras adaptadas (`Cowboy Bebop` é anime-original) |
| `manga_chapter`      | `0`                | `5`                 | `2` mangás                                            |
| `anime_episode`      | `0`                | `7`                 | `3 / 38.519` (`0.0078%`)                              |
| `character`          | `0`                | `6`                 | `3 / 38.519` (`0.0078%`)                              |
| `story_arc`          | `0`                | `3`                 | `3 / 38.519` (`0.0078%`)                              |
| `story_event`        | `0`                | `7`                 | `3 / 38.519` (`0.0078%`)                              |
| `event_relation`     | `0`                | `4`                 | `CAUSES` + `PRECEDES` (`0` self-loops)                |
| `adaptation_mapping` | `0`                | `6`                 | `DIRECT` (3), `PARTIAL` (1), `ANIME_ORIGINAL` (2)     |
| `curation_review`    | `0`                | `13`                | Audit trail append-only                               |
