# Auditoria — Fase 32: Prontidão de Release Pública (Read-Only `0.1.0-rc.1`)

**Data:** 2026-11-23  
**Decisão preliminar:** **CONDITIONAL-GO (Read-Only)** | **NO-GO para Escrita Editorial** (sem IdP OIDC de produção).

## Matriz de Riscos de Release

| ID          | Severidade | Descrição                                                           | Estado / Mitigação                                                          |
| ----------- | ---------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `REL-32-01` | **MÉDIO**  | Ausência de IdP OIDC de produção para `/api/v1/admin/*`.            | Mitigado: `AUTH_MODE=disabled` fail-closed (`401` em `onRequest`).          |
| `REL-32-02` | **BAIXO**  | Cobertura editorial local (`story_event = 0`, `adaptation = 0`).    | Mitigado: placeholders honestos na UI; zero dados inventados.               |
| `REL-32-03` | **BAIXO**  | Dependência de provedores externos (AniList/MangaUpdates/Wikidata). | Mitigado: flags `false` por padrão, cache transitório, catálogo 100% local. |
