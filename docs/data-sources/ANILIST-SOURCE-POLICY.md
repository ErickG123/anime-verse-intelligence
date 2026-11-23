# Política de Uso da Fonte — AniList GraphQL API

**Versão:** `1.0`  
**Data:** 2026-11-23  
**Endpoint oficial:** `POST https://graphql.anilist.co`  
**Documentação consultada:** `https://docs.anilist.co/guide/terms-of-use`, `https://docs.anilist.co/guide/rate-limiting`, `https://docs.anilist.co/guide/graphql/`

---

## 1. Condições oficiais verificadas

1. **Rate limiting:** limite nominal de `90 req/min`, sujeito a limite operacional reduzido de **`30 req/min`** e proteção contra rajadas (burst). Exceder o limite retorna `HTTP 429` com janela de espera (`Retry-After` / `X-RateLimit-Reset`).
2. **Proibição de espelhamento e armazenamento massivo:** usar a API do AniList como serviço de backup, banco de dados replicado ou coleta em massa (_scraping/hoarding_) é **estritamente proibido**.
3. **Serviços concorrentes:** aplicações que concorram diretamente como tracker/lista de animes sem integração de sincronização com contas AniList não são permitidas. O AnimeVerse Intelligence atua como ferramenta analítica/exploratória complementar de metadados e produção, sem listas pessoais ou contas concorrentes.
4. **Uso comercial:** gratuito para projetos sem fins lucrativos ou com receita inferior a US$ 150/mês; acima desse valor exige licença comercial via `contact@anilist.co`.
5. **Nomenclatura e atribuição:** exibir atribuição explícita à origem "AniList" nos dados consultados e nunca sugerir endosso oficial.

---

## 2. Política implementada no AnimeVerse Intelligence

| Aspecto                        | Regra aplicada em código                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modo de ativação**           | Opt-in via variável de ambiente `ENRICHMENT_ANILIST_ENABLED` (`false` por padrão no `.env.example`)                                                              |
| **Escopo de consulta**         | Exclusivamente **sob demanda** para uma obra específica solicitada pelo usuário (zero coleta em massa)                                                           |
| **Persistência no PostgreSQL** | **PROIBIDA** para personagens, dubladores, créditos e descrições retornados pelo AniList (`storageAllowed = false`)                                              |
| **Cache permitido**            | Apenas cache **transitório em memória** (TTL curto padrão `300s`, limite de entradas em LRU/Map) para proteger o rate limit contra cliques repetidos             |
| **Rate limiting interno**      | Limite conservador padrão de `25 req/min` (configurável), `maxConcurrent = 2`, deduplicação de requisições in-flight, respeito a `Retry-After` e circuit breaker |
| **Segurança de conteúdo**      | Queries GraphQL estáticas no backend (zero GraphQL arbitrário do cliente); sanitização de strings/HTML externo; sem renderização de HTML não confiável na UI     |
| **Degradação graciosa**        | Falha, 429 ou desativação do AniList nunca interrompem o catálogo local, busca, relações ou StudioGraph base                                                     |
