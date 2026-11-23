---
name: repository-audit
description: Audita a estrutura do repositório AnimeVerse Intelligence (arquivos órfãos, código sem uso, configurações redundantes, fronteiras de workspaces e artefatos versionados indevidamente) em modo somente leitura.
---

# Skill: `repository-audit`

## Objetivo

Inspecionar a saúde estrutural do monorepo em modo **somente leitura** e produzir recomendações classificadas por confiança (`ALTA`, `MÉDIA`, `BAIXA`) sem executar exclusões automáticas.

## Quando usar

- Antes de limpezas ou refatorações estruturais.
- Após concluir ciclos de fases para detectar arquivos duplicados ou artefatos gerados versionados.

## Procedimento e comandos reais

1. Executar `pnpm audit:repo` para inventariar arquivos, checar artefatos proibidos (`.env`, `dist/`, `*.dump`) e confirmar integridade das migrações SQL.
2. Executar `pnpm lint` para verificar fronteiras arquiteturais via `tooling/eslint-plugin-animeverse.mjs`.
3. Classificar candidatos como `KEEP`, `MOVE`, `MERGE`, `DELETE` ou `REVIEW` (nunca excluir apenas por ausência de import textual).

## Regras de segurança

- Modo somente leitura por padrão.
- Nunca executar `git clean -fdx`, `docker compose down -v` ou remover migrações históricas/ADRs/relatórios.
