# Auditoria — Fase 29: Playwright E2E Real, Matriz de Navegadores e Regressão de Segurança

**Data:** 2026-11-23  
**Baseline:** `0.1.0-rc.1` (`21/21` arquivos de teste, `47/47` testes Vitest passando, `0` testes browser E2E).

---

## 1. Inventário de Rotas Efetivas do Frontend (`apps/web/src/app/app.routes.ts`)

| Rota           | Componente / Feature             | Estado Real                                                     |
| -------------- | -------------------------------- | --------------------------------------------------------------- |
| `/`            | Redirect -> `/catalog`           | Implementada                                                    |
| `/catalog`     | `CatalogListPageComponent`       | Implementada (busca, filtros, ordenação, paginação)             |
| `/catalog/:id` | `AnimeDetailPageComponent`       | Implementada (detalhe, fontes, relações, AniList sob demanda)   |
| `/relations`   | `RelationsPageComponent`         | Implementada (Cytoscape + tabela acessível)                     |
| `/studios`     | `StudiosPageComponent`           | Implementada (StudioGraph modos, filtros, caminho mínimo)       |
| `/sources`     | `SourcesPageComponent`           | Implementada (observatório read-only + runs)                    |
| `/lore`        | `ModulePlaceholderPageComponent` | Placeholder honesto (motor backend pronto, UI editorial futura) |
| `/adaptation`  | `ModulePlaceholderPageComponent` | Placeholder honesto (motor backend pronto, UI editorial futura) |
| `/about`       | `AboutPageComponent`             | Implementada (atribuição ODbL/DbCL e governança)                |
| `/**`          | Redirect -> `/catalog`           | Fallback seguro                                                 |

---

## 2. Lacunas e Riscos Identificados

1. **Ausência de suíte browser E2E real:** Apenas testes unitários (`jsdom`) e `fastify.inject` existiam até a Fase 28.
2. **Cross-browser e mobile:** Nenhuma verificação automatizada em Chromium, Firefox e WebKit, nem em viewport mobile (`390x844`).
3. **Verificação de payload HTTP anti-spoiler e fail-closed:** Necessário validar via `request` do Playwright contra a API real rodando com PostgreSQL 17 que `/api/v1/admin/*` retorna `401` antes do schema e que rotas de leitura/LoreGraph não vazam dados protegidos.
4. **CI GitHub Actions:** `.github/workflows/ci.yml` executa `lint`, `typecheck`, `build` e `test`, mas ainda não possui job E2E Playwright.

---

## 3. Plano de Execução da Fase 29

1. Instalar `@playwright/test` em `apps/web` e binários `chromium`, `firefox`, `webkit`.
2. Configurar `apps/web/playwright.config.ts` com projetos `chromium`, `firefox`, `webkit` e `mobile-chromium` (`390x844`), `webServer` apontando para API Fastify + Angular dev/static server contra banco PostgreSQL 17 isolado (`127.0.0.1:55432`).
3. Criar suítes determinísticas em `apps/web/e2e/`:
   - `catalog.spec.ts`: carregamento sem erros JS, listagem paginada, busca textual/Unicode, filtros, detalhe, navegação back/forward e deep links.
   - `graphs-and-sources.spec.ts`: `/relations`, `/studios` (Cytoscape + tabela acessível), `/sources`, `/lore`, `/adaptation`, `/about`.
   - `security-and-spoilers.spec.ts`: verificação direta de payload HTTP contra API real (`/api/v1/admin/*` -> `401` com payload malformado, `POST /api/v1/anime` -> `404`, LoreGraph anti-spoiler e headers de segurança).
   - `resilience-and-a11y.spec.ts`: simulação de falha de API (`500`), estado vazio, navegação por teclado, dark/light toggle, troca de idioma `pt-BR`/`en` e verificação de ausência de overflow horizontal em desktop (`1440x900`) e mobile (`390x844`).
4. Adicionar job `e2e` no `.github/workflows/ci.yml`.
5. Executar a suíte completa nos navegadores instalados e reexecutar o subconjunto crítico duas vezes para verificar ausência de flakiness.
