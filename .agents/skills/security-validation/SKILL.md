---
name: security-validation
description: Valida controles de segurança do AnimeVerse Intelligence: fail-closed 401 em /api/v1/admin/* antes do schema, OIDC BFF + PKCE + CSRF, RBAC, anti-spoiler no payload, headers e rate-limit.
---

# Skill: `security-validation`

## Objetivo

Verificar controles de segurança em profundidade no backend e frontend sem confiar em um único cenário de teste.

## Quando usar

- Após mudanças em autenticação, autorização, rotas admin, LoreGraph anti-spoiler, CORS ou plugins de segurança.

## Procedimento e comandos reais

1. `pnpm --filter @animeverse/api test -- security editorial-governance oidc-auth loregraph-spoilers`
2. Verificar que `POST /api/v1/admin/reviews/:id/decisions` sem sessão + payload malformado retorna `401` (hook `onRequest` antes da validação de schema).
3. Verificar que `POST /api/v1/anime` retorna `404` e que `.env` não está rastreado no Git (`pnpm audit:repo`).

## Critérios de aceite

- Zero vazamento de spoilers no payload HTTP; `401`/`403`/`409`/`422` preservados; zero credenciais padrão.
