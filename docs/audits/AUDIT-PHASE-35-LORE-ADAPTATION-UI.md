# Auditoria — Fase 35: Interfaces Interativas do LoreGraph e AdaptationLab

**Data:** 2026-11-23  
**Pré-requisito verificado:** Fase 34 concluída (`3` obras curadas no PostgreSQL 17: `Fullmetal Alchemist: Brotherhood`, `Death Note`, `Cowboy Bebop`; `7` eventos, `4` relações, `6` mapeamentos, `13` revisões).

## Contratos de API Utilizados

| Endpoint                            | Método | Função                                                                    | Anti-Spoiler / Segurança                               |
| ----------------------------------- | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `/api/v1/lore/curated-works`        | `GET`  | Lista obras com curadoria publicada (`PUBLISHED`)                         | Read-only                                              |
| `/api/v1/lore/works/:animeId`       | `GET`  | Retorna arcos, eventos, relações e personagens filtrados por `maxSpoiler` | Filtro SQL `WHERE spoiler_level = ANY(...)` no backend |
| `/api/v1/adaptation/works/:animeId` | `GET`  | Retorna episódios, capítulos, mapeamentos e cobertura com denominador     | Read-only, `UNKNOWN` ≠ `OMITTED`                       |
