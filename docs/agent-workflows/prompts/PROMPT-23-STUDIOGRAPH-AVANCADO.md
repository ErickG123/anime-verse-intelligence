# PROMPT 23 — StudioGraph avançado: exploração, filtros, colaboração e grafos navegáveis

**Execute este prompt integralmente no repositório real AnimeVerse Intelligence.** Antes, leia `docs/agent-workflows/references/CONTRATO-COMUM.md` (anexo ao pacote), `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, ROADMAP, ADRs, specs, matriz de testes e relatórios até a Fase 22. A fase não é uma proposta: **audite, implemente, teste, registre as evidências e atualize a documentação**.

## 0. Gate e auditoria

1. Confirmar o estado real de 21 (dataset completo) e 22 (integração AniList). O relatório fornecido anteriormente só comprova 30 testes até a refatoração; **não presumir que 21/22 foram concluídas**.
2. Inventariar `apps/web/src/app/features/studios/` ou equivalente, o componente compartilhado Cytoscape, APIs de relações, modelo de dados para `anime`, `companies`, `people`, `credits`, identidade externa e políticas de fontes.
3. Verificar se créditos de profissionais são próprios/permitidos ou obtidos sob demanda do AniList. **Não copiar nem persistir créditos do AniList se a política não permitir**; desabilitar a funcionalidade correspondente com aviso honesto quando dados não estiverem autorizados/disponíveis.
4. Mapear widgets atuais, filtros, limites por consulta, direção/semântica de cada aresta, problemas de UX, performance e acessibilidade. Identificar rotas e comportamento existentes para não causar regressão.
5. Registrar `docs/audits/AUDIT-PHASE-23-STUDIOGRAPH.md`, requisitos e gates. Confirmar se há migração relevante; **não criar tabelas especulativas de grafos**.

## 1. Resultado funcional esperado

O StudioGraph deverá ser um explorador interativo de relações reais e verificadas, navegável no desktop e no celular. Deve oferecer dois modos coerentes, conforme a cobertura disponível:

- **Produção**: anime ↔ estúdio/produtora, relação com papel/atributo comprovado e origem.
- **Colaboração**: anime ↔ profissional ↔ obras relacionadas; explorar colaborações registradas, sem assumir que créditos incompletos significam ausência de colaboração.

Nunca exibir nomes de pessoas, números de colaboração, força de vínculo ou associação criada artificialmente para preencher a interface. Identificar quando a visualização é **parcial** por limite da fonte.

## 2. Modelos e contratos

Auditar os contratos atuais e estender apenas quando necessário:

- `GraphNode`: `id` estável, `kind` (ANIME, STUDIO, COMPANY, PERSON), `label`, `internalId/externalRef` quando autorizado, `sourceStatus`, `accessibleUrl?`, `metadata` segura.
- `GraphEdge`: `id` determinístico, `source`, `target`, `relationKind`, `creditRole?`, `evidenceRef?`, `confidence?` (se mensurável), `provenance/status`.
- `GraphQuery`: âncora, profundidade limitada, tipo de entidade, papéis, períodos, gêneros, filtros por estúdio e paginação/limite de nós.
- `GraphPage`: `nodes`, `edges`, `pageInfo`/cursor, `truncated` e motivo, metadados de proveniência e escopo.
- `GraphNeighborhood`: vizinhança incremental de um nó; usar cursor consistente com o conjunto.

IDs de nós do tipo `anime:<uuid>`, `studio:<uuid>`, `person:<id-autorizado>` e arestas determinísticas tipadas para impedir colisões. Não introduzir regras de score sem definição documentada. Respeitar a diferença entre `studio`, `producer`, `licensor` e demais papéis.

## 3. API Fastify

1. Reutilizar endpoints existentes e ampliar contratos do backend. Se necessário, adicionar endpoints especializados como `GET /api/studio-graph`, `GET /api/studio-graph/nodes/:id/neighbors`, `GET /api/studio-graph/metadata`, **seguindo o prefixo real da API**.
2. Validar query com TypeBox/JSON Schema, aplicar `limit`, `maxDepth`, parâmetros e cursores limitados; retornar erros padronizados para IDs desconhecidos, filtros inválidos e indisponibilidade do provedor.
3. Consultas locais com paginação keyset ou estratégia existente estável, evitando N+1; não carregar toda a rede no backend nem fazer joins cartesianos custosos.
4. Diferenciar relações **locais persistidas com licença** de relações **sob demanda de fontes externas**; combinar só quando permitido, com status visível e sem gravação automática.
5. Contrato de expansão incremental: não retornar grafos ilimitados, indicar truncamento e possibilidade de carregar mais.
6. Adicionar testes de contrato, nós com mesmo nome, papéis múltiplos, arestas reversas/duplicadas, paginadores e ausência de dados.
7. Atualizar OpenAPI e uso de identificadores tipados; não expor consulta GraphQL livre.

## 4. Frontend Angular e UX de exploração

1. Reaproveitar `shared/components/cytoscape-graph` ou componente correspondente, sem acoplar a UI às estruturas internas do AniList.
2. Interface com área de visualização expansível, cabeçalho enxuto, **pesquisa de nó**, seleção de modalidade, filtros recolhíveis, painel de detalhes e legenda.
3. Filtros reais: tipo de entidade, estúdio, papel de produção, período, obra, fonte e profundidade. Só exibir opções sustentadas pelos contratos/dados.
4. Ações: selecionar nó; expandir vizinhos; recolher seleção; voltar ao nó raiz; centralizar/ajustar; redefinir filtros; abrir ficha da obra; copiar link de visualização quando URL estável for viável.
5. Estados: loading inicial, carregando expansão, vazio, sem dados de profissionais, parcial por limite, erro recuperável, quota externa, indisponibilidade, filtros sem resultados.
6. Preservar câmera/layout e seleção quando filtros mudarem de forma incremental; não re-instanciar grafo sem necessidade; limpar listeners/instâncias no destroy.
7. Diferenciar visualmente tipos de nós e arestas usando **cores + ícones/forma/legenda**, sem depender só de cor; dark mode consistente e sem emojis decorativos.
8. Suportar teclado, foco e painel/lista tabular alternativa. Em mobile, filtros e detalhes como painéis sobrepostos acessíveis sem roubar área inteira do grafo.
9. Angular 22: standalone, `OnPush`, Signals, html/scss/ts em arquivos separados, `models/.model.ts`, `.types.ts`, `.constants.ts`, feature-first. Não criar HTML/SCSS inline.
10. Traduzir rótulos por Transloco e atualizar testes unitários dos estados e seleção.

## 5. Exploração de colaboração

- Definir matematicamente `co-credit`: duas pessoas com **crédito verificado na mesma obra**, sem inferir colaboração direta na mesma cena ou equipe; atribuir contexto/obra.
- Para relações pessoa→obra→pessoa, mostrar a obra que fundamenta o vínculo. Não chamar colaboração direta de um simples overlap, nem apresentar rankings globais como completos quando dados forem parciais.
- Oferecer visualização de **caminho de conexão** entre dois nós apenas sobre subgrafo realmente carregado/consultável e informar explicitamente o escopo e possíveis rotas não vistas.
- Indicadores opcionais: número de obras no subgrafo, créditos conhecidos, tipos de papel, densidade do subgrafo. Em todos os casos exibir o denominador e fonte. Não inventar scores de influência.
- Perfis de profissionais com listagem limitada de obras vinculadas, links de origem e indicação de lacunas; não coletar filmografia em massa.

## 6. Limites e performance

- Default sensato de nós/arestas (documentar, ajustar por benchmark), expansão controlada e renderização incremental.
- Evitar layouts pesados no thread principal; investigar Web Worker apenas se biblioteca/layout permitir e houver ganho medido. Cancelar requisições obsoletas e debounce de busca.
- Benchmark com subgrafos pequenos/médios/grandes reproduzíveis, medir p50/p95 de API, tempo para primeira interação, número de elementos, memória e frames perceptíveis quando disponível.
- Validar `ResizeObserver`, resize, zoom, pan, repintura após navegação, foco e destruição do componente.
- Exibir aviso de limite antes que a interface trave, inclusive num dispositivo móvel intermediário.

## 7. Testes e cenários verificáveis

- Unitários: modelos/mappers, deduplicação, relações, filtros, seleções, caminhos e indicadores de escopo.
- Integração Fastify/PostgreSQL: consulta de vizinhança, paginação, consistência de papéis, ordenação, filtros e timeouts de fonte externa simulados.
- Angular: grafo vazio, vínculo selecionado, painéis, carregamento incremental, dark mode, i18n e teclado.
- E2E: buscar obra → abrir StudioGraph → filtrar estúdios → expandir nó → abrir detalhes → retornar sem perder estado indevidamente.
- Contratos/segurança: limitar profundidade, sem dados não autorizados, payloads máximos, sanitização de labels e links.
- Executar comandos reais `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`; executar E2E existente ou justificar impossibilidade. Nunca remover regras AST para passar.

## 8. Entregáveis SDD e relatório

Atualizar specs, `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, ADR de grafo se houver decisão nova, documentação de política de fonte, e gerar:

- `docs/audits/AUDIT-PHASE-23-STUDIOGRAPH.md`
- `docs/reports/REPORT-PHASE-23-STUDIOGRAPH.md`

O relatório deve conter antes/depois, captura da topologia de módulos, endpoints, lista de arquivos, benchmark com ambiente/escopo, resultados de testes e matriz `RF → código → teste → evidência`.

### Critérios de aceite

- [ ] StudioGraph navega relações comprovadas de anime/estúdio; mostra relações de profissionais **somente quando disponíveis e permitidas**.
- [ ] Filtros, busca, seleção, expansão incremental, painel de detalhes e reset funcionam.
- [ ] Grafo não apresenta nós/arestas fictícias; proveniência e escopo parcial são claros.
- [ ] API possui limites, paginação e tratamento de fontes indisponíveis sem quebrar catálogo.
- [ ] UX mobile/teclado, dark mode, i18n e alternativa textual foram verificados.
- [ ] Testes, lint, typecheck, build, contratos e docs SDD foram atualizados com evidência.

**Não avance à Fase 24 ocultando pendências de integridade, fontes ou performance; marque `PARCIAL/BLOQUEADO` quando necessário.**
