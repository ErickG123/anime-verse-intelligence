# Auditoria — Fase 34: Cobertura Narrativa e de Adaptação

**Data:** 2026-11-23  
**Banco auditado:** PostgreSQL `17.11` isolado (`animeverse_validation`, porta `127.0.0.1:55432`).

## 1. Cobertura Inicial Medida (Antes da Curadoria)

| Módulo / Tabela      | Registros Iniciais | Observação                                           |
| -------------------- | ------------------ | ---------------------------------------------------- |
| `anime`              | `38.519`           | Catálogo completo `anime-offline-database` `2026-47` |
| `anime_relationship` | `138.093`          | Relações `UNSPECIFIED`                               |
| `manga_work`         | `0`                | Nenhuma obra de mangá cadastrada localmente          |
| `character`          | `0`                | Personagens existiam apenas sob demanda via AniList  |
| `story_arc`          | `0`                | Nenhum arco cadastrado                               |
| `story_event`        | `0`                | Nenhum acontecimento narrativo cadastrado            |
| `event_relation`     | `0`                | Nenhuma relação causal/temporal cadastrada           |
| `anime_episode`      | `0`                | Nenhum episódio cadastrado                           |
| `manga_chapter`      | `0`                | Nenhum capítulo cadastrado                           |
| `adaptation_mapping` | `0`                | Nenhum mapeamento episódio↔capítulo cadastrado       |
| `curation_review`    | `0`                | Nenhum evento de revisão editorial registrado        |

## 2. Estratégia Aprovada

- Reaproveitar integralmente as tabelas da migração `0001_lore_adaptation_foundation.sql` (zero novas migrações destrutivas).
- Selecionar 3 obras reais diversas (`Fullmetal Alchemist: Brotherhood`, `Death Note`, `Cowboy Bebop`) descritas exclusivamente com metadados factuais editoriais próprios (`rightsStatus = VERIFIED`, zero sinopses/scans protegidos).
- Implementar CLI controlado `curation:import` com `--dry-run`, validação de direitos, anti-self-loop, transação atômica, idempotência e audit trail em `curation_review`.
