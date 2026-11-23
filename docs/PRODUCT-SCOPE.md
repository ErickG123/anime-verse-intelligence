# Escopo de Produto — AnimeVerse Intelligence

**Status:** Aprovado (Fase 01)  
**Referência base:** `docs/PRODUCT-BASELINE.md`

---

## 1. Dentro do escopo do MVP (Fases 00–19)

| Módulo                          | Capacidades incluídas                                                                                                                                                                                                 | Requisitos associados    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Ingestão JSONL (CLI)**        | Leitura streaming de `anime-offline-database-minified.jsonl` (linha 1 = metadata, demais = animes), normalização de URLs, deduplicação por ID externo forte, idempotência por snapshot, registro de erros e conflitos | `SPEC-0002`, `SPEC-0004` |
| **Catálogo e Busca**            | Listagem paginada, busca por título/sinônimo (acento-insensível / trigrama), filtros (tipo, status, temporada, ano, tag, empresa), ordenação com allowlist, tela de detalhe com proveniência                          | `SPEC-0001`              |
| **Relações entre Obras**        | Persistência e visualização em grafo interativo das relações `relatedAnime` com tipo `UNSPECIFIED` por padrão, profundidade controlada e navegação para detalhe                                                       | `SPEC-0003`              |
| **StudioGraph inicial**         | Empresas (`STUDIO` e `PRODUCER`), lista/busca de empresas, detalhe com obras associadas e grafo empresa↔obra, sem créditos de pessoas                                                                                 | `SPEC-0001`, `SPEC-0003` |
| **Observatório de Fontes**      | Painel read-only exibindo fontes cadastradas, licenças, atribuições, snapshots e histórico de execuções de ingestão                                                                                                   | `SPEC-0002`, `SPEC-0004` |
| **Fundação de módulos futuros** | Contratos/estruturas preparatórias (desativadas ou em estado vazio transparente) para integrações opcionais, LoreGraph e AdaptationLab                                                                                | Fases 14–15              |
| **Qualidade transversal**       | i18n (`pt-BR` / `en`), dark/light mode, responsividade, WCAG AA, observabilidade Pino, OpenAPI, Problem Details RFC 7807, testes e CI                                                                                 | `RNF-0001` a `RNF-0008`  |

---

## 2. Explicitamente FORA do escopo do MVP

- Autenticação/contas de usuários finais, perfis públicos ou listas pessoais de favoritos/watchlists.
- Avaliações, notas ou comentários gerados por usuários.
- Catálogo completo de mangás a partir do dataset de animes (`anime-offline-database` cobre animes).
- Personagens, dubladores, animadores, diretores ou créditos individuais de staff sem fonte licenciada integrada.
- Episódios descritivos, sinopses ricas, análise automática de cenas ou comparação detalhada anime × mangá.
- Scraping em larga escala, contorno de bloqueios ou espelhamento massivo do AniList.
- Redistribuição/hospedagem própria de imagens de terceiros sem licença explícita.
- IA generativa, recomendador por IA ou aplicativo mobile nativo.

---

## 3. Estados obrigatórios de dado e regras de apresentação

Todo componente de UI e contrato de API deve distinguir explicitamente os 4 estados abaixo:

| Estado                              | Significado                                                                                                         | Regra de comportamento                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Dado faltante (`MISSING`)**       | Campo ausente ou `null` no dataset (ex.: `score`, `animeSeason.year`, `episodes`)                                   | Exibir rótulo localizado claro ("Não informado" / "Not provided"); nunca exibir `0` falso ou texto inventado                            |
| **Dado conflitante (`CONFLICT`)**   | Duas fontes ou registros divergem sobre o mesmo atributo                                                            | Preservar valor principal conforme precedência de fonte e registrar `ingestion_conflict` para auditoria                                 |
| **Sem proveniência (`UNVERIFIED`)** | Dado sem `source_evidence` vinculada                                                                                | Proibido entrar em produção via pipeline automático; se existir em rascunho/curadoria futura, marcar explicitamente como não verificado |
| **Indisponível (`UNAVAILABLE`)**    | Módulo pós-MVP sem fonte integrada (ex.: LoreGraph, AdaptationLab, staff) ou serviço/DB temporariamente inacessível | Exibir estado vazio informativo explicando a ausência de fonte ou erro recuperável (RFC 7807), nunca dados fictícios                    |
