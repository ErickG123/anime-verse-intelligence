# SPEC-0007 — StudioGraph Avançado: Exploração, Filtros, Colaboração e Grafos Navegáveis

**Status:** Aprovado (Fase 23)  
**Prioridade:** Evolução controlada (`P1`)

---

## 1. Requisitos funcionais (RF)

- **`RF-0026` (API especializada StudioGraph com limites e paginação):** expor `GET /api/v1/studio-graph/metadata`, `GET /api/v1/studio-graph` (modos `PRODUCTION` e `COLLABORATION`, filtros `role`, `yearFrom`, `yearTo`, paginação `limit <= 80`, `offset`, flag `truncated` + `truncationReason` + métricas com denominador/escopo) e `GET /api/v1/studio-graph/nodes/:nodeId/neighbors` para expansão incremental.
- **`RF-0027` (Identidade tipada e proveniência explícita):** todos os nós usam IDs tipados (`anime:<uuid>`, `studio:<uuid>`, `company:<uuid>`, `person:anilist:<id>`) e arestas determinísticas; proveniência distingue explicitamente `LOCAL_DB` de `ANILIST_ON_DEMAND` sem persistir créditos externos proibidos.
- **`RF-0028` (Exploração interativa e acessibilidade no Frontend):** oferecer seleção de modo (`PRODUCTION`/`COLLABORATION`), busca de nó no subgrafo, filtros recolhíveis, legenda por forma+cor (sem emojis), painel de detalhes do nó selecionado, expansão incremental de vizinhos, caminho mínimo sobre o subgrafo carregado (com aviso de escopo), cópia de URL compartilhável, reset de câmera/filtros e alternativa tabular acessível.
- **`RF-0029` (Semântica honesta de colaboração / co-credit):** `co-credit` representa exclusivamente duas pessoas com crédito verificado na mesma obra carregada, sem inferir colaboração direta na mesma cena e sem rankings globais artificiais.

## 2. Requisitos não funcionais (RNF)

- **`RNF-0011` (Performance e resiliência de visualização):** limite máximo de 80 elementos por requisição, `ResizeObserver` com cleanup no `DestroyRef`, cancelamento de requisições obsoletas (`switchMap`) e degradação graciosa se AniList estiver desabilitado ou indisponível.
