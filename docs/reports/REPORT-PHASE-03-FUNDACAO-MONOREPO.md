# Relatório — Fase 03: Scaffolding do monorepo e ferramentas

**Data:** 2026-11-23  
**Status:** APROVADO

---

## 1. Escopo planejado e execução real

- Criado monorepo nativo com `pnpm-workspace.yaml` contendo `apps/web` (Angular 22.0.2 standalone, zoneless, sem `zone.js`, Signals, `.ts`/`.html`/`.scss` separados), `apps/api` (Fastify 5, ESM, TypeScript 6.0.3 strict, `/api/v1/health`) e `packages/contracts` (tipos HTTP compartilhados sem schemas de banco).
- Configurados `.npmrc`, `.node-version`, `.nvmrc`, `.editorconfig`, `.gitignore`, `.gitattributes`, `.prettierrc`, `.prettierignore`, `eslint.config.mjs`, `tsconfig.base.json`, `.env.example` e Husky (`pre-commit` com `lint-staged`, `commit-msg` com Conventional Commits).
- Nenhuma ferramenta desnecessária (Nx/Turborepo) foi introduzida.

## 2. Arquivos criados/alterados

- Raiz: `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`, `.npmrc`, `.node-version`, `.nvmrc`, `.editorconfig`, `.gitignore`, `.gitattributes`, `.prettierrc`, `.prettierignore`, `.env.example`, `tsconfig.base.json`, `eslint.config.mjs`, `.husky/pre-commit`, `.husky/commit-msg`.
- `packages/contracts/`: `package.json`, `tsconfig.json`, `src/index.ts`, `test/contracts.spec.ts`.
- `apps/api/`: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/app.ts`, `src/server.ts`, `test/health.spec.ts`.
- `apps/web/`: projeto Angular 22 gerado via `ng new` e adaptado (`@animeverse/web`, `typecheck`, `ng test --watch=false`, `app.ts`/`app.html`/`app.scss`/`app.spec.ts`).

## 3. Validações executadas

| Comando          | Resultado real                                                                       | Classificação |
| ---------------- | ------------------------------------------------------------------------------------ | ------------- |
| `pnpm install`   | `Done in 4.2s using pnpm v11.17.0` (4 workspace projects, `allowBuilds` configurado) | **APROVADO**  |
| `pnpm build`     | `contracts` + `api` + `web` (`191.53 kB` raw / `52.26 kB` transfer)                  | **APROVADO**  |
| `pnpm typecheck` | 3/3 projetos aprovados em TS 6.0.3 strict                                            | **APROVADO**  |
| `pnpm lint`      | 0 erros ESLint (`@typescript-eslint/no-explicit-any: error`)                         | **APROVADO**  |
| `pnpm test`      | `contracts` (1/1), `api` (1/1), `web` (2/2) — todos Vitest 4 passando                | **APROVADO**  |

## 4. Próxima fase

- **Fase 04 — Infraestrutura PostgreSQL e migrações** (`prompts/PROMPT-04-postgres-docker-drizzle.md`).
