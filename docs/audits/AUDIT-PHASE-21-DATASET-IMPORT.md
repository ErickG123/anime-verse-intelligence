# Auditoria Inicial — Fase 21: Importador, Dataset Completo e Validação End-to-End

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Última fase concluída:** Ciclo 00–20 + Refatoração Extra Feature-Based (30/30 testes verdes com PostgreSQL 17 Docker ativo)

---

## 1. Diagnóstico dos dois erros anteriores no fixture (`anime-offline-sample.jsonl`)

Inspeção direta da tabela `ingestion_error` e de `apps/api/test/fixtures/anime-offline-sample.jsonl`:

| Linha | Conteúdo do fixture                              | `error_code`            | Classificação real                                                                      |
| ----- | ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| 4     | `{"title":"Missing Sources Anime","sources":[]}` | `MISSING_VALID_SOURCES` | **Caso de teste intencional** (rejeição de validação por ausência de URL externa forte) |
| 5     | `{malformed json line`                           | `INVALID_JSON`          | **Caso de teste intencional** (JSON malformado)                                         |

- **Conclusão:** Nenhum registro válido foi descartado indevidamente; os 2 erros eram casos intencionais do fixture. Entretanto, a semântica das métricas do importador misturava rejeições de validação (`rejectedCount`) com erros inesperados (`unexpectedErrors`).

---

## 2. Gargalos e defeitos identificados no importador atual (`apps/api/src/modules/ingestion/importer.ts`)

1. **`updatedCount` sem comparação de diff:** na segunda execução idempotente, o importador executava `UPDATE` incondicional e reportava `updatedCount: 2` mesmo sem nenhuma alteração real nos campos (`unchangedCount` inexistente).
2. **Métricas insuficientes:** faltavam separações claras para `unchangedCount`, `rejectedCount`, `duplicateCount`, `relationsCreated`, `relationsUnchanged`, `relationsPending` e `unexpectedErrors`.
3. **Risco de degradação de qualidade em updates:** um valor `null` / `UNKNOWN` / `UNDEFINED` vindo de um snapshot não deve sobrescrever um valor interno não nulo de melhor qualidade.
4. **Duplicação de `source_evidence` em reimportações:** `source_evidence` era inserido incondicionalmente mesmo em registros inalterados.
5. **Performance para carga completa (~40.000 registros / 58,5 MB):**
   - O arquivo era lido duas vezes (`previewScan` + segunda leitura).
   - Cada anime abria 1 transação e ~15–20 queries individuais (centenas de milhares de round-trips para o dataset completo).
   - **Solução planejada:** streaming em lotes (`BATCH_SIZE = 250`) com lookup pré-buscado por lote (`IN (...)`), upsert em lote de empresas/tags/aliases/referências, diff real de campos para `updatedCount` vs `unchangedCount`, e passagem 2 em lote para `anime_relationship` (diferenciando `relationsCreated`, `relationsUnchanged` e `relationsPending`).
6. **Sincronização manual verificável:** `dataset:download` precisa suportar verificação da release mais recente (`2026-47` detectada em `cedya77/anime-offline-database`), comparação com snapshot já importado e reaproveitamento de arquivo local íntegro sem re-download redundante.

---

## 3. Release oficial detectada (`cedya77/anime-offline-database`)

- **Tag:** `2026-47` (`2026-11-22T13:58:32Z`)
- **Asset selecionado:** `anime-offline-database.jsonl` (`61.367.063` bytes)
- **Licença:** ODbL 1.0 / DbCL 1.0 (atribuição `cedya77/anime-offline-database` e `manami-project/anime-offline-database`)
