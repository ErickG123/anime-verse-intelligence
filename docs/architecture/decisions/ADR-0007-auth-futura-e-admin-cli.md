# ADR-0007 — Autenticação Futura e Separação de Operações Administrativas

- **Status:** Proposto (para pós-MVP)
- **Data:** 2026-11-23

## Contexto

No MVP, não há autenticação de usuários nem operações HTTP de escrita. No pós-MVP, curadoria web (LoreGraph/AdaptationLab) e disparo remoto de ingestões podem ser desejados.

## Decisão e motivação

Manter o MVP 100% read-only via HTTP e CLI-only para escrita. Qualquer abertura futura de endpoints de escrita exigirá: (1) autenticação OIDC/OAuth2 ou sessões HttpOnly seguras com RBAC (`CURATOR`, `ADMIN`), (2) auditoria completa em `curation_review`, (3) política LGPD documentada caso PII seja armazenado.

## Consequências e trade-offs

Evita implementação prematura de auth no MVP enquanto garante um caminho seguro e auditável para o pós-MVP.
