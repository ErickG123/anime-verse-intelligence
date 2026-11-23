# SPEC-0002 — Ingestão Streaming JSONL do anime-offline-database

**Status:** Aprovado (Fase 01)  
**Prioridade:** MVP (`P0`)

---

## 1. Problema e motivação

O projeto precisa importar dezenas de milhares de registros de `cedya77/anime-offline-database` de forma segura, reproduzível, auditável e com baixo consumo de memória, sem depender de endpoints administrativos públicos e sem sobrescrever dados curados manualmente.

## 2. Escopo / Fora do escopo

- **No escopo:** CLI local de ingestão por stream de arquivo JSONL (local ou baixado explicitamente de release oficial), parsing da linha 1 como metadata do snapshot, validação linha a linha, deduplicação por referência externa normalizada, persistência transacional/idempotente, registro de `source_snapshot`, `ingestion_run`, `ingestion_error`, `ingestion_conflict` e `source_evidence`, e painel read-only de monitoramento.
- **Fora do escopo:** endpoint HTTP público para disparar ingestão sem autenticação, scraping de sites terceiros, download automático de imagens para redistribuição.

## 3. Requisitos funcionais (RF)

### `RF-0006` — Leitura streaming e validação de metadata JSONL

- **Dado** um arquivo JSONL do `anime-offline-database`
- **Quando** o operador executa a CLI de ingestão
- **Então** a primeira linha é interpretada como objeto de metadata do dataset (ex.: `lastUpdate`, `repository`, licença/atribuição) e registrada em `source_snapshot` junto com hash SHA-256 do arquivo; cada linha subsequente é processada em stream sem carregar o arquivo inteiro em memória.

### `RF-0007` — Idempotência por snapshot e preservação de UUID interno

- **Dado** um snapshot já importado ou uma nova versão contendo animes já existentes
- **Quando** a CLI de ingestão é executada novamente
- **Então** registros existentes são identificados por `external_reference` normalizada (nunca apenas por título), mantendo o mesmo `anime.id` (`UUID`), atualizando atributos de forma determinística e sem duplicar aliases, empresas, tags ou relações.

### `RF-0008` — Isolamento de erros por linha e registro de conflitos

- **Dado** uma linha malformada, sem `sources` válidas ou com conflito de matching
- **Quando** a CLI processa o stream
- **Então** o erro é registrado em `ingestion_error` (com número da linha, motivo e payload resumido sanitizado) ou `ingestion_conflict`, sem abortar silenciosamente o restante do lote e marcando o status final da `ingestion_run` como `PARTIAL` ou `FAILED` conforme política.

### `RF-0009` — Execução controlada via CLI (sem endpoint admin público)

- **Dado** o requisito de segurança da ingestão
- **Quando** a API HTTP está em execução
- **Então** não existe endpoint público capaz de disparar ingestão ou apagar dados; a ingestão ocorre exclusivamente via CLI local autenticada ao banco por variáveis de ambiente.

### `RF-0010` — Observatório read-only de fontes e histórico de ingestões

- **Dado** execuções de ingestão registradas em `source_snapshot` e `ingestion_run`
- **Quando** o cliente consulta `GET /api/v1/sources` ou `GET /api/v1/ingestions`
- **Então** a API retorna fontes cadastradas, licenças, status, último snapshot e histórico de execuções com contadores (processados, inseridos, atualizados, erros, conflitos), em modo estritamente somente leitura.

## 4. Requisitos não funcionais (RNF)

- **`RNF-0002` (Confiabilidade e memória):** ingestão deve usar leitura em stream (`readline` / Node streams) com processamento em lotes transacionais, evitando crescimento ilimitado de RAM.
- **`RNF-0003` (Segurança):** nenhuma credencial de banco pode ser logada ou exposta em respostas HTTP; logs estruturados Pino com redaction.
- **`RNF-0006` (Observabilidade):** cada `ingestion_run` deve gerar logs estruturados com `runId`, duração e contadores finais.

## 5. Casos de erro e estados vazios

- Arquivo inexistente ou primeira linha sem JSON válido: falha imediata antes de alterar o banco, registrando `FAILED` quando aplicável.
- Linha JSON inválida: registrada em `ingestion_error`, contabilizada no resumo da execução.
- Nenhuma ingestão realizada ainda: `GET /api/v1/ingestions` retorna `[]` e a UI exibe instrução clara do comando CLI.

## 6. Cenários de teste previstos

- Unitário: parser de metadata, normalizador de URLs, extrator de provider/externalId, detector de conflitos.
- Integração (PostgreSQL real): importação de fixture JSONL realista, reexecução idempotente (contagens idênticas), tratamento de linha corrompida, consulta `GET /api/v1/sources` e `GET /api/v1/ingestions`.
