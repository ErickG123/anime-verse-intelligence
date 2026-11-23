---
name: angular-validation
description: Valida os padrões obrigatórios do Angular 22 no AnimeVerse Intelligence (feature-based ADR-0008, Zoneless, Signals, OnPush, HTML/SCSS/TS separados, i18n, dark/light e build).
---

# Skill: `angular-validation`

## Objetivo

Verificar conformidade arquitetural e de qualidade do frontend `@animeverse/web` reutilizando as regras AST já existentes em `tooling/eslint-plugin-animeverse.mjs`.

## Quando usar

- Após alterações em componentes, serviços, stores, rotas ou estilos em `apps/web/`.

## Procedimento e comandos reais

1. `pnpm validate:architecture` — valida presença das features e governança.
2. `pnpm lint` — executa ESLint + regras AST (`OnPush`, sem `template:`/`styles:` inline, sem export de domínio em `.component.ts`/`.service.ts`).
3. `pnpm --filter @animeverse/contracts build && pnpm --filter @animeverse/web typecheck && pnpm --filter @animeverse/web build`
4. `pnpm --filter @animeverse/web test` — executa testes unitários incluindo `i18n-parity.spec.ts`.

## Critérios de aceite

- `0` erros de lint AST, typecheck, build e testes unitários; `pt-BR`/`en` 100% paritários.
