---
name: e2e-validation
description: Executa e valida testes E2E em navegadores reais (Chromium, Firefox, WebKit e Mobile) via Playwright contra Angular 22 + Fastify 5 + PostgreSQL 17 isolado.
---

# Skill: `e2e-validation`

## Objetivo

Comprovar fluxos ponta a ponta em navegadores reais (catálogo, detalhes, grafos, fontes, responsividade, acessibilidade, resiliência e fail-closed admin).

## Pré-requisitos

- PostgreSQL 17 isolado ativo (`compose.validation.yaml` ou CI).
- API Fastify (`127.0.0.1:3000`) e Angular (`127.0.0.1:4200`) acessíveis.

## Procedimento e comandos reais

1. Smoke desktop Chromium: `pnpm test:e2e:smoke`
2. Matriz completa (`chromium`, `firefox`, `webkit`, `mobile-chromium`): `pnpm test:e2e`
3. Inspecionar relatório em caso de falha: `pnpm --filter @animeverse/web test:e2e:report`

## Regras de integridade

- Nunca declarar E2E aprovado com base apenas em Vitest ou `fastify.inject`.
