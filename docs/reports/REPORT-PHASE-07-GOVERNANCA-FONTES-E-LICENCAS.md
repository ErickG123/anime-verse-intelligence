# Relatório — Fase 07: Política de fontes, identificadores e licenças

**Data:** 2026-11-23  
**Status:** APROVADO

---

## 1. Escopo planejado e execução real

- Criada `docs/data-sources/DATA-SOURCE-POLICY.md` documentando `cedya77/anime-offline-database` (ODbL 1.0 / DbCL 1.0, atribuição `cedya77` + `manami-project`), política de imagens externas (URL não equivale a licença), regras de matching por referência externa, proteção SSRF/redirects e plano inativo de futuras APIs (AniList, Wikidata, MangaUpdates, TMDB).
- Criado registry tipado (`apps/api/src/modules/sources/source-registry.ts`) garantindo em runtime (`assertSourceCanStore`) que apenas fontes `ACTIVE` com `permissions.store === true` possam persistir dados.
- Criado normalizador determinístico de URLs e extrator `(provider, externalId)` + validador SSRF (`apps/api/src/modules/sources/url-normalizer.ts`).

## 2. Validações executadas

| Comando                                   | Resultado real                                                         | Classificação |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| `pnpm --filter @animeverse/api typecheck` | 0 erros                                                                | **APROVADO**  |
| `pnpm lint`                               | 0 erros                                                                | **APROVADO**  |
| `pnpm --filter @animeverse/api test`      | 3/3 arquivos, 11/11 testes (incluindo `source-governance.spec.ts` 4/4) | **APROVADO**  |

## 3. Próxima fase

- **Fase 08 — Pipeline completo do anime-offline-database** (`prompts/PROMPT-08-coletor-jsonl-importacao.md`).
