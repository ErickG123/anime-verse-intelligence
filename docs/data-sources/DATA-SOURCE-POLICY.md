# Política de Fontes de Dados, Identificadores e Licenças

**Versão da política:** `1.0`  
**Última atualização:** 2026-11-23  
**Status:** Aprovado (Fase 07)

---

## 1. Fonte inicial autorizada no MVP

- **ID:** `anime-offline-database`
- **Origem:** `https://github.com/cedya77/anime-offline-database` (continuação oficial de `manami-project/anime-offline-database`)
- **Asset principal:** `https://github.com/cedya77/anime-offline-database/releases/download/latest/anime-offline-database.jsonl` (ou release versionada, inclusive `.jsonl.zst` quando descomprimido localmente)
- **Formato:** JSONL com **primeira linha = metadata** (`lastUpdate`, `repository`, licença) e linhas subsequentes = registros de anime.
- **Licença:** ODbL 1.0 (Open Database License) / DbCL 1.0 (Database Contents License).
- **Atribuição obrigatória:** citar `cedya77/anime-offline-database` e `manami-project/anime-offline-database` na documentação, API (`/api/v1/data-sources`) e rodapé da UI.
- **Limitações conhecidas:** não contém personagens, dubladores, diretores/animadores individuais, sinopses ricas, episódios descritivos nem mapeamento de capítulos de mangá. `relatedAnime` não classifica o tipo da relação (`UNSPECIFIED` obrigatório).

---

## 2. Política de imagens externas

1. URLs em `picture` e `thumbnail` são meras referências apontando para domínios de terceiros e **não constituem prova de licença**.
2. É **proibido** baixar, espelhar, redimensionar em servidor ou redistribuir imagens de terceiros sem licença explícita.
3. No MVP, a UI adota **placeholder/fallback neutro de identidade própria** por padrão e exibe aviso explícito de direitos sobre imagens externas.

---

## 3. Regras de matching e identificadores

- **Chave primária interna:** `UUID` imutável gerado pelo sistema.
- **Chaves fortes externas:** URLs normalizadas e pares `(provider, externalId)` extraídos deterministicamente.
- **Título:** nunca utilizado isoladamente como chave de deduplicação.
- **Conflitos:** qualquer registro cujas URLs apontem para mais de um `anime.id` existente vai para `ingestion_conflict` para revisão humana, sem merge destrutivo automático.

---

## 4. Proteção contra SSRF e redirecionamentos no download CLI

- Somente protocolo `https:` é aceito.
- Allowlist estrita de hosts para download da release: `github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`.
- Rejeição explícita de endereços privados/loopback (`localhost`, `127.0.0.1`, `::1`, `10.*`, `172.16-31.*`, `192.168.*`, `169.254.*`).
- Limite máximo de redirecionamentos (`<= 5`), validação de cada destino de redirect contra a mesma allowlist, timeout configurável e limite máximo de tamanho de arquivo (`maxBytes`).

---

## 5. Fontes futuras (TODAS DESATIVADAS no MVP)

| Fonte          | Status     | Armazenamento | Restrições conhecidas                                                                                  |
| -------------- | ---------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `anilist`      | `INACTIVE` | `false`       | Termos proíbem espelhamento massivo como serviço de armazenamento; exige validação prévia de cache/TOS |
| `wikidata`     | `INACTIVE` | `false`       | Dados CC0; requer política de rate limit SPARQL/REST e revisão de matching                             |
| `mangaupdates` | `INACTIVE` | `false`       | Verificar termos de uso e limites de cache antes de ativar                                             |
| `tmdb`         | `INACTIVE` | `false`       | Requer chave/token de servidor, atribuição TMDB e validação de termos de imagens                       |
