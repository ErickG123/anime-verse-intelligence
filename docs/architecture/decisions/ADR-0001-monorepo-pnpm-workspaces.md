# ADR-0001 — Monorepo com pnpm workspaces (sem Nx/Turborepo no MVP)

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

O projeto possui duas aplicações (`apps/web` em Angular 22 e `apps/api` em Fastify 5) e um pacote compartilhado de contratos HTTP (`packages/contracts`). Precisamos de instalação única na raiz, tipagem compartilhada sem acoplamento de persistência e compatibilidade limpa com Windows 11/PowerShell.

## Alternativas consideradas

1. Repositórios separados (multirepo): aumenta atrito para sincronizar contratos HTTP e CI.
2. Monorepo com Nx ou Turborepo: adiciona complexidade de cache/plugins desnecessária para 3 pacotes no MVP.
3. Monorepo nativo com `pnpm-workspace.yaml` e scripts `pnpm -r`: simples, rápido, padronizado e sem lock-in.

## Decisão e motivação

Adotar `pnpm workspaces` nativo com `apps/web`, `apps/api` e `packages/contracts`. `packages/contracts` exporta somente tipos/contratos de transporte HTTP, jamais schemas Drizzle ou migrações.

## Consequências e trade-offs

- **Prós:** uma única instalação na raiz (`pnpm install`), lockfile único, execução paralela/recursiva simples, zero overhead de orquestrador extra.
- **Contras:** se o repositório crescer muito no pós-MVP, cache remoto pode exigir adoção futura de Turborepo/Nx (facilmente adicionável sobre pnpm workspaces).

## Reversão / plano de migração

Adicionar `turbo.json` ou `nx.json` sem alterar a estrutura de pastas `apps/*` e `packages/*`.

## Referências e validações

- `docs/ENVIRONMENT.md` (`pnpm 11.17.0` validado localmente).
