# Auditoria — Arquitetura Feature-Based do Frontend e Governança do Repositório

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Escopo auditado:** `apps/web/`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/`, `docs/`, `bootstrap/`, `prompts/`, `eslint.config.mjs`, `apps/web/angular.json`  
**Última fase SDD executada:** Fase 20 (Ciclo 00–20 concluído + validação ao vivo Docker PostgreSQL concluída em 2026-11-23)

---

## 1. Estrutura atual vs. estrutura recomendada (`apps/web/src/app/`)

### 1.1 Estrutura atual observada

- `app.ts` / `app.html` / `app.scss` acumulam shell de layout, tipo `NavLinkItem` e lista estática de itens de navegação `navItems`.
- `core/` contém `i18n/`, `interceptors/http-error.interceptor.ts` (exportando `interface NormalizedHttpError`), `models/ui-state.model.ts`, `services/theme.service.ts` (exportando `type AppTheme`).
- `shared/components/` contém `app-icon` (exportando `type IconName` dentro do `.component.ts`), `cytoscape-graph`, `pagination-bar`, `state-panel`.
- `features/` contém pastas planas (`about/`, `catalog/`, `placeholder/`, `relations/`, `sources/`, `studios/`) sem subdivisão consistente em `pages/`, `services/`, `models/`, `constants/` e `<feature>.routes.ts`.
- `apps/web/tsconfig.json` não possui path aliases (`@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`), resultando em imports relativos de 2–3 níveis (`../../core/...`, `../../../environments/...`).

### 1.2 Estrutura recomendada (sem over-engineering ou pastas vazias)

```text
apps/web/src/app/
├── core/
│   ├── i18n/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── layout/
│   ├── constants/
│   └── models/
├── shared/
│   ├── components/
│   └── models/
├── features/
│   ├── about/
│   │   └── pages/about/
│   ├── catalog/
│   │   ├── constants/
│   │   ├── models/
│   │   ├── pages/
│   │   │   ├── catalog-list/
│   │   │   └── anime-detail/
│   │   ├── services/
│   │   └── catalog.routes.ts
│   ├── relations/
│   │   ├── pages/relations/
│   │   └── services/
│   ├── sources/
│   │   ├── pages/sources/
│   │   └── services/
│   ├── studios/
│   │   ├── pages/studios/
│   │   └── services/
│   └── unavailable-module/
│       └── pages/unavailable-module/
├── app.config.ts
├── app.routes.ts
└── app.{ts,html,scss,spec.ts}
```

---

## 2. Violações das regras de organização detectadas

| #   | Arquivo                                                                                 | Violação identificada                                                                                                                                      | Ação planejada                                                                                           |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| V1  | Todos os 12 componentes em `apps/web/src/app/`                                          | Ausência de `changeDetection: ChangeDetectionStrategy.OnPush`                                                                                              | Adicionar `ChangeDetectionStrategy.OnPush` em todos os componentes                                       |
| V2  | `apps/web/angular.json`                                                                 | Schematics `@schematics/angular:component` não fixam `inlineTemplate: false`, `inlineStyle: false`, `changeDetection: "OnPush"`                            | Configurar schematics explicitamente                                                                     |
| V3  | `apps/web/src/app/shared/components/app-icon/app-icon.component.ts`                     | `export type IconName` declarado dentro de `.component.ts`                                                                                                 | Extrair para `shared/models/icon-name.types.ts`                                                          |
| V4  | `apps/web/src/app/core/services/theme.service.ts`                                       | `export type AppTheme` declarado dentro de `.service.ts`                                                                                                   | Extrair para `core/models/theme.types.ts`                                                                |
| V5  | `apps/web/src/app/core/interceptors/http-error.interceptor.ts`                          | `export interface NormalizedHttpError` declarado dentro de `.interceptor.ts`                                                                               | Extrair para `core/models/http-error.model.ts`                                                           |
| V6  | `apps/web/src/app/features/catalog/catalog.service.ts`                                  | `export interface RelatedAnimeApiResponse` declarado dentro de `.service.ts`                                                                               | Extrair para `features/catalog/models/catalog.model.ts`                                                  |
| V7  | `apps/web/src/app/features/catalog/catalog.model.ts` + `catalog-list-page.component.ts` | Constante `DEFAULT_CATALOG_FILTERS` misturada em `.model.ts` e arrays de domínio (`animeTypes`, `animeStatuses`, `animeSeasons`) inline no componente      | Extrair para `features/catalog/constants/catalog-filter.constants.ts`                                    |
| V8  | `apps/web/src/app/app.ts`                                                               | `interface NavLinkItem` e lista `navItems` declarados dentro de `app.ts`                                                                                   | Extrair para `layout/models/navigation.model.ts` e `layout/constants/navigation.constants.ts`            |
| V9  | `eslint.config.mjs`                                                                     | Ausência de verificação AST automatizada para inline `template:`/`styles:`, tipos/constantes exportados em componentes/serviços e fronteiras arquiteturais | Criar plugin ESLint AST local (`tooling/eslint-plugin-animeverse.mjs`) e ativá-lo no `eslint.config.mjs` |

---

## 3. Auditoria de `bootstrap/`, `prompts/`, `primpts/` e documentação

| Item                                         | Estado encontrado                                                                                                                                                                                                          | Classificação                             | Decisão                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `primpts/`                                   | Não existe no repositório                                                                                                                                                                                                  | N/A                                       | Nenhuma ação necessária                                                                        |
| `bootstrap/`                                 | Cópia integral do kit inicial (`AGENTS.md`, `GEMINI.md`, `.agents/rules/01..05`, `docs/ROADMAP.md` obsoleto com tudo `Planejado`, `docs/testing/TEST-MATRIX.md` vazio). 100% já promovido e evoluído na raiz e em `docs/`. | **Duplicação redundante / obsoleta**      | Remover `bootstrap/` após confirmar zero conteúdo exclusivo restante e registrar justificativa |
| `prompts/` (`PROMPT-00`..`PROMPT-20`)        | 21 prompts históricos soltos na raiz                                                                                                                                                                                       | **Histórico útil fora do local canônico** | Mover para `docs/agent-workflows/prompts/`                                                     |
| `PROMPT-MESTRE.md` e `CHECKLIST-EXECUCAO.md` | Soltos na raiz                                                                                                                                                                                                             | **Governança de workflow**                | Mover para `docs/agent-workflows/` (`master-prompt.md` e `execution-checklist.md`)             |
| `.agents/rules/01-sdd.md`..`05-tests.md`     | Regras resumidas (3 linhas cada), sem cobrir separação estrita de tipos/constantes, `OnPush` ou governança do repo                                                                                                         | **Incompleto**                            | Consolidar em regras canônicas temáticas em `.agents/rules/` sem duplicação                    |
| `README.md`                                  | Ainda descreve "Este ZIP contém 21 prompts sequenciais..."                                                                                                                                                                 | **Obsoleto**                              | Atualizar `README.md` para documentar o projeto AnimeVerse Intelligence real                   |

---

## 4. Dependências entre módulos e riscos da refatoração

- **Dependências atuais:** nenhuma feature importa outra feature; `shared/` e `core/` não importam `features/`. Essa boa prática será blindada via regra ESLint AST.
- **Riscos:**
  1. Quebra de imports relativos ou paths de assets/specs após movimentação de arquivos → mitigado por `pnpm typecheck`, `pnpm build`, `pnpm test` e `pnpm lint`.
  2. Quebra de rotas públicas (`/catalog`, `/catalog/:id`, `/relations`, `/studios`, `/sources`, `/lore`, `/adaptation`, `/about`) → todas as rotas públicas serão preservadas 100% idênticas.
  3. Perda de histórico de governança ao remover `bootstrap/` → todos os arquivos canônicos já residem na raiz/`docs/` e os prompts históricos serão preservados em `docs/agent-workflows/`.
