# Auditoria — HOTFIX: Erro 503 no Catálogo, Resolução de `.env` no Monorepo e Bind Loopback

**Data:** 2026-11-23  
**Sintoma observado:** `GET /api/v1/anime?page=1&pageSize=20&sortBy=title&sortOrder=asc` retornava `HTTP 503 Service Unavailable` (`Database connection is not configured for catalog queries.`).

## Causa Raiz Identificada

1. **Resolução de `.env` em pnpm Workspaces:** `pnpm dev:api` executa `tsx watch src/server.ts` com `cwd = apps/api/`. O `import 'dotenv/config'` padrão buscava `.env` apenas em `apps/api/.env`, ignorando o `.env` na raiz do monorepo (`../../.env`).
2. **Ausência de `.env` local configurado:** Não havia `.env` na raiz apontando para o PostgreSQL 17 ativo e populado (`127.0.0.1:55432/animeverse_validation`).
3. **Bind de rede em dev local:** `API_HOST` utilizava `0.0.0.0` como padrão em vez de `127.0.0.1` (loopback).

## Correção Aplicada

- Criado `apps/api/src/config/load-dotenv.ts` para resolver automaticamente `.env` na raiz do monorepo (e opcionalmente `apps/api/.env`) sem sobrescrever variáveis já definidas na sessão.
- Atualizados `apps/api/src/server.ts` e `apps/api/src/db/migrate.ts` para utilizar `load-dotenv.ts`, com aviso claro no boot caso `DATABASE_URL` esteja ausente (sem expor credenciais).
- Alterado default de `API_HOST` em `apps/api/src/config/env.ts` e `.env.example` para `127.0.0.1`.
- Criado `.env` local (ignorado pelo `.gitignore`) apontando para o PostgreSQL 17 ativo (`127.0.0.1:55432/animeverse_validation`, `38.519` animes + curadoria Fase 34).
