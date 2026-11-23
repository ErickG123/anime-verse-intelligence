# Relatório — Fase 34: Curadoria Inicial, Cobertura Narrativa e População de Dados Reais

**Data:** 2026-11-23  
**Status:** **CONCLUÍDO** (importador editorial CLI-only com `--dry-run`, gate de direitos, idempotência 100% comprovada, 3 obras reais populadas no PostgreSQL 17 isolado, `0` dados fictícios ou protegidos, `54/54` testes PASS).

---

## A. Obras Selecionadas e Fontes

Documentadas em [INITIAL-CURATION-WORKS.md](../data-sources/INITIAL-CURATION-WORKS.md) e lote [initial-curation-v1.json](../data-sources/initial-curation/datasets/initial-curation-v1.json):

1. **Fullmetal Alchemist: Brotherhood** (`TV`, 64 eps) — adaptação com episódio 1 `ANIME_ORIGINAL` + `DIRECT` + `PARTIAL`.
2. **Death Note** (`TV`, 37 eps) — adaptação `DIRECT` com relações causais (`CAUSES`) e níveis de spoiler `NONE`/`MILD`.
3. **Cowboy Bebop** (`TV`, 26 eps) — **anime-original** (sem mangá de origem; `ANIME_ORIGINAL` honesto, sem capítulos inventados).

## B. Implementação

- `apps/api/src/modules/editorial-governance/curation-importer.ts`: validação de schema, gate de direitos (`rightsStatus === 'VERIFIED'`), bloqueio de self-loops, importação transacional idempotente e registro em `curation_review`.
- `apps/api/src/cli/curation-import.ts` + script `pnpm --filter @animeverse/api curation:import`.
- `apps/api/test/curation-importer.spec.ts`: 3 testes unitários validando lote oficial, bloqueio de direitos e rejeição de self-loops.

## C. Evidências de Execução Real (`animeverse_validation`, PG `17.11`)

- **Dry-run (`--dry-run`):** validou `3` obras e fez `ROLLBACK` limpo (`0` gravações).
- **1ª importação:** `manga_works = 2`, `manga_chapters = 5`, `anime_episodes = 7`, `characters = 6`, `story_arcs = 3`, `story_events = 7`, `event_relations = 4`, `adaptation_mappings = 6`, `curation_reviews = 13`.
- **2ª importação (idempotência):** `0` registros criados em todas as 9 categorias (`0` duplicações).
- **Governança preservada:** `AUTH_MODE=disabled` mantido; zero rotas HTTP públicas de escrita/importação; placeholders `/lore` e `/adaptation` preservados para a próxima fase de UI.
