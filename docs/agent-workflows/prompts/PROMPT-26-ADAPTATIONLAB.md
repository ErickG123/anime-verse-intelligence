# PROMPT 26 — AdaptationLab: correspondência anime ↔ mangá, eventos e diferenças de adaptação

**Execução obrigatória no código real**, com `docs/agent-workflows/references/CONTRATO-COMUM.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, ROADMAP, ADRs, specs, relatórios de 21–25 e matriz de testes lidos previamente. Não presumir fases concluídas nem criar análise fictícia. Auditar, especificar, implementar, testar, documentar.

## 0. Gate e escopo

1. Verificar resultados da Fase 25, sobretudo a separação por mídia/versão e proteção backend de spoilers. Se esses pré-requisitos estiverem quebrados, registrar bloqueio e limitar implementação a tarefas independentes.
2. Auditar `0001_lore_adaptation_foundation.sql`, modelos de anime/mangá/episódio/capítulo existentes, importadores, relações editoriais (Fase 24), APIs, frontend e testes. **Não duplicar entidades**.
3. Verificar as políticas das fontes e registrar as diferenças entre metadados públicos, resumos autorais, páginas oficiais, capítulos completos, legendas, frames, scans, trailers e capas.
4. Gerar `docs/audits/AUDIT-PHASE-26-ADAPTATIONLAB.md` com capacidades reais, origem de dados, modelo proposto, riscos de spoiler e direitos autorais.

## 1. Objetivo funcional e princípios

Construir o **AdaptationLab** para responder de forma fundamentada:

- Quais episódios de **qual versão do anime** se relacionam a **quais capítulos de qual obra/edição do mangá**?
- Quais eventos narrativos do LoreGraph estão presentes em ambas as mídias, somente em uma, ou aparecem reorganizados?
- Quais correspondências são verificadas, prováveis, contestadas ou desconhecidas?
- Qual a cobertura efetiva de mapeamento da obra, sem apresentar estimativa como anúncio factual?

Não criar scraping genérico, OCR de scans, análise automática de mídia protegida ou extração de texto integral. Não assumir que todos os animes adaptam mangás; permitir outras fontes (novel, jogo, original) como **não suportadas nesta versão ou tipos futuros**, sem forçar dados de mangá inexistente.

## 2. Modelo de domínio e granularidades

Verificar modelos preexistentes antes de novas migrations:

- `AdaptationWorkLink`: animeWorkId, mangaWorkId, relação (ADAPTS, INSPIRED_BY etc.), versão de anime, versão/obra de manga, status e evidência.
- `AnimeInstallment`: temporada, série, número de exibição, tipo (episódio regular, OVA, especial), título opcional; **chave composta com versão**, sem assumir numeração global única.
- `MangaInstallment`: capítulo, capítulo especial/extra, volume/edição quando documentado, ordinal e idioma/edição relevantes. Capítulo 0, extras e intervalos de publicação suportados.
- `AdaptationMapping`: muitos-para-muitos entre um ou vários episódios e capítulos, escopo, cobertura parcial, `mappingKind` (DIRECT, PARTIAL, COMPOSITE, REORDERED, ORIGINAL, UNKNOWN etc.), fonte, método, confiança operacional, revisão.
- `AdaptationEventMatch`: evento narrativo da mídia origem ↔ evento/segmento adaptado, status (PRESERVED, MODIFIED, OMITTED, ADDED, REORDERED, UNKNOWN) e evidência suficiente.
- `AdaptationChange`: texto editorial original e breve da diferença, severidade/categoria opcional **sem inventar escala**, status de spoiler, origem, revisão.
- `MappingEvidence`: tipo de evidência, URL, identificador oficial, contexto, autoria de anotação, data, status, regras de retenção; **não guardar mídia protegida**.

### Invariantes

1. Muitos capítulos podem alimentar um episódio; um capítulo pode estar repartido entre episódios; um episódio pode mesclar material de capítulos diferentes.
2. Episódio “original” não implica inventar capítulos correspondentes; `no source chapter` ≠ `not yet mapped`.
3. Mapear só se houver evidência verificável; ausência de ligação é **desconhecida**, não prova omissão.
4. Diferença não é necessariamente erro de adaptação; evitar juízo editorial como fato objetivo.
5. Mapeamento de obras não confirma todos os capítulos/episódios. Cobertura deve ser calculada apenas sobre conjuntos conhecidos.
6. `confidence` não substitui aprovação; conservar valores e método de cálculo rastreável. Não exibir porcentagem arbitrária.
7. Mapas de versões (TV/corte/filme/remake) e edição original/tradução são distintos.
8. Não mesclar continuidade do anime com a do mangá no LoreGraph automaticamente.

## 3. Curadoria segura e ingestão de mapeamentos

- Revisar APIs e comunidades **apenas com acesso e reutilização autorizados**. Nenhuma obrigação de consumir dados de wiki específica.
- Preparar contrato de inserção editorial tipado para capítulo↔episódio e evento↔evento. **Antes da Fase 27**, qualquer endpoint de escrita deve ter auth já segura ou permanecer desabilitado fora de dev.
- Criar importação opcional para **arquivo de curadoria própria** (JSON/CSV validado) com schema, preview/dry-run, detecção de conflitos, FK, identidade externa, reprocessamento idempotente e relatório de linhas rejeitadas.
- A importação de curadoria não é um scraper. Exigir licença/origem declarada, validação de número/edição/mídia, status rascunho por padrão e rollback transacional.
- Gerar fixture sintética completa para ao menos 2 episódios, 4 capítulos, 6 eventos, incluindo trecho composto, omitido, adicionado, reordenado e desconhecido.
- Se usar exemplos de obra real, registrar comprovação e direitos, sem preencher centenas de mapeamentos não verificados.

## 4. API Fastify

Estender rotas existentes ou criar, coerentemente com o prefixo real:

- `GET /api/anime/:animeId/adaptation` — obra origem, versões, cobertura e escopo.
- `GET /api/anime/:animeId/adaptation/mappings?episode=...&mangaId=...` — vínculos e evidências autorizadas.
- `GET /api/anime/:animeId/adaptation/compare?episode=...&sourceEdition=...` — eventos/diferenças no limite de spoiler.
- `GET /api/anime/:animeId/adaptation/timeline` — narrativa comparada com filtros e paginação.
- Operações administrativas somente autorizadas, quando existir segurança apropriada.

Requisitos: schemas TypeBox/JSON Schema, validação de IDs, paginação, limites, status de cobertura, tratamento 404/409/422 apropriado, versionamento de contratos compartilhados, OpenAPI, query eficiente sem N+1, índices conforme benchmark.

**Segurança spoiler:** aplicar na consulta antes de serializar. Solicitar comparação de episódios futuros com progresso insuficiente não pode retornar eventos, labels, exemplos, contagens reveladoras, tooltips ou links internos com spoiler. Sem progresso definido, usar modo restritivo.

## 5. Frontend Angular — exploração de adaptação

Criar/reusar `features/adaptation-lab` (sem gerar pastas vazias):

- **Seletor contextual**: anime, versão/temporada/episódio e mangá/edição/capítulo; deixar explícito o eixo de cada número.
- **Mapa de correspondências**: matriz ou timeline navegável, com linhas de episódio e colunas de capítulo, indicadores de mapeamento (direto/parcial/composto/etc.) e legenda acessível. Permitir drilldown.
- **Comparador de eventos**: duas colunas com resumos curados de acontecimentos em anime e mangá, relação e evidência; ocultar spoilers conforme backend.
- **Diferenças**: segmentos “preservado”, “reorganizado”, “adicionado”, “omitido”, “modificado”, “não analisado”; mostrar o que é **revisado** e o que está **pendente**.
- **Cobertura**: contagem de episódios/capítulos **com mapeamento revisado** sobre universo conhecido; mostrar denominador, fonte e lacunas. Não afirmar porcentagem de adaptação completa se faltam capítulos.
- **Estados:** anime original, obra sem mangá associado, fonte indisponível, mapping desconhecido, sem curadoria, bloqueio por licença, spoiler não liberado, carregamento e erro.
- **UX:** mobile com matriz navegável/scroll sem perder contexto, controles acessíveis e rótulos legíveis; dark mode, Transloco, Signals, OnPush; componentes em `.ts/.html/.scss` separados; modelos/tipos/constantes em arquivos próprios.
- Não usar imagens de páginas ou frames sem direito; preferir blocos de texto original, números e links de evidência.

## 6. Regras editoriais e explicabilidade

- Cada diferença deve mostrar **fonte, grau de verificação e contexto**. Interpretação subjetiva marcada como editorial.
- Campo “comentário do autor” só se for realmente registrado em fonte primária e autorizado; não deduzir motivação dos estúdios.
- Uma correspondência `UNKNOWN` não pode ser contabilizada como ausência/adaptação ignorada.
- Evitar algoritmo do tipo “capítulos por episódio = divisão linear” como resultado factual; só usar como visualização explicitamente hipotética/desligada em produção se útil.
- IA, se existente, pode sugerir candidato **a revisar**, jamais publicar sozinha ou buscar scans protegidos.
- Integrar o LoreGraph referenciando seus eventos versionados; não copiar as descrições narrativas para novo armazenamento duplicado sem necessidade.

## 7. Testes e segurança

### Unitários
- Muitos-para-muitos, capítulos extras, episódios especiais, versionamento, map idempotente, coverage matematicamente correta, mismatch de mídia e mapping desconhecido.

### Integração
- Constraints, FKs, conflitos de intervalos, duplicação, consulta de eventos/episódios, migrações reversíveis, guarda de mutação e status editorial.

### Spoiler e permissões
- Request sem progresso e request com limite anterior ao evento; direta por ID, compare, matrix, timeline, autocomplete, evidência, links e export. Testar ausência de vazamento inclusive se o cliente altera query parameters.

### UI/E2E
- Selecionar obra com origem conhecida → escolher episódio → ver capítulos mapeados → abrir comparação → alternar versão → estado correto e preservação do progresso; também obra original sem mangá e fonte indisponível.
- Teste Playwright desktop/mobile, dark mode, acessibilidade/teclado e imagens inexistentes.

Executar `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, suíte E2E pertinente e testes PG reais. Não enfraquecer lint AST.

## 8. Entregáveis SDD e gates

- `docs/audits/AUDIT-PHASE-26-ADAPTATIONLAB.md`
- Spec de correspondência e diferenças + contrato de limites de spoiler; ADR se semântica/arquitetura mudar.
- `docs/data-sources/ADAPTATION-CURATION-POLICY.md` com condições de uso de evidências.
- `docs/reports/REPORT-PHASE-26-ADAPTATIONLAB.md` com mapa de dados, matriz de fórmulas, limites, schema, migrations, contratos, screenshots evidenciais quando possível, E2E e pendências.
- Atualizar ROADMAP e TEST-MATRIX sem reescrever históricos.

### Critérios de aceite
- [ ] Mapeamento N:M de mídia/edição/episódio/capítulo funciona, é validado e idempotente.
- [ ] Diferenças são curadas, com evidência e status; desconhecido nunca vira “omitido”.
- [ ] Visões de correspondência, comparação e cobertura têm estados corretos e sem mídia protegida.
- [ ] Spoiler não vaza em API, UI, busca, timeline, metadados nem exportação.
- [ ] Escrita protegida; sem endpoint público de curadoria.
- [ ] Testes, migrações, build, lint, typecheck, SDD e relatório com resultados reais.

**Fase 27 fará a governança editorial completa. Não criar fluxo de contribuições públicas sem autenticação e revisão nesta fase.**
