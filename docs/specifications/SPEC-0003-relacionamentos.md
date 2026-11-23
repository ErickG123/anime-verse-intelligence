# SPEC-0003 — Relações entre Obras e StudioGraph Inicial

**Status:** Aprovado (Fase 01)  
**Prioridade:** MVP (`P1`)

---

## 1. Problema e motivação

Usuários precisam explorar visualmente como animes se conectam entre si (`relatedAnime`) e como empresas (`STUDIO` e `PRODUCER`) se conectam às obras que produzem, sem que o sistema invente semântica de relação (ex.: sequel/prequel/spin-off) ou créditos individuais de profissionais que não existem na fonte inicial.

## 2. Escopo / Fora do escopo

- **No escopo:** armazenamento e API de grafo para `anime_relationship` (tipo `UNSPECIFIED` por padrão), consulta de vizinhança por `animeId` com profundidade limitada (`depth` 1–2) e limite de nós (`limit`), visualização interativa no Angular, e StudioGraph inicial (`company` ↔ `anime` por papel `STUDIO`/`PRODUCER`).
- **Fora do escopo:** inferência automática de direção temporal (`SEQUEL`, `PREQUEL`), grafo de personagens/arcos (LoreGraph pós-MVP) ou grafo de diretores/animadores individuais.

## 3. Requisitos funcionais (RF)

### `RF-0011` — Persistência fiel de relações sem inferência semântica

- **Dado** o campo `relatedAnime` contendo URLs externas no dataset
- **Quando** a ingestão resolve essas URLs para animes internos existentes
- **Então** a relação é gravada em `anime_relationship` com `relationType = 'UNSPECIFIED'` (salvo evidência externa explícita) e sem duplicar pares redundantes. URLs ainda não resolvidas não são descartadas silenciosamente quando rastreáveis como referência pendente ou resolvidas em segunda passagem do mesmo snapshot.

### `RF-0012` — API de subgrafo de relações entre animes

- **Dado** um `anime.id` válido
- **Quando** o cliente solicita `GET /api/v1/animes/:id/relations-graph?depth=1&limit=50`
- **Então** a API retorna nós (`id`, `title`, `type`, `seasonYear`, `thumbnail`) e arestas (`sourceId`, `targetId`, `relationType`), respeitando limites seguros (`depth <= 2`, `limit <= 100`) e indicando `truncated: true` caso o grafo exceda o limite.

### `RF-0013` — Visualização interativa de relações entre obras (UI)

- **Dado** o subgrafo retornado pela API
- **Quando** o usuário abre a aba/página de relações de um anime
- **Então** o frontend renderiza um grafo interativo acessível (com alternativa tabular/lista para teclado e leitores de tela), permite selecionar um nó para inspecionar ou navegar ao detalhe, e exibe aviso claro de que relações marcadas como `UNSPECIFIED` refletem o limite do dataset atual.

### `RF-0014` — StudioGraph inicial (Empresas ↔ Obras)

- **Dado** empresas (`STUDIO` / `PRODUCER`) associadas a animes
- **Quando** o cliente consulta `GET /api/v1/companies/:id/graph` e visualiza no frontend
- **Então** a API retorna o nó central da empresa, as obras conectadas e o papel (`STUDIO` ou `PRODUCER`), e a UI exibe explicitamente que créditos de pessoas/staff não estão disponíveis na fonte atual.

## 4. Requisitos não funcionais (RNF)

- **`RNF-0001` (Desempenho):** consultas de grafo devem limitar profundidade e cardinalidade no banco para evitar explosão combinatória.
- **`RNF-0004` (Acessibilidade):** todo grafo visual deve oferecer navegação por teclado e modo lista/tabela equivalente.

## 5. Casos de erro e estados vazios

- Anime sem relações conhecidas: retornar `nodes: [centralNode]`, `edges: []` e exibir estado vazio honesto.
- `depth > 2` ou `limit > 100`: rejeitar com `400 Bad Request` (Problem Details).
- ID inexistente: `404 Not Found`.

## 6. Cenários de teste previstos

- Unitário: normalização de pares de arestas e validação de limites `depth`/`limit`.
- Integração (PostgreSQL real): resolução de `relatedAnime` em segunda passagem, retorno de subgrafo com `UNSPECIFIED`, grafo de empresa por papel.
- E2E (Playwright): abrir grafo de relações, navegar para obra relacionada, alternar para modo acessível em lista e explorar StudioGraph.
