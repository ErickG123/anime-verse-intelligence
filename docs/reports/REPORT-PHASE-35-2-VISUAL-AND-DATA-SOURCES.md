# Relatório — Fase 35.2: Redesign Avançado, Enriquecimento Multisource e Ativação das Integrações

**Data:** 2026-11-23  
**Status:** **CONCLUÍDO** (`pnpm validate:all` PASS, smoke tests reais AniList + Wikidata + MangaUpdates aprovados, `56/56` testes Playwright E2E PASS).  
**Auditoria de origem:** [AUDIT-PHASE-35-2-VISUAL-AND-DATA-SOURCES.md](../audits/AUDIT-PHASE-35-2-VISUAL-AND-DATA-SOURCES.md)

---

## 1. Redesign de `/catalog/:id` e `/relations`

- **Cabeçalho e Metadados (`/catalog/:id`):**
  - Poster tipográfico com monograma e tag de formato, pills semânticos de formato, status traduzido (`Finalizado`/`Finished`) e nota formatada (`★ 8.21 / 10` via `DecimalPipe`).
  - Temporada e ano formatados por idioma (`Inverno • 2018` / `Winter • 2018`).
  - Hub de navegação direta para **Grafo de Relações**, **StudioGraph**, **LoreGraph** e **AdaptationLab**.
- **Organização de Seções:**
  - **Estúdios & Produtoras:** separados visualmente entre `STUDIO` e `PRODUCER` com chips clicáveis para o `/studios`.
  - **Títulos alternativos:** limitados aos 6 primeiros por padrão com botão expansível `"Ver todos os títulos (+N)"` / `"Mostrar menos"`.
  - **Referências externas:** rotuladas honestamente como `"Referências externas (importadas do snapshot)"` em badges compactos por provedor.
  - **Obras relacionadas:** grid de cards navegáveis com rótulo traduzido `"Relação não classificada"` (sem repetir `UNSPECIFIED` cru).
- **Busca direta em `/relations`:**
  - Adicionado formulário de busca de obras diretamente no cabeçalho de `/relations` (`RelationsService.searchAnimeWorks`), permitindo selecionar e carregar qualquer rede sem precisar voltar ao catálogo.

## 2. Ativação e Smoke Tests Reais das Integrações

| Fonte                    | Configurada | Autorizada | Teste Real                        | Funcional | Bloqueio                                                         |
| ------------------------ | ----------- | ---------- | --------------------------------- | --------- | ---------------------------------------------------------------- |
| `anime-offline-database` | Sim         | Sim        | `38.519` animes (`2026-47`)       | **Sim**   | Nenhum                                                           |
| `AniList`                | Sim         | Sim        | `HTTP 200` (`242 ms`, `15` chars) | **Sim**   | Cache transitório; zero replicação PG                            |
| `Wikidata`               | Sim         | Sim        | `HTTP 200` (`636 ms`, `Q8003`)    | **Sim**   | Somente dados CC0; imagens excluídas                             |
| `MangaUpdates`           | Sim         | Sim        | `HTTP 200` (`/editorial/sources`) | **Sim**   | Consulta sob demanda com atribuição                              |
| `TMDB`                   | Sim         | Sim        | `HTTP 200` (`596 ms`, `30991`)    | **Sim**   | Atribuição TMDB obrigatória, token em `.env` local (fora do Git) |
