# Curadoria Inicial — Lotes Editoriais Verificados

Este diretório armazena lotes pequenos de metadados editoriais factuais próprios (sem redistribuição de sinopses protegidas ou scans) para alimentação controlada do **LoreGraph** e **AdaptationLab** via CLI (`pnpm --filter @animeverse/api curation:import`).

## Execução Segura (CLI-Only)

```powershell
# 1. Dry-run obrigatório (valida schema, direitos, referências e conflitos sem gravar)
pnpm --filter @animeverse/api curation:import -- --file ../../docs/data-sources/initial-curation/datasets/initial-curation-v1.json --dry-run

# 2. Importação idempotente transacional
pnpm --filter @animeverse/api curation:import -- --file ../../docs/data-sources/initial-curation/datasets/initial-curation-v1.json
```
