# Auditoria — Fase 35.3: Experiência do Produto, Mídia Autorizada TMDB, Grafos Legíveis e Consistência de Fontes

**Data:** 2026-11-23  
**Escopo:** Reconstrução da experiência de produto em `/catalog/:id` (capas autorizadas TMDB + sinopse + título original + atribuição), reconstrução do `CytoscapeGraphComponent` (zero sobreposição de labels/nós) e alinhamento dinâmico do `/sources` com as flags reais de enriquecimento.

## Diagnóstico e Soluções

1. **Mídia e Capas:** `anime-offline-database` não concede licença de redistribuição das URLs `picture`/`thumbnail`. A camada de mídia (`anime-media.model.ts` + `TmdbClient`) passa a resolver capas autorizadas sob demanda via **TMDB API v3** (`https://image.tmdb.org/t/p/w500<poster_path>`, `usageStatus: 'ALLOWED'`, atribuição TMDB explícita, `loading="lazy"` e fallback tipográfico automático em caso de erro ou ausência).
2. **Legibilidade dos Grafos (`CytoscapeGraphComponent`):** Substituído layout `cose` compacto por `concentric` com `minNodeSpacing: 52` quando há nó central (`isCenter`), `text-wrap: 'ellipsis'`, `min-zoomed-font-size: 8`, `text-background-color` de alto contraste e supressão do rótulo repetitivo `UNSPECIFIED` nas arestas.
3. **Consistência de `/sources`:** `DrizzleSourcesRepository` agora reflete dinamicamente `env.enrichmentFlags` (`ACTIVE` para `AniList`, `Wikidata`, `MangaUpdates` e `TMDB` quando habilitados no ambiente).
