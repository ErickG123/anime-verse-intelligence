---
name: fastify-validation
description: Valida a integridade da API Fastify 5 no AnimeVerse Intelligence (rotas, schemas TypeBox, OpenAPI, Problem Details, health/readiness, degradação graciosa e testes).
---

# Skill: `fastify-validation`

## Objetivo

Garantir que `@animeverse/api` mantém contratos TypeBox/OpenAPI íntegros, tratamento RFC 7807 e isolamento de falhas de provedores externos.

## Quando usar

- Após alterações em rotas, serviços, plugins ou contratos em `apps/api/` ou `packages/contracts/`.

## Procedimento e comandos reais

1. `pnpm --filter @animeverse/contracts build && pnpm --filter @animeverse/api typecheck && pnpm --filter @animeverse/api build`
2. `pnpm --filter @animeverse/api test` — executa suíte Vitest com `fastify.inject`.
3. Com API ativa: validar `GET /api/v1/health`, `GET /api/v1/ready` e `GET /docs/json`.

## Critérios de aceite

- Todos os testes da API passando sem chamadas de rede externa por padrão; zero escrita pública no MVP.
