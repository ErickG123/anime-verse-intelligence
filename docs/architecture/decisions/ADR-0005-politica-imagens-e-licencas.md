# ADR-0005 — Política de Imagens, Licenças e Fontes Externas

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

O dataset `cedya77/anime-offline-database` é licenciado sob ODbL 1.0 / DbCL 1.0 e contém campos `picture` e `thumbnail` apontando para URLs de terceiros (MAL, AniList, Kitsu etc.). A presença de uma URL no dataset não transfere direitos autorais nem licença de redistribuição das imagens.

## Alternativas consideradas

1. Baixar e hospedar todas as imagens localmente no servidor/CDN: viola direitos autorais e termos de uso de terceiros.
2. Armazenar apenas as URLs externas como referência, renderizar no cliente com `referrerPolicy="no-referrer"`, `loading="lazy"`, fallback visual limpo e atribuição clara da fonte.

## Decisão e motivação

Adotar a alternativa 2. Jamais baixar ou redistribuir imagens de terceiros em massa. Manter todas as APIs externas adicionais (AniList, Wikidata, MangaUpdates, TMDB) desativadas por padrão no MVP (`INACTIVE`, `storage_allowed = false`), proibindo expressamente espelhamento massivo do AniList.

## Consequências e trade-offs

- **Prós:** conformidade legal, zero custo de armazenamento de mídia, respeito aos termos de uso.
- **Contras:** imagens externas podem ficar indisponíveis — mitigado por placeholder SVG acessível e sem emojis.

## Reversão / plano de migração

Somente fontes com licença explícita de imagem ou parceria formal poderão alterar essa política mediante novo ADR.

## Referências e validações

- `docs/data-sources/SOURCE-REGISTRY.md`, `REFERENCIAS.md`, `SPEC-0004-data-governance.md`.
