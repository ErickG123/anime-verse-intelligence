# PROMPT 28 — Auditoria integrada, hardening, performance, E2E e consolidação do MVP

**Executar no repositório real AnimeVerse Intelligence.** Leia integralmente `docs/agent-workflows/references/CONTRATO-COMUM.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, specs, ADRs, políticas de fontes, `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, relatórios 21–27, e qualquer falha ainda aberta. **Não recomeçar o projeto, não fazer redesign irrestrito, não declarar release pronta sem evidências.**

## 0. Inventário inicial e gates

1. Confirmar a situação real de cada fase 21–27; para cada entrega marcar `IMPLEMENTADO`, `PARCIAL`, `BLOQUEADO`, `NÃO EXECUTADO` com referência a código/testes/log.
2. Auditar domínios e telas: catálogo; busca; detalhes; relações; StudioGraph; fontes externas; editoriais/anime↔mangá; LoreGraph; AdaptationLab; painel de curadoria.
3. Identificar divergências entre specs, contratos `packages/contracts`, API, frontend, schema PostgreSQL, Swagger/OpenAPI e documentação.
4. Registrar riscos/achados com severidade `CRÍTICO/ALTO/MÉDIO/BAIXO`, componente, reprodução, impacto, correção e responsável proposto.
5. Abrir `docs/audits/AUDIT-PHASE-28-MVP-READINESS.md` antes de modificações. Priorizar **bugs reais e falhas de segurança/integridade**; não aproveitar fase final para migrar frameworks sem necessidade.

## 1. Critérios integrados de produto

### Jornada A — Catálogo e dados locais
- PostgreSQL 17 healthy, migrações completas, dataset anime-offline íntegro ou bloqueio documentado; navegar e filtrar milhares de registros quando houver carga real.
- Busca por Unicode e títulos alternativos, paginação, ordenação determinística, detalhes com imagens/URLs tratadas e estados incompletos.
- Importação idempotente, sem duplicidade; relações e external IDs corretos. Reprocessar fixture e, quando disponível, amostra grande real de forma reprodutível.

### Jornada B — StudioGraph
- Abrir obra, filtrar por estúdio/papel, expandir nós, visualizar proveniência, alternar caminhos e recuperar de falha de provedor sem quebrar catálogo.
- Limites do grafo e alternativa tabular funcionam no desktop e mobile; sem colaboradores inventados.

### Jornada C — Dados editoriais
- Consultar mangá/origem com QID/identidade externa inequívoca; exibir autores e editoras corretamente; ausência e conflito de dados comunicados.
- Falha ou quota de MangaUpdates/Wikidata/AniList não deve derrubar o serviço local, disparar loop de retries nem vazar segredos.

### Jornada D — LoreGraph e spoilers
- Selecionar obra, mídia e progresso, abrir grafo, timeline, eventos e evidências aprovadas.
- Tentar recuperar evento futuro por API, detalhes, sugestões, busca, export, URL direta e metadados de grafo: **sem vazamento**.

### Jornada E — AdaptationLab
- Abrir anime com mangá associado, escolher episódio e capítulo/edição, visualizar mapa, diferenças revisadas e cobertura contextualizada.
- Conferir casos de dados insuficientes, obras anime-original, remakes e episódios especiais; unknown não aparece como omitido.

### Jornada F — Curadoria
- Usuário sem sessão não altera nada; permissões por papel; aprovar proposta com razão/evidência/licença; conflito simultâneo gera 409; publicar ou retratar e registrar trilha auditável; público só recebe dados liberados.

## 2. Auditoria arquitetural e qualidade de código

- Procurar violações feature-based, dependências cruzadas, barrels cíclicos, `template`/`styles` inline, modelos/constantes exportados de componentes/services, `any`, estado mutável difuso, observables não liberados e lógica de negócio no Angular.
- Auditar Fastify: plugins encapsulados, ordem de registro, schemas de entrada/saída, error mapping, tratamento de auth, DI real adotada, logs, handlers de domínio e fronteiras de fonte.
- Auditar banco: migrations em ordem, constraints, índices sem uso, N+1, transações, locking, cardinalidade e integridade de origem por campo.
- Revisar importadores/clients: streaming JSONL, paginadores, retry/backoff, rate limit, timeout, cancelamento, fail closed diante de direitos indefinidos.
- Corrigir somente duplicações e hotspots demonstrados; preservar compatibilidade pública e atualizar ADR ao modificar contratos arquiteturais.

## 3. Segurança — checklist executável

- Validar autenticação/autorização e IDOR em **todas** as rotas admin e mutações (inclusive deep links, IDs alternativos e endpoints legados).
- Revisar proteção CSRF conforme sessão, CORS, HTTP security headers, limites de payload, rate limit, sanitização de conteúdo/URLs, XSS, SSRF, SQL injection, log injection e path traversal em importação/exportação.
- Checar secrets e `.env` ignorados pelo Git; dependências vulneráveis via auditoria disponível; classificar alertas e não instalar updates major às cegas.
- Testar provedor retornando HTML malicioso, erros GraphQL, 429, 403, timeout, payload inválido, links hostis e dados de spoilers; não expor credenciais ou conteúdo sem licença.
- Confirmar regras de mídia, copyright, políticas de AniList/MangaUpdates/Wikidata, origem dos dados e retenção. Desativar recurso ilegítimo sem improvisar contorno.
- Revisar política de backups/restore PostgreSQL e retenção de audit trail (testar recuperação em ambiente isolado quando viável).

## 4. Performance real e métricas

Documentar ambiente de benchmark (CPU/RAM/Node/PG, quantidade de obras, versões da app, dataset e status do cache). Medir p50/p95 e tempo total, sem afirmar números sem execução.

- API: listagem, busca unicode, detalhes, relações, vizinhança StudioGraph, query narrativa com spoiler, mapping adaptation e fila editorial.
- PostgreSQL: `EXPLAIN (ANALYZE, BUFFERS)` nas consultas críticas, plano, rows, índices e regressão antes/depois das mudanças.
- Front: Lighthouse/Web Vitals quando disponível, tamanho de bundle/chunks, lazy routes, tempo até interação do catálogo e grafos, número de nós e tempo de layout, memória e cancelamento de requisições.
- Operações: velocidade de importação e reimportação, memória de worker, idempotência; quotas externas em ambiente de simulação sem chamadas massivas.
- Definir **orçamentos plausíveis apoiados em baseline medido**, não metas arbitrárias sem contexto. Se falhar, otimizar pontualmente, registrar delta e compromissos de escala.

## 5. Observabilidade e resiliência

- Logs JSON estruturados com requestId/trace correlacionável entre Fastify, DB e jobs, sem token, dados pessoais desnecessários ou payload externo proibido.
- Health/liveness e readiness coerentes: health do processo ≠ PostgreSQL disponível ≠ provedores externos online. Provedor externo não deve transformar liveness em indisponibilidade.
- Métricas mínimas: requests/errors/latency, importação, status de sync, taxa de respostas externas 429/5xx, conflitos de identidade, filas de revisão e spoilers bloqueados, **sem cardinalidade explosiva**.
- Falhas simuladas: PostgreSQL desligado, migrations pendentes, dataset inválido, quota externa atingida, dado não licenciado, erro de rede, usuário sem acesso, conflito de edição.
- Falhas recuperáveis têm mensagens úteis e retry apenas quando seguro; circuit breakers e limites configuráveis sem dependências desnecessárias.

## 6. Testes automatizados e matriz de cobertura

### Unitários e componentes
- Mappers, schemas, formatos de mídia/edição, grafos, filtros, perfis, paginação, spoilers, cobertura de mapeamento, statuses editoriais, concorrência.

### Integração DB/API
- PostgreSQL real isolado, migrações, constraints, ids internos, importação idempotente, queries críticas, transações, versionamento de auditoria, endpoints com `inject()` ou equivalente Fastify, contratos e OpenAPI.

### Contract tests
- API ↔ frontend, versionamento de DTOs, campos opcionais, erros, limites, resposta parcial/fallback; todas as fontes externas mockadas no CI.

### E2E Playwright
- Cobrir jornadas A–F com fixtures determinísticas; testar ao menos viewport desktop e mobile, dark/light, teclado, pt-BR/en, erro de rede, sessão expirada e spoiler negativo.
- Separar suíte rápida de CI da suíte pesada com Docker real/dataset grande. Não confundir smoke com E2E completo.

### Política e segurança
- Falha de licença bloqueia publicação/persistência; fonte externa sem permissão não gera scraping/cache; APIs admin sem auth retornam 401/403, conflito de versão 409, conteúdo futuro não vaza por ID conhecido.

### Conclusão de testes
- Executar scripts reais: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, E2E real, migrations status, auditoria AST e testes pertinentes de carga/segurança. Registrar comando, versão, contagem e falhas. **Não silenciar suíte falha nem fabricar cobertura**.

## 7. UX e acessibilidade — aceite visual

- Auditar header, navegação, filtros, pesquisa, layout de cards, telas de detalhes, expansão de grafos, formulário editorial e comparador de adaptação.
- Corrigir contrastes, estados hover/foco, centralização, dropdowns/overlays, breadcrumbs, scroll dentro do grafo, visibilidade do cursor, dark mode e responsividade sem mudar a identidade inteira.
- Reduzir excesso de informação com hierarquia visual, progressive disclosure, ações primárias claras e estados vazios úteis.
- Testar leitor de tela/teclado ou axe automatizado onde possível; rotular campos, feedback de erro, foco em modais, tabelas/listas alternativas aos grafos.
- Evitar skeleton infinito; revalidar cancelamento/race conditions após troca de filtros.

## 8. Preparação de release e operação

- Revisar `.env.example`, `compose.yaml`, scripts de instalação/migração/importação, scripts CLI, README, troubleshooting, restore, execução de produção e CI para ambiente Windows e Linux se suportados.
- Pipeline GitHub Actions: lint/typecheck/build/test, teste integração PostgreSQL quando viável, E2E seletivo, artefatos de relatórios, detecção de secrets e falha se regressão crítica. Versionamento seguindo Convenções já documentadas, sem publicar release automaticamente sem autorização.
- Confirmar tratamento de migrações **forward-only ou rollback definido**, backup antes de deploy e procedimentos de restauração.
- Atualizar dependências apenas com necessidade justificada e testes compatíveis; evitar versões não verificadas.
- Construir matriz go/no-go: impeditivos de release (dados ilegais, auth quebrada, spoilers vazando, migracão falha, E2E crítico falho) vs débitos não bloqueantes.
- Não criar deploy em serviço pago, enviar dados a terceiros ou configurar agendamentos externos sem autorização.

## 9. Entregáveis documentais

Criar/consolidar, sem duplicar documentação canônica:

- `docs/audits/AUDIT-PHASE-28-MVP-READINESS.md`
- `docs/reports/REPORT-PHASE-28-MVP-READINESS.md`
- `docs/testing/TEST-MATRIX.md` atualizada com cobertura real e lacunas
- `docs/ROADMAP.md` com status final, versão recomendada e próximas fases
- `docs/operations/RELEASE-CHECKLIST.md` e `docs/operations/RUNBOOK.md` (ou caminhos canônicos existentes)
- `docs/architecture/decisions/` atualizado apenas quando decisão exigir

### Formato obrigatório do relatório

1. Baseline e ambiente.
2. Matriz por fase 21–28: status, arquivos, specs, testes, evidências e riscos.
3. Bugs identificados/solucionados, severidade e reprodução.
4. Esquema/migrações e integridade.
5. Cobertura de fonte/dados e direitos.
6. Segurança (incluindo auth, spoiler, restrições legais).
7. Resultados unitários/integração/E2E/contratos.
8. Benchmarks antes/depois com setup e amostras.
9. Resultado visual/responsividade/acessibilidade.
10. Pipeline/operabilidade, backup e troubleshooting.
11. Pendências classificadas e decisão **GO / NO-GO**, com justificativa.

## 10. Critérios finais de aceite

- [ ] Jornadas A–F implementadas **onde autorizadas** e verificadas com dados reais/fixtures diferenciadas.
- [ ] Catálogo local funciona independentemente das APIs externas.
- [ ] Sem vazamento de spoilers em nenhuma rota pública.
- [ ] Sem rotas administrativas vulneráveis ou credenciais padrão.
- [ ] Sem armazenamento/redistribuição proibidos e com proveniência consistente.
- [ ] Build, lint AST, typecheck, unit/integration, testes E2E críticos e CI aplicáveis com evidência.
- [ ] Performance medida e gargalos críticos tratados ou bloqueio documentado.
- [ ] Responsividade, acessibilidade e dark mode sem regressões críticas.
- [ ] Importação/migrações/backup/restore e runbook revisados.
- [ ] Relatório e matriz SDD completos com decisão GO/NO-GO transparente.

**Não chamar o MVP de pronto se qualquer impeditivo crítico persistir.** Caso o estado seja NO-GO, registrar todas as entregas seguras feitas e uma fila priorizada de correções. Evitar trabalho especulativo fora do escopo desta fase.
