# Relatório — HOTFIX: Seletores Vazios em LoreGraph e AdaptationLab

**Data:** 2026-11-23  
**Status:** **CONCLUÍDO**  
**Auditoria de origem:** [AUDIT-HOTFIX-EMPTY-CURATED-WORK-SELECTORS.md](../audits/AUDIT-HOTFIX-EMPTY-CURATED-WORK-SELECTORS.md)

## Evidências Reais Pós-Correção

- `GET /api/v1/lore/curated-works?module=lore`: retorna **3 obras publicadas** (`Cowboy Bebop`, `Death Note`, `Fullmetal Alchemist: Brotherhood`).
- `GET /api/v1/lore/curated-works?module=adaptation`: retorna **3 obras publicadas** com mapeamentos verificados (`DIRECT`, `PARTIAL`, `ANIME_ORIGINAL`).
- `GET /api/v1/lore/works/:id?maxSpoiler=NONE`: retorna apenas eventos `NONE` (anti-spoiler enforced no SQL).
- `GET /api/v1/adaptation/works/:id`: retorna episódios, capítulos, mapeamentos e cobertura com denominador explícito.
- Playwright E2E (`lore-and-adaptation.spec.ts`) aprovado em navegador real contra API + PostgreSQL 17.
