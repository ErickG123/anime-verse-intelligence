---
name: release-readiness
description: Executa auditoria completa de prontidão para release do AnimeVerse Intelligence e produz classificação fundamentada (GO, CONDITIONAL-GO ou NO-GO) sem publicar automaticamente.
---

# Skill: `release-readiness`

## Objetivo

Consolidar evidências de build, testes, banco, backup/restore, segurança, licenças e documentação para emissão de parecer `GO`, `CONDITIONAL-GO` ou `NO-GO`.

## Procedimento e comandos reais

1. Executar `pnpm validate:all` (repo + docs + architecture + lint + build + typecheck + test).
2. Executar `pnpm test:e2e` (ou registrar bloqueio explícito se navegador indisponível).
3. Conferir `docs/operations/RELEASE-CHECKLIST.md`, backup/restore verificado e estado de `AUTH_MODE`.

## Regras de segurança

- Nunca publicar tags, criar releases ou executar deploy em produção sem autorização humana explícita.
