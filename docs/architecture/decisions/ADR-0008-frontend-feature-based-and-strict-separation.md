# ADR-0008 — Arquitetura Feature-Based no Frontend e Separação Rigorosa de Responsabilidades

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

Durante as fases iniciais do MVP, o frontend `apps/web` foi construído rapidamente com pastas planas em `features/`, alguns tipos/constantes exportados diretamente de `.component.ts`, `.service.ts` e `.interceptor.ts`, e sem `ChangeDetectionStrategy.OnPush` explícito ou regras AST de fronteira no ESLint. Conforme o projeto evolui para o pós-MVP, essa mistura gera acoplamento e dificulta manutenção.

## Alternativas consideradas

1. Manter pastas planas por feature com convenções apenas documentais: sujeito a regressões silenciosas.
2. Adotar Nx/module-boundaries: adiciona infraestrutura desnecessária para um monorepo de 3 pacotes (conforme `ADR-0001`).
3. Organizar `apps/web/src/app/` em arquitetura **feature-based** (`core/`, `layout/`, `shared/`, `features/<feature>/{pages,components,services,models,constants,<feature>.routes.ts}`) com aliases TS (`@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`), `ChangeDetectionStrategy.OnPush` obrigatório, schematics configurados no `angular.json` e plugin ESLint AST local (`tooling/eslint-plugin-animeverse.mjs`).

## Decisão e motivação

Adotar a alternativa 3. A separação estrutural aliada à verificação AST no ESLint garante que nenhum componente tenha `template:`/`styles:` inline, que todos declarem `OnPush`, que modelos/tipos/constantes fiquem em arquivos próprios e que `core/`/`shared/` nunca importem `features/`, nem uma feature importe arquivos internos de outra feature.

## Consequências e trade-offs

- **Prós:** alta coesão, lazy loading previsível, detecção de violações em tempo de lint/CI sem dependência de Nx, zero falsos positivos de regex graças ao uso de AST ESTree.
- **Contras:** exige criação explícita de arquivos `.model.ts`/`.types.ts`/`.constants.ts` ao introduzir novos contratos no frontend.

## Restrições e regras obrigatórias

1. Proibido `template:` e `styles:` inline em `@Component`.
2. Obrigatório `changeDetection: ChangeDetectionStrategy.OnPush` em todos os componentes Angular.
3. Proibido exportar `interface`, `type`, `enum` ou constantes de domínio de `.component.ts` ou `.service.ts`.
4. `core/` e `shared/` não podem importar de `features/`; features não podem importar internos de outras features.
5. Contratos HTTP compartilhados permanecem em `packages/contracts/` como única fonte de verdade.

## Referências e validações

- `docs/audits/AUDIT-web-feature-based-and-repository-organization.md`
- `tooling/eslint-plugin-animeverse.mjs`, `eslint.config.mjs`, `apps/web/angular.json`
