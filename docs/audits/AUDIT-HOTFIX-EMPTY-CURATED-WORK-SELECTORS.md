# Auditoria — HOTFIX: Seletores Vazios em LoreGraph (`/lore`) e AdaptationLab (`/adaptation`)

**Data:** 2026-11-23  
**Sintoma:** Os seletores de anime em `/lore` e `/adaptation` apareciam vazios mesmo após a população das 3 obras (`Cowboy Bebop`, `Death Note`, `Fullmetal Alchemist: Brotherhood`) na Fase 34.

## Causa Raiz

Em `apps/api/src/modules/lore/routes.ts`, os endpoints `GET /api/v1/lore/curated-works`, `GET /api/v1/lore/works/:animeId` e `GET /api/v1/adaptation/works/:animeId` tentavam ler `(app as unknown as { pgPool?: Pool }).pgPool`, propriedade que nunca era decorada na instância Fastify em `apps/api/src/app.ts`. Como resultado, `pgPool` era sempre `undefined` e os endpoints retornavam listas vazias (`items: []`).

## Correção Aplicada

1. **Injeção explícita e tipada de `pgPool`:** `registerLoreAndAdaptationRoutes(app, loreRepo, dbHandle?.pool)` passou a receber `pgPool` diretamente de `apps/api/src/app.ts`.
2. **Separação por módulo (`?module=lore|adaptation`):** `GET /api/v1/lore/curated-works` agora filtra separadamente obras com `story_arc`+`story_event` `PUBLISHED` (`module=lore`) e obras com `adaptation_mapping` `PUBLISHED` (`module=adaptation`).
3. **UX / i18n:** Rótulo técnico `"Obra curada"` substituído por `"Selecionar anime"` (`pt-BR`) e `"Select anime"` (`en`).
