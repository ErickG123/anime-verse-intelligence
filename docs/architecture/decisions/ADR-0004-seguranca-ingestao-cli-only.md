# ADR-0004 — Segurança da Ingestão: CLI Local Exclusiva no MVP

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

O MVP não possui autenticação de usuários nem painel administrativo com RBAC. Expor um endpoint HTTP `POST /ingest` sem autenticação criaria vetor crítico de DoS, injeção de dados arbitrários ou sobrecarga de banco.

## Alternativas consideradas

1. Endpoint HTTP protegido por API key estática em header: aumenta superfície de ataque HTTP e risco de vazamento acidental para o frontend.
2. CLI local executada pelo operador/CI (`pnpm --filter @animeverse/api ingest -- --file <path>`): zero superfície HTTP de escrita no MVP.

## Decisão e motivação

Executar toda ingestão exclusivamente via CLI local em `apps/api/src/cli/`, conectada diretamente ao PostgreSQL via `DATABASE_URL` em variáveis de ambiente. A API HTTP do MVP permanece estritamente **read-only** (`GET`).

## Consequências e trade-offs

- **Prós:** elimina superfície de escrita não autenticada, permite streaming direto de arquivos locais e execução segura em pipelines agendados.
- **Contras:** não há botão "Importar agora" na interface web do MVP (o Observatório de Fontes exibe o histórico e o comando CLI correspondente).

## Reversão / plano de migração

No pós-MVP, caso seja necessário disparo remoto, criar ADR específico exigindo autenticação forte, RBAC e fila assíncrona.

## Referências e validações

- `AGENTS.md` (Restrições de dados e segurança), `SPEC-0002-ingestao.md` (`RF-0009`).
