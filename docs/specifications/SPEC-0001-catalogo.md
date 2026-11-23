# SPEC-0001 — Catálogo, Busca, Filtros e Detalhe de Animes

**Status:** Aprovado (Fase 01)  
**Prioridade:** MVP (`P0`)

---

## 1. Problema e motivação

Pesquisadores e usuários precisam localizar animes reais importados do `anime-offline-database` por título, sinônimos e atributos estruturados, inspecionando detalhes completos e sua proveniência sem dados inventados.

## 2. Escopo / Fora do escopo

- **No escopo:** listagem paginada, busca textual (título + sinônimos), filtros combináveis (tipo, status, temporada, ano, tag, estúdio/produtora), ordenação segura por allowlist, página de detalhe do anime com aliases, referências externas, empresas, tags, relações resumidas e proveniência.
- **Fora do escopo:** listas pessoais de usuários, notas de usuários, sinopses inventadas, episódios descritivos, personagens ou staff individual.

## 3. Requisitos funcionais (RF)

### `RF-0001` — Listagem paginada e ordenação segura do catálogo

- **Dado** que existem animes persistidos no banco de dados
- **Quando** o cliente solicita `GET /api/v1/animes` com `page`, `pageSize` (máximo 100), `sortBy` e `sortOrder`
- **Então** a API retorna itens paginados, metadados (`total`, `page`, `pageSize`, `totalPages`) e ordena apenas por campos presentes na allowlist (`title`, `year`, `episodes`, `score`, `updatedAt`), rejeitando campos inválidos com `400 Bad Request` (RFC 7807).

### `RF-0002` — Busca textual por título e sinônimos

- **Dado** um anime com título principal e zero ou mais sinônimos (`anime_alias`)
- **Quando** o cliente informa o parâmetro `q` (texto com ou sem acento, caixa mista ou termo parcial)
- **Então** a API retorna animes cujo título principal ou algum sinônimo corresponda à busca, priorizando correspondência exata/prefixo e trigrama (`pg_trgm`) quando habilitado.

### `RF-0003` — Filtros combináveis de catálogo

- **Dado** animes classificados por `type`, `status`, `season`, `seasonYear`, `tag` e `company` (`STUDIO` / `PRODUCER`)
- **Quando** o cliente envia um ou mais parâmetros de filtro simultaneamente
- **Então** a API aplica interseção (`AND`) entre critérios distintos e retorna apenas obras compatíveis, mantendo a contagem total consistente.

### `RF-0004` — Detalhe completo de anime com proveniência e estados vazios honestos

- **Dado** um `anime.id` (`UUID`) válido
- **Quando** o cliente solicita `GET /api/v1/animes/:id`
- **Então** a API retorna metadados do anime, `aliases`, `externalReferences`, `companies` (com papel `STUDIO`/`PRODUCER`), `tags`, contagem/resumo de `relatedAnimes` e metadados de proveniência (`source`, `snapshot`, `lastUpdated`). Campos ausentes retornam `null` e a UI exibe estado explícito de "Não informado". Se o ID não existir, retorna `404 Not Found` (RFC 7807).

### `RF-0005` — Listagem e detalhe de empresas (base para StudioGraph)

- **Dado** empresas vinculadas a animes com papel `STUDIO` ou `PRODUCER`
- **Quando** o cliente consulta `GET /api/v1/companies` ou `GET /api/v1/companies/:id`
- **Então** a API retorna empresas paginadas com contagem de obras e, no detalhe, a lista de animes associados por papel, sem incluir créditos individuais de pessoas.

## 4. Requisitos não funcionais (RNF)

- **`RNF-0001` (Desempenho):** consultas paginadas e filtradas do catálogo devem utilizar índices PostgreSQL e evitar N+1, com meta p95 `< 300 ms` em base local MVP.
- **`RNF-0004` (Acessibilidade):** listagem, filtros, paginação e detalhe no Angular 22 devem atender WCAG 2.1 AA (foco visível, navegação por teclado, contraste dark/light, sem emojis como ícones de UI).
- **`RNF-0007` (Internacionalização):** todos os rótulos, estados vazios e mensagens da UI devem suportar `pt-BR` e `en` via Transloco.

## 5. Casos de erro e estados vazios

- Banco vazio (antes da primeira ingestão): retornar lista vazia `[]` com `total: 0` e exibir estado vazio instrutivo na UI.
- Parâmetros inválidos (`page < 1`, `pageSize > 100`, UUID malformado, `sortBy` fora da allowlist): `400 Bad Request` em Problem Details.
- ID inexistente: `404 Not Found` em Problem Details.

## 6. Cenários de teste previstos

- Unitário: validação de query schemas (TypeBox) e mapeamento de DTOs.
- Integração (PostgreSQL real): paginação, busca por título/sinônimo, combinação de filtros, 400/404.
- E2E (Playwright): busca no catálogo, aplicação de filtros, abertura de detalhe e troca de idioma/tema.
