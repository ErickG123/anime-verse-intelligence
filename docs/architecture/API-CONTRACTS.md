# Contratos de API HTTP (`/api/v1`) — AnimeVerse Intelligence

**Status:** Aprovado (Fase 02)

---

## 1. Convenções transversais

- **Prefixo versionado:** `/api/v1`
- **Content-Type:** `application/json; charset=utf-8`
- **Erros (RFC 7807 / Problem Details):** `application/problem+json` contendo:
  ```json
  {
    "type": "https://animeverse.local/problems/validation-error",
    "title": "Bad Request",
    "status": 400,
    "detail": "Invalid sortBy field",
    "instance": "/api/v1/animes",
    "code": "VALIDATION_ERROR",
    "requestId": "req-uuid"
  }
  ```
- **Paginação padrão:** query `page` (default `1`, min `1`), `pageSize` (default `20`, min `1`, max `100`). Resposta:
  ```json
  {
    "items": [],
    "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
  }
  ```
- **Sorting allowlist (catálogo):** `title`, `year`, `episodes`, `score`, `updatedAt` + `sortOrder`: `asc` | `desc`.
- **OpenAPI:** servido em `/docs` (e JSON em `/docs/json`) em ambientes `development`/`test` (controlável por env `ENABLE_SWAGGER`).

---

## 2. Endpoints planejados do MVP

| Método | Rota                                 | Descrição                                                                                                | Fase         |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------ |
| `GET`  | `/api/v1/health`                     | Liveness probe (não depende de DB)                                                                       | Fase 03 / 05 |
| `GET`  | `/api/v1/ready`                      | Readiness probe (verifica conectividade PostgreSQL sem vazar credenciais)                                | Fase 05      |
| `GET`  | `/api/v1/animes`                     | Catálogo paginado com `q`, `type`, `status`, `season`, `year`, `tag`, `companyId`, `sortBy`, `sortOrder` | Fase 09      |
| `GET`  | `/api/v1/animes/:id`                 | Detalhe completo do anime (aliases, externalReferences, companies, tags, relatedCount, provenance)       | Fase 09      |
| `GET`  | `/api/v1/animes/:id/relations-graph` | Subgrafo de relações (`depth` 1..2, `limit` 1..100, `relationType = UNSPECIFIED`)                        | Fase 11      |
| `GET`  | `/api/v1/companies`                  | Lista paginada de empresas (`q`, `role`: `STUDIO`/`PRODUCER`)                                            | Fase 09 / 12 |
| `GET`  | `/api/v1/companies/:id`              | Detalhe da empresa e obras associadas por papel                                                          | Fase 09 / 12 |
| `GET`  | `/api/v1/companies/:id/graph`        | Subgrafo StudioGraph (empresa ↔ obras)                                                                   | Fase 12      |
| `GET`  | `/api/v1/sources`                    | Lista read-only de fontes governadas, licenças, atribuições e último snapshot                            | Fase 13      |
| `GET`  | `/api/v1/ingestions`                 | Histórico read-only de `ingestion_run` com contadores e status                                           | Fase 13      |
| `GET`  | `/api/v1/ingestions/:id`             | Detalhe de execução incluindo resumo de erros/conflitos                                                  | Fase 13      |
| `GET`  | `/api/v1/enrichment/providers`       | Estado read-only dos adaptadores opcionais (todos desativados no MVP)                                    | Fase 14      |
| `GET`  | `/api/v1/lore/status`                | Estado explícito `UNAVAILABLE` do módulo LoreGraph no MVP                                                | Fase 15      |
| `GET`  | `/api/v1/adaptation/status`          | Estado explícito `UNAVAILABLE` do módulo AdaptationLab no MVP                                            | Fase 15      |

> [!IMPORTANT]
> Não existe endpoint HTTP `POST/DELETE` público para ingestão ou remoção de dados. Toda ingestão ocorre exclusivamente via CLI local.
