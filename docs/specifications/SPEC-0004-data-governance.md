# SPEC-0004 — Governança de Dados, Proveniência, Identificadores e Licenças

**Status:** Aprovado (Fase 01)  
**Prioridade:** MVP (`P0`)

---

## 1. Problema e motivação

Consolidar metadados de múltiplas referências externas exige regras rígidas de identificação (evitando títulos como chave), rastreabilidade de origem, respeito a licenças (`ODbL 1.0`, `DbCL 1.0`, TOS de APIs terceiras) e proteção legal sobre imagens.

## 2. Escopo / Fora do escopo

- **No escopo:** registro canônico de fontes (`data_source`), normalização determinística de URLs e extração de `(provider, externalId)`, política de imagens externas, política de cache/armazenamento por fonte, matriz de proveniência (`source_evidence`) e contratos desativados para provedores futuros.
- **Fora do escopo:** espelhamento de AniList, hospedagem própria de capas sem licença, coleta de dados pessoais (LGPD documentada como requisito futuro caso contas sejam adicionadas no pós-MVP).

## 3. Requisitos funcionais (RF)

### `RF-0015` — Identidade interna imutável e normalização de referências externas

- **Dado** uma lista de URLs em `sources` de um anime (ex.: `https://myanimelist.net/anime/1`, `http://anilist.co/anime/1/`)
- **Quando** o sistema normaliza as referências
- **Então** padroniza protocolo/host/barra final, extrai `(provider, externalId)` via parsers determinísticos testados e garante unicidade `(provider, externalId)` ou `normalizedUrl`, mantendo sempre um `UUID` interno como chave primária do anime.

### `RF-0016` — Registro governado de fontes e permissões

- **Dado** o registro `data_source` no banco e em `docs/data-sources/SOURCE-REGISTRY.md`
- **Quando** qualquer rotina de ingestão ou enriquecimento é invocada
- **Então** somente fontes com `status = 'ACTIVE'` e `storageAllowed = true` podem persistir dados; fontes `INACTIVE` (AniList, Wikidata, MangaUpdates, TMDB no MVP) são bloqueadas por configuração e código.

### `RF-0017` — Política de imagens e atribuição obrigatória

- **Dado** campos `picture` e `thumbnail` contendo URLs externas
- **Quando** exibidos na UI ou retornados pela API
- **Então** o sistema nunca afirma deter licença sobre a imagem, nunca faz download/redistribuição local em massa, inclui fallback visual limpo caso a imagem externa falhe e exibe atribuição clara à fonte (`cedya77/anime-offline-database` / `manami-project`, ODbL 1.0 / DbCL 1.0).

### `RF-0018` — Rastreabilidade de proveniência por snapshot

- **Dado** um registro importado
- **Quando** consultado no detalhe do anime ou no Observatório de Fontes
- **Então** é possível rastrear qual `data_source` e qual `source_snapshot` forneceram os dados, bem como a data da última atualização conhecida.

## 4. Requisitos não funcionais (RNF)

- **`RNF-0003` (Segurança):** nenhuma chave de API externa ou credencial de banco pode ser exposta ao frontend (`apps/web`) ou gravada no Git.
- **`RNF-0005` (Manutenibilidade e CI):** testes automatizados no CI não podem depender de chamadas de rede a provedores externos; devem rodar com fixtures locais e PostgreSQL real.
- **`RNF-0008` (Privacidade / LGPD futuro):** o MVP não coleta nem persiste dados pessoais (PII) de usuários finais; caso autenticação/perfis sejam introduzidos no pós-MVP, será obrigatório ADR específico de base legal, retenção, anonimização e exclusão.

## 5. Cenários de teste previstos

- Unitário: normalização de URLs de todos os provedores suportados (`myanimelist`, `anilist`, `anidb`, `kitsu`, `livechart`, `anime-planet`, `anisearch`, `notify-moe`, `simkl`), bloqueio de fonte inativa e rejeição de URL inválida.
- Integração: unicidade de `external_reference` no PostgreSQL e retorno de atribuição/licença em `GET /api/v1/sources`.
