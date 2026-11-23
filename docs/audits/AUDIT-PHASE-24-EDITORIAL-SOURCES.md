# Auditoria Inicial — Fase 24: Fontes Editoriais (MangaUpdates + Wikidata)

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 24 / editorial-sources  
**Pré-requisito verificado (Fase 23):** CONCLUÍDO — StudioGraph Avançado aprovado com `39/39` testes, `0` erros AST/ESLint e benchmark real (`p50 <= 11,39 ms` sobre `38.519` animes).

---

## 1. Inventário do que já existe

- `apps/api/src/modules/enrichment/wikidata-adapter.ts`: adaptador opt-in básico para Wikidata (`Special:EntityData`), desativado por padrão (`ENRICHMENT_WIKIDATA_ENABLED=false`).
- `apps/api/src/modules/sources/source-registry.ts`: `mangaupdates` e `wikidata` já registrados como `INACTIVE`, `storageAllowed = false`.
- `apps/api/src/modules/integrations/anilist/`: padrão consolidado de cliente HTTP resiliente, rate limiter, mapper sanitizado, resolvedor de identidade sem auto-vínculo ambíguo e cache transitório em memória.
- `apps/api/drizzle/0001_lore_adaptation_foundation.sql`: já possui `manga_work`, `manga_chapter`, `anime_episode`, `story_arc`, `character`, `story_event`, `event_relation`, `adaptation_mapping` e `curation_review`.

## 2. Lacunas e plano de entrega da Fase 24

1. **Políticas oficiais documentadas:** `docs/data-sources/MANGAUPDATES-SOURCE-POLICY.md` e `docs/data-sources/WIKIDATA-SOURCE-POLICY.md` (antes de qualquer persistência ou exibição).
2. **Conectores independentes e opt-in (`apps/api/src/modules/integrations/editorial/`):**
   - `mangaupdates-client.ts`: consultas sob demanda a `https://api.mangaupdates.com/v1/series/{id}` (timeout, rate limit conservador, tratamento 429/403/5xx, nunca copiar sinopses longas ou capas sem licença).
   - `wikidata-client.ts`: acesso direto por QID conhecido (`Special:EntityData/{qid}.json`) ou SPARQL estático parametrizado (zero SPARQL arbitrário de cliente), User-Agent identificado, distinção de qualificadores/idiomas e separação de direitos de mídia do Wikimedia Commons.
   - `reconciler.ts`: **matriz de precedência por atributo** (`anime_studio ≠ manga_publisher`), preservação de asserções conflitantes (nunca sobrescrever curadoria manual), rejeição automática de homônimos/ambiguidade.
   - `service.ts` + `routes.ts`: `GET /api/v1/anime/:id/editorial`, `GET /api/v1/editorial/sources` (read-only, degradação graciosa se provedores desativados/indisponíveis).
3. **Frontend Angular 22:** seção discreta **Obra original / Dados editoriais** na página de detalhe do anime exibindo origem, editora com contexto, créditos editoriais e status de correspondência quando disponíveis (sem abas vazias desnecessárias e sem confundir estúdio de animação com editora de mangá).
4. **Testes:** unitários (QIDs, Unicode, homônimos, precedência de atributos, conflitos), integração com mocks HTTP (`429`/`403`/`500`/timeout) e sem dependência de rede externa no CI.
