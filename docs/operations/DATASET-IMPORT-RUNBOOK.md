# Runbook — Download e Importação do `anime-offline-database`

**Última atualização:** 2026-11-23  
**Fonte oficial:** `https://github.com/cedya77/anime-offline-database`  
**Licença:** Open Data Commons Open Database License (ODbL) v1.0 + Database Contents License (DbCL) v1.0.

---

## 1. Regras de Governança e Integridade

- A ingestão é **estritamente via CLI** (`apps/api/src/cli/`); não existem endpoints HTTP públicos de escrita ou importação no MVP.
- O parser processa o arquivo JSONL em **streaming** linha a linha (linha 1 = metadata + licença + `lastUpdate`; linhas 2..N = registros de anime).
- Relações (`relatedAnime`) são persistidas sempre como `UNSPECIFIED` sem inferência semântica.
- Reexecuções são **100% idempotentes** (`createdCount = 0`, `updatedCount = 0`, `unchangedCount = totalRecords`).

---

## 2. Download Oficial com Verificação SHA-256

```powershell
# Baixar release mais recente para apps/api/data/ (ignorado pelo Git)
pnpm --filter @animeverse/api dataset:download -- --out data/anime-offline-database.jsonl --timeout 120000

# Validar arquivo local existente (SHA-256 + metadata linha 1)
pnpm --filter @animeverse/api dataset:download -- --file apps/api/data/anime-offline-database.jsonl
```

---

## 3. Importação Completa e Prova de Idempotência

```powershell
# Apontar DATABASE_URL para o banco alvo (nunca commitar)
$env:DATABASE_URL = "postgresql://<user>:<password>@127.0.0.1:<port>/<database>"

# 1ª execução (carga inicial ou atualização de release)
pnpm --filter @animeverse/api dataset:import -- --file data/anime-offline-database.jsonl

# 2ª execução (verificação de idempotência: createdCount=0, updatedCount=0)
pnpm --filter @animeverse/api dataset:import -- --file data/anime-offline-database.jsonl
```

---

## 4. Baseline Medido (Release `2026-47` em PostgreSQL 17 Isolado)

| Métrica                    | 1ª Importação (Banco Vazio) | 2ª Importação (Idempotência) |
| -------------------------- | --------------------------- | ---------------------------- |
| Release / `lastUpdate`     | `2026-47` (`2026-11-22`)    | `2026-47` (`2026-11-22`)     |
| `totalRecords`             | `38.519`                    | `38.519`                     |
| `createdCount`             | `38.519`                    | `0`                          |
| `updatedCount`             | `0`                         | `0`                          |
| `unchangedCount`           | `0`                         | `38.519`                     |
| `relationsCreated`         | `138.093`                   | `0`                          |
| `relationsUnchanged`       | `0`                         | `138.093`                    |
| `rejectedCount` / `errors` | `0` / `0`                   | `0` / `0`                    |
| Duração / Throughput       | `132,6 s` (`291 rec/s`)     | `54,2 s` (`711 rec/s`)       |
| Pico de memória (RSS)      | `320 MB`                    | `354 MB`                     |
