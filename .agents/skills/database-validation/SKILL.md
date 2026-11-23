---
name: database-validation
description: Valida PostgreSQL 17 Docker, migrações Drizzle, extensões (pg_trgm, unaccent), integridade referencial, índices e performance em modo somente leitura por padrão.
---

# Skill: `database-validation`

## Objetivo

Inspecionar a saúde do PostgreSQL 17 e do esquema Drizzle sem executar operações destrutivas.

## Quando usar

- Antes/após migrações, importações ou auditorias de performance (`EXPLAIN ANALYZE`).

## Procedimento e comandos reais

1. Verificar containers sem alterar estado: `docker compose ps`.
2. Verificar migrações (somente leitura): `pnpm --filter @animeverse/api db:status` (exigir `pending: []`).
3. Validar extensões (`pg_trgm`, `unaccent`), contagens e `EXPLAIN (ANALYZE, BUFFERS)` nas buscas críticas.
4. Para reconstrução do zero, usar exclusivamente `compose.validation.yaml` (`Modalidade A`).

## Regras de segurança

- **Nunca** executar `docker compose down -v`, `DROP DATABASE`, `TRUNCATE` ou `drizzle-kit push --force`.
- Se PostgreSQL estiver indisponível, registrar como `BLOQUEADO`.
