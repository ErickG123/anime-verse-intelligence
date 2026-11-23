---
name: data-integrity-validation
description: Valida o pipeline anime-offline-database, idempotência, relações UNSPECIFIED, integridade referencial, proveniência e políticas legais de AniList, MangaUpdates e Wikidata.
---

# Skill: `data-integrity-validation`

## Objetivo

Garantir integridade factual, proveniência e conformidade de licenças (ODbL/DbCL, CC0, consulta sob demanda sem replicação permanente).

## Quando usar

- Após importação/reimportação de snapshot JSONL ou alteração em conectores de enriquecimento.

## Procedimento e comandos reais

1. Validar testes de governança e parser: `pnpm --filter @animeverse/api test -- source-governance ingestion-parser editorial-sources anilist-integration`.
2. Em banco isolado, verificar idempotência (`createdCount = 0`, `updatedCount = 0`), `self_refs = 0`, `dup_ext_refs = 0` e separação entre catálogo real e fixtures.
3. Confirmar que `UNKNOWN` nunca é promovido a `VERIFIED` ou `OMITTED` sem evidência.

## Regras de segurança

- Não executar coleta massiva não autorizada em APIs externas.
