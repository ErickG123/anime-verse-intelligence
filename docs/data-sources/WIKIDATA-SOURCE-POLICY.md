# Política de Uso da Fonte — Wikidata (EntityData & SPARQL)

**Versão:** `1.0`  
**Data da revisão:** 2026-11-23  
**Endpoints oficiais:** `https://www.wikidata.org/wiki/Special:EntityData/{QID}.json` e `https://query.wikidata.org/sparql`  
**Documentação consultada:** `https://www.wikidata.org/wiki/Wikidata:Data_access`

---

## 1. Condições verificadas

- **Licença dos dados estruturados:** **CC0 1.0 Universal** (domínio público) para entidades, propriedades e declarações estruturadas do Wikidata.
- **Exceção de mídia:** imagens e arquivos do Wikimedia Commons vinculados via `P18` possuem licenças individuais próprias (ex.: CC-BY-SA) e **não** herdam CC0 automaticamente — por isso o AnimeVerse não incorpora imagens do Commons automaticamente.
- **User-Agent obrigatório:** toda requisição deve enviar `User-Agent` descritivo identificando o projeto (`AnimeVerse-Intelligence/0.1`).
- **Limites operacionais:** concorrência reduzida (`<= 2` no cliente local), timeout curto, respeito rigoroso a `HTTP 429` + `Retry-After` e proibição de SPARQL arbitrário do cliente.

## 2. Política por campo no AnimeVerse Intelligence

- **Ativação:** opt-in via `ENRICHMENT_WIKIDATA_ENABLED` (`false` por padrão).
- **Permitido:** QIDs verificados, rótulos multilíngues (ja/en/pt), criadores (`P50`/`P170`), editoras (`P123`), obra de origem (`P144`), com preservação de qualificadores e proveniência.
