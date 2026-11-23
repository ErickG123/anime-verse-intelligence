# ADR-0003 — Contratos de API Fastify 5 com TypeBox, OpenAPI e Problem Details (RFC 7807)

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

A API precisa validar entradas/saídas em runtime com alta performance, gerar documentação OpenAPI fiel ao código e retornar erros consistentes e seguros.

## Alternativas consideradas

1. Zod + adaptador customizado: requer camada extra de conversão para JSON Schema nativo do Fastify.
2. TypeBox (`@sinclair/typebox`) + `@fastify/type-provider-typebox`: produz JSON Schema nativo compatível diretamente com Ajv do Fastify e `@fastify/swagger`.

## Decisão e motivação

Adotar Fastify 5 com TypeBox JSON Schema para todas as rotas `/api/v1/*`, `@fastify/swagger` + `@fastify/swagger-ui` em dev/test, Pino com redaction de campos sensíveis e respostas de erro padronizadas em Problem Details (`application/problem+json`) contendo `code` e `requestId` sem expor stack traces.

## Consequências e trade-offs

- **Prós:** validação e serialização rápidas (Ajv/fast-json-stringify), OpenAPI sempre sincronizado e tipos TS inferidos automaticamente.
- **Contras:** necessidade de manter compatibilidade entre schemas TypeBox na API e DTOs em `packages/contracts`.

## Reversão / plano de migração

Como o contrato HTTP externo é JSON Schema/OpenAPI padrão, qualquer troca interna de validador preserva a compatibilidade dos clientes.

## Referências e validações

- `REFERENCIAS.md` (Fastify 5, `@fastify/swagger`).
