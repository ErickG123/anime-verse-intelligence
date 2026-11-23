# Auditoria — Fase 35.2: Redesign Avançado (`/catalog/:id`, `/relations`) e Ativação Multisource

**Data:** 2026-11-23  
**Escopo:** Evolução visual profunda da página de detalhes (`/catalog/:id`) e relações (`/relations`), mais ativação e smoke test real dos conectores autorizados (AniList, Wikidata, MangaUpdates).

## Matriz de Integrações Multisource

| Fonte                    | Configurada | Autorizada  | Teste Real | Funcional | Bloqueio / Política                                                    |
| ------------------------ | ----------- | ----------- | ---------- | --------- | ---------------------------------------------------------------------- |
| `anime-offline-database` | Sim         | Sim (ODbL)  | **PASS**   | **Sim**   | `38.519` obras e `138.093` relações no PostgreSQL 17                   |
| `AniList`                | Sim         | Sim (TOS)   | **PASS**   | **Sim**   | Sob demanda (`25 req/min`, cache transitório, `Spike Spiegel` `242ms`) |
| `Wikidata`               | Sim         | Sim (CC0)   | **PASS**   | **Sim**   | Sob demanda (`Q8003` _Cowboy Bebop_ reconciliado em `636ms`)           |
| `MangaUpdates`           | Sim         | Sim (APIv1) | **PASS**   | **Sim**   | Sob demanda com atribuição e reconciliação de conflitos                |
| `TMDB`                   | Sim         | Sim (APIv3) | **PASS**   | **Sim**   | Sob demanda (`tmdbId: 30991` _Cowboy Bebop_ `HTTP 200` em `596ms`)     |
