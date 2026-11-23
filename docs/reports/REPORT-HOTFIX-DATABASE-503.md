# Relatório — HOTFIX: Erro 503, Conexão PostgreSQL e Inicialização Local

**Data:** 2026-11-23  
**Status:** **CONCLUÍDO**  
**Auditoria de origem:** [AUDIT-HOTFIX-DATABASE-503.md](../audits/AUDIT-HOTFIX-DATABASE-503.md)

## Evidências de Correção

- `pnpm --filter @animeverse/api db:status` sem `DATABASE_URL` na sessão: carregou automaticamente o `.env` da raiz e retornou `applied: ["0000_initial.sql", "0001_lore_adaptation_foundation.sql", "0002_editorial_governance.sql"], pending: []`.
- Boot da API (`node apps/api/dist/server.js`) sem variáveis de sessão:
  - `GET /api/v1/ready` -> **`HTTP 200` (`ready`)**
  - `GET /api/v1/anime?page=1&pageSize=20&sortBy=title&sortOrder=asc` -> **`HTTP 200` (`20` itens reais)**
- Bind local seguro em `127.0.0.1:3000`.
- `.env` confirmado fora do controle de versão (`pnpm audit:repo` -> `forbiddenTracked: []`).
