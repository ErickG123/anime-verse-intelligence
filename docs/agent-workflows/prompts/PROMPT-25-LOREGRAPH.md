# PROMPT 25 — LoreGraph: motor de narrativa, personagens, acontecimentos, cronologia e spoilers

**Agente Antigravity:** execute esta fase no código real. Primeiro leia `docs/agent-workflows/references/CONTRATO-COMUM.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, ROADMAP, specs/ADRs/auditorias, TEST-MATRIX e relatórios de 21–24. Não presumir conclusão de nenhuma fase. Auditar, especificar, implementar, testar e reportar; sem inventar conteúdo de obras.

## 0. Gate de segurança e auditoria

1. Confirmar que catálogo/localização de obra, relações internas e identificadores editoriais são estáveis e verificáveis.
2. Ler a migração anterior `0001_lore_adaptation_foundation.sql` e outras migrações reais. Reutilizar entidades já existentes, evitando duplicar modelo narrativo.
3. Mapear qualquer narrativa, arcos, personagens ou relacionamentos já existentes; determinar quais são **dados próprios/curados**, quais vêm de APIs com restrições e quais não podem ser retidos.
4. Verificar como funcionam auth e mutações na API. **Antes da fase 27, não abrir endpoints de escrita pública**; permitir dados de desenvolvimento por fixtures determinísticos e/ou rotas administrativas já seguras. Não criar senha padrão.
5. Criar `docs/audits/AUDIT-PHASE-25-LOREGRAPH.md` com funcionalidades, gaps, direitos, risco de spoiler, cobertura de teste e plano de migração não destrutiva.

## 1. Objetivo do domínio

Transformar informações narrativas **curadas e comprovadas** em um grafo navegável de histórias. A experiência deve permitir explorar:

- Obra e seu universo, com separação entre franquia, versão/adaptação, edição e arco.
- Personagens, grupos, organizações, locais e suas participações em eventos.
- Eventos narrativos, ordem, causalidade comprovada, consequências e mudanças de estado.
- Arcos narrativos, subarcos e acontecimentos contextualizados por mídia.
- Proteção de spoilers baseada no progresso informado pelo usuário.

**Não** executar IA sobre scans ilegais, copiar capítulos inteiros, reproduzir falas/cenas ou declarar que se conhece toda a narrativa. A primeira demonstração pode usar **uma obra licenciada/autorizada para anotação ou um universo fictício de teste**; separar nitidamente fixture de dados reais e nunca mostrá-lo como informação oficial.

## 2. Especificação de entidades e invariantes

Auditar e evoluir modelos Drizzle/contratos, preferindo IDs internos e tabelas normalizadas:

- `NarrativeUniverse`/`StoryScope` (franquia, obra, mídia, versão/continuidade, idioma/edição quando relevante).
- `NarrativeArc` (id, obra, título, ordinal seguro, início/fim documentados, relação com subarco).
- `NarrativeEvent` (id, escopo, nome curto original, resumo **autoral e breve**, tempo/ordem, spoiler marker, status editorial).
- `Character` e `Organization` e `Location` se ainda não existirem com escopo adequado.
- `EventParticipant` (evento ↔ personagem/grupo/local, papel no contexto).
- `NarrativeRelation` (evento→evento ou entidade→entidade), relação tipada: PRECEDES, CAUSES (somente com evidência), MEMBER_OF, ALLIED_WITH, CONFLICTS_WITH, OCCURS_AT, PARTICIPATES_IN etc.
- `NarrativeEvidence`/`SourceAssertion`: URL/referência autorizada, idioma, método de verificação, versão, autoria, timestamp, status; evitar cópia textual extensa.
- `SpoilerBoundary`/`StoryPosition`: progresso em formato comparável dentro da **mesma versão/continuidade**; cada mídia com posição de episódio/capítulo/arco.

### Regras de integridade

1. `unknown` ≠ `none`; ausência de relação não prova inexistência.
2. Arco e evento não são automaticamente um episódio; um evento pode atravessar unidades, arcos e mídias.
3. Ordem cronológica do universo pode diferir da ordem de publicação/exibição. **Manter duas dimensões se necessárias**, sem assumir ambas equivalentes.
4. Causalidade **não** pode ser deduzida só da anterioridade temporal; registrar evidência e revisão.
5. Relações dirigidas e não dirigidas têm contratos e reciprocidade explícitos; evitar espelhar arestas de forma indevida.
6. Verificar constraints para escopo, status, uniqueness por unidade, FK, soft delete/versionamento coerente e índices dos filtros recorrentes.
7. Mídias/edições distintas podem divergir. Não mesclar eventos de remake ou anime original com mangá sem mapeamento explícito.
8. Cada fato narrativo exibido deve ser aprovado editorialmente e possuir fonte/evidência ou identificação como conteúdo autoral de curadoria.

## 3. Proteção de spoilers — requisito central

Desenhar regras e **testes de não vazamento** no backend antes de implementar a UI:

- O visitante escolhe: obra e mídia (anime/mangá), versão correta e progresso (episódio/capítulo/arco) ou modo **sem spoilers**.
- Sem progresso definido: usar **limite conservador** (sem eventos reveladores) e exibir opção de configurar; jamais assumir obra concluída.
- Um evento só é retornado se sua `spoilerBoundary` estiver dentro da janela liberada e seu status for público. Se atravessar a janela, ocultar a parte não segura ou não retornar.
- Aplicar filtro **antes** de agregação, serialização, preview, contagens, labels, busca, tooltips, exportação, grafos, links deep-link e logs acessíveis.
- Não inferir que capítulo N = episódio N. Sem mapeamento confiável entre mídias, exigir progresso na **mesma mídia**; não converter automaticamente.
- O modo explícito “mostrar tudo” requer ação consciente e sinalização clara; a preferência pode persistir apenas conforme política de privacidade/local storage adotada.
- Expansões sob demanda não podem ignorar filtro de spoiler.
- Em respostas de API, não incluir textos escondidos com `display:none` ou campos omitidos apenas no frontend. Testar via request direto.
- Proteger nomes de nós, rótulos de arestas, sugestões de autocomplete e buscas quando eles próprios contiverem spoiler.

## 4. API Fastify e consultas ao grafo

1. Implementar/reutilizar rotas com esquema real (`GET /api/lore/:workId/overview`, `.../arcs`, `.../events`, `.../graph`, `.../entities/:id`, `.../timeline` apenas como exemplos).
2. Validar `workId`, `media`, `version`, `progress`, filtros, `limit`, cursor, profundidade, IDs e permissão. Rejeitar mídia/versão incompatíveis com o identificador.
3. API de grafo retorna nós, arestas, prova/proveniência autorizada, recorte de spoiler e `truncated` sem revelar o conteúdo oculto em metadados de paginação.
4. Linha do tempo permite ordem narrativa vs ordem de apresentação, se suportada e documentada; se não, mostrar apenas a ordem verificável.
5. Consultas paginadas/expandidas localmente, índices por `storyScope`, arco, eventId, status, posição; benchmark com fixture e conjunto representativo.
6. Endpoints de mutação só atrás de autenticação/autorização existente (nunca publicamente editáveis). Na ausência de infraestrutura segura, fornecer seeds/fixtures de desenvolvimento + fluxo de leitura; a UI de autoria definitiva fica para 27.
7. Gerar schemas JSON e OpenAPI, rotas tipadas e erros padronizados. Separar mappers, serviços e modelos.

## 5. Interface Angular LoreGraph

Criar/reusar feature `lore-graph` (ou nome existente), rotas lazy e componentes separados:

- Cabeçalho: obra, escopo (anime/mangá), seletor explícito de versão/continuidade e controle de spoiler.
- Visualização **Grafo**: nós por personagem/evento/grupo/local com legenda, filtros por tipo, arco e relação, seleção e expansão controlada em Cytoscape.js.
- Visualização **Linha do tempo**: eventos em sequência validada, agrupados por arco, explicação da ordem usada.
- Visualização **Detalhes**: resumo curto, participantes, evidências, status de revisão, links para ficha da obra, sem mídia protegida.
- Alternativa textual/listagem pesquisável de eventos e relações (acessibilidade) com o mesmo filtro backend de spoilers.
- Estados de carregamento, indisponibilidade, universo sem dados, cobertura parcial, progresso insuficiente e erro de permissão.
- Navegação por teclado, foco ao alterar escopo, responsividade e dark mode; Transloco pt/en; sem emoji em UI.
- Estado de progresso com Signals, persistir preferência conforme política; cancelar requests obsoletos. Não criar mutações de progresso que exijam conta sem necessidade.
- Não desenhar grafo gigantesco de uma vez; vizinhança incremental, limites e preservação de layout por seleção.

## 6. Curadoria inicial e dados de demonstração

- Preparar **fixtures determinísticos sintéticos** para testes completos: 2 arcos, 5–10 eventos, 3–6 personagens, organização, local, algumas relações e eventos que excedem progresso do usuário.
- Se houver conteúdo real autorizado/manual: adicionar um conjunto **pequeno** para 1 obra e documentar exatamente fonte, responsabilidade, licença e nível de revisão.
- Separar `seed:dev` de seed de produção; nunca fazer dados fictícios aparecerem no catálogo público como fatos reais.
- Não invocar um LLM para geração de fatos como se fossem verdade; se usar IA para sugerir uma relação, armazenar apenas proposta pendente até revisão.

## 7. Testes obrigatórios

### Unidade
- Topologia/ciclos, ordenação, equivalência de escopo, classificação de vínculo, tratamento de progresso desconhecido, eventos multi-arcos, versões incompatíveis.

### Segurança de spoiler
- Request como usuário sem progresso; progresso até episódio 3; tentar obter evento episódio 4 por lista, detalhes, busca, grafo, autocomplete, contagem, export, nó com ID conhecido e relacionamento indireto. **Nenhum desses caminhos deve expor o segredo**.
- Testar edição de mangá vs episódio sem correspondência, remake vs original, mudança de progresso durante request e status não publicado.

### Integração/E2E
- Migrações e constraints PostgreSQL; contratos Fastify; filtro na query e não em CSS; navegação Angular de obra → lore → arco → evento; atualização de escopo/idioma, teclado, mobile.
- Benchmark de consulta de subgrafo, sem N+1 e resultados determinísticos.
- Executar explicitamente `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm test`, além dos scripts E2E existentes, com evidência; documentar bloqueios reais.

## 8. Entregáveis e definição de pronto

- `docs/audits/AUDIT-PHASE-25-LOREGRAPH.md`
- Spec SDD de grafo e política de spoiler, ADR se houver decisão arquitetural material.
- `docs/data-sources/LOREGRAPH-CURATION-POLICY.md` (fontes e direitos de conteúdo).
- `docs/reports/REPORT-PHASE-25-LOREGRAPH.md` com mapa de entidades, migrações, contratos, exemplos permitidos, tabela de ataques de spoiler, testes, limitações e matriz rastreável.
- Atualizar `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, README e regras apenas quando necessário.

### Critérios de aceite

- [ ] Modelo suporta arcos, eventos, participantes, relações e múltiplas mídias/versões sem misturar universos.
- [ ] Backend impede spoilers em **todas** as rotas e recursos, validado por testes negativos.
- [ ] Grafo, timeline, detalhes e alternativa textual funcionam com dados sintéticos e/ou autorizados.
- [ ] Relações exibidas têm evidência e status; causalidade não é inferida por proximidade.
- [ ] Operações de escrita não ficam abertas publicamente; sem senhas padrão.
- [ ] PostgreSQL, Fastify e Angular verificados; lint, typecheck, build, tests e docs com evidências.

**Não declarar lore completo para todas as obras. O produto deve mostrar claramente a cobertura real.**
