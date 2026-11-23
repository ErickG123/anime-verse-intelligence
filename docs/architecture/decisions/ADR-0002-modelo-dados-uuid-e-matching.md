# ADR-0002 — Modelo de Dados Normalizado com UUID Interno e Matching por Referência Externa

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

O `anime-offline-database` identifica obras por listas de URLs (`sources`) e não garante um ID numérico global único. Títulos variam entre romanizações e possuem homônimos. Além disso, `relatedAnime` é uma lista de URLs sem rótulo de tipo de relação.

## Alternativas consideradas

1. Usar título ou hash do título como chave primária: frágil a renomeações e colisões.
2. Usar uma URL de provedor específico (ex.: MAL) como chave primária: nem todos os animes possuem MAL ID.
3. UUID interno imutável + tabela `external_reference` com unicidade `(provider, external_id)` / `normalized_url` + tabela `anime_relationship` com `relation_type = 'UNSPECIFIED'` por padrão.

## Decisão e motivação

Adotar UUID interno em todas as entidades principais (`anime`, `company`, `tag`, `data_source`, `source_snapshot`, `ingestion_run`), deduplicar exclusivamente por `external_reference` normalizada, registrar ambiguidades em `ingestion_conflict`, persistir empresas em `company` + `anime_company(role: STUDIO|PRODUCER)` e relações em `anime_relationship(relation_type = 'UNSPECIFIED')`. Usar Drizzle ORM com migrações SQL versionadas e proibir `drizzle-kit push` em produção.

## Consequências e trade-offs

- **Prós:** estabilidade de URLs internas `/animes/:id`, integridade referencial forte, suporte natural a múltiplas fontes no futuro e honestidade semântica nas relações.
- **Contras:** ingestão requer duas passagens (entidades → resolução de `relatedAnime`) e normalizadores dedicados por provedor.

## Reversão / plano de migração

Mudanças de schema devem sempre ser feitas por novas migrações SQL incrementais versionadas em `apps/api/drizzle/`.

## Referências e validações

- `docs/specifications/SPEC-0002-ingestao.md`, `SPEC-0003-relacionamentos.md`, `SPEC-0004-data-governance.md`.
