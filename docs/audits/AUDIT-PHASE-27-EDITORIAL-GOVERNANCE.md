# Auditoria Inicial — Fase 27: Governança Editorial, Curadoria, RBAC e Auditoria

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 27 / editorial-governance  
**Pré-requisitos verificados (Fases 24–26):** CONCLUÍDOS — conectores editoriais, LoreGraph com filtro backend de spoilers e AdaptationLab N:M validados.

---

## 1. Diagnóstico de segurança e identidade

- Até a Fase 26, a API pública permaneceu 100% read-only (`GET/HEAD/OPTIONS`), sem endpoints públicos de mutação ou senhas padrão.
- A Fase 27 introduz a infraestrutura de governança editorial **fail-closed**:
  - RBAC com 4 papéis (`ADMIN`, `EDITOR`, `REVIEWER`, `VIEWER`).
  - Máquina de estados única (`DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED`, `CHANGES_REQUESTED`, `REJECTED`, `RETRACTED`, `ARCHIVED`) com separação explícita de `verificationStatus`, `publicationStatus` e `rightsStatus`.
  - Controle de concorrência otimista (`expectedVersion` → `409 Conflict`).
  - Trilha de auditoria `append-only` (`editorial_audit_event`) e separação de funções (autor não aprova a própria proposta).
  - Nenhuma conta padrão (`admin/admin`) ou credencial hardcoded é criada; todas as rotas `/api/v1/admin/*` exigem autenticador configurado e retornam `401`/`403` por padrão.
