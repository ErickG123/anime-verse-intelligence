# PROMPT 29 — Playwright E2E Real, Matriz de Navegadores e Regressão de Segurança

**Projeto:** AnimeVerse Intelligence. **Executor:** Antigravity CLI. **Dependência:** Fase 28; 21–28 e seus relatórios. **Leitura mandatória:** `CONTRATO-TRANSVERSAL.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**` e documentos SDD anteriores.

## Missão

Encerrar a principal lacuna do release candidate `0.1.0-rc.1`: testes end-to-end em **navegadores reais**, do Angular até Fastify e PostgreSQL, incluindo cenários de indisponibilidade externa, integridade das rotas read-only e política anti-spoiler. Não declarar E2E aprovado com base apenas em Vitest ou `fastify.inject`.

## 1. Pré-auditoria, inventário e desenho do teste

- Inspecionar os scripts pnpm, as portas configuráveis, o `compose.yaml`, rotas Angular atuais, endpoints, `docs/reports/REPORT-PHASE-28-MVP-READINESS.md`, `docs/testing/TEST-MATRIX.md` e testes existentes.
- Conferir se existe Playwright, qual versão, se o ambiente suporta navegador real (Windows 11 ou runner Linux), se há conflito de portas e dados para testes; mapear features reais: catálogo, detalhe, busca, relações, StudioGraph, LoreGraph, AdaptationLab, Data Sources e rotas de admin.
- Produzir `docs/audits/AUDIT-PHASE-29-BROWSER-E2E.md` com lacunas, risco de spoilers, dependências e testes prioritários. Não inventar tela/rota inexistente: se não existir, registrar lacuna e criar o mínimo necessário apenas quando parte do escopo.
- Catalogar baseline dos 47 testes informados (confirmar contagem no repositório), sem alterar suites para fazê-las passar artificialmente.

## 2. Configurar Playwright integrado ao monorepo

- Escolher uma única configuração `@playwright/test` compatível com versões reais de Node/Angular/pnpm; evitar infraestrutura duplicada. Preferir `apps/web/e2e/` e `apps/web/playwright.config.ts`, ou estrutura já existente se adequada.
- Criar scripts coerentes, como `test:e2e`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:smoke`, `test:e2e:report` no package certo e entradas de raiz; adaptar nomes e comandos ao monorepo.
- Instalar binários Chromium, Firefox e WebKit (`pnpm exec playwright install` ou equivalente), com dependências nativas Linux em CI. Executar todos os projetos compatíveis; não registrar cross-browser como aprovado sem executá-los.
- Configurar `webServer` para levantar API + Angular com portas parametrizadas, timeout e `reuseExistingServer` seguro; evitar que testes usem uma instância de produção ou banco pessoal. Separar preparação da base e teardown.
- Configurar `baseURL`, projetos de navegador, retries moderados em CI, traces em falha, screenshots em falha, vídeos apenas quando úteis, reporter HTML/JUnit, artefatos ignorados no git e preservados em CI.
- Tratar determinismo de locale/timezone, preferências de movimento e viewport; não depender de horários reais ou respostas aleatórias de terceiros.

## 3. Ambiente e dados determinísticos

- Utilizar PostgreSQL **isolado para E2E**, com migrações reais, fixture pequeno que contenha relações, dados editoriais verificados, eventos com spoiler e mapeamentos de adaptação; sem dados falsos rotulados como factuais.
- Preferir containers/test containers ou Compose isolado nomeado; nunca apagar dados de desenvolvimento. Uma mesma suíte deve poder ser executada duas vezes sem falhas de unique, FK ou ordem.
- Criar fábrica de fixtures com identificadores estáveis, títulos variados (inclusive japonês), relações complexas, perfis de progressão anti-spoiler; executar limpeza somente no namespace/banco dedicado.
- Mockar AniList/MangaUpdates/Wikidata em testes de cenários determinísticos, no limite HTTP da API/backend quando possível; criar conjunto separado de smoke real, opt-in, pequeno, respeitando licenças e limites. Não gerar testes que dependam da rede externa por padrão.
- Se telas dependem de dados editoriais e admin ainda está fail-closed, provisionar fixtures somente em mecanismo **test-only** com validação de ambiente, nunca via bypass de autorização nas rotas reais.

## 4. Suítes E2E obrigatórias

### 4.1 Catálogo e descoberta
- Abrir a aplicação e observar carregamento sem erro de JS; navegar por menu/links e deep links; testar not-found.
- Busca por título exato, parcial, acentuação, título japonês, valores inválidos; filtros e ordenação combinados; paginação; back/forward; URL compartilhável; zero resultados; timeout/500; controle de requisições obsoletas; acessibilidade por teclado.
- Comparar registros exibidos com respostas da API e banco do fixture; não aceitar contagens fictícias.

### 4.2 Detalhes e relacionamentos
- Navegar catálogo → detalhe → relações → outro anime → voltar; evitar vínculo incorreto entre temporadas, filmes e remakes.
- Mostrar origem dos dados quando disponível; tratar imagem quebrada, valores nulos e integração indisponível.
- Validar grafos com Cytoscape: renderização real (nós/arestas esperados), navegação, seleção, pan/zoom, limites de expansão, filtros, redes de colaboração e caminho mínimo onde existir; não testar apenas a presença da tag canvas.

### 4.3 LoreGraph e spoiler
- Criar progressos de leitura diferentes (incluindo sem progresso e progresso suficiente), solicitar mesmos endpoints por navegação normal e **por ID direto, busca, relação, exportação e mídia**.
- Garantir no **payload HTTP** ausência de texto, nomes, links e identificadores protegidos, não apenas ausência do DOM. Testar explicitamente 403/semântica contratual para acesso direto proibido.
- Testar troca de progresso, dados de mídia incompatível, cache e URLs compartilhadas. Não permitir vazamento em SSR/logs nem respostas pré-carregadas.

### 4.4 AdaptationLab
- Selecionar uma obra com mapeamento validado; comparar episódio/capítulo e navegar; verificar estados VERIFIED, PARTIAL e UNKNOWN conforme contratos existentes.
- Verificar que UNKNOWN jamais aparece como OMITTED e que percentuais têm denominador, fonte e escopo claros.
- Testar ausência de correspondências, evidências faltantes, discrepâncias e progressão anti-spoiler.

### 4.5 Administração e segurança
- Até Fase 31, toda rota protegida sem identidade continua 401/403; POST de decisão editorial com payload inválido e sem sessão deve retornar 401 antes de revelar detalhes de schema.
- Testar GET/POST/PUT/PATCH/DELETE protegidos conforme rotas reais, inclusive IDOR e respostas consistentes; não criar credenciais padrão ou bypass para passar E2E.
- Se OIDC ainda não existir, testar o fail-closed e marcar cenários de escrita autenticada como BLOQUEADOS, não como aprovados.

### 4.6 Resiliência e acessibilidade
- Offline da API, reinicialização do banco, falha externa, 429 do fornecedor (mock), estado vazio, carregamento lento e request cancellation.
- Testar teclado, foco, labels, contraste programático aplicável e `axe-core` se compatível; registrar avaliações humanas necessárias.
- Executar desktop (ex. 1440×900) e mobile (ex. 390×844) com projetos adequados; verificar overflow horizontal e controles tocáveis.

## 5. Organização e qualidade dos testes

- Usar locators semânticos (`getByRole`, `getByLabel`, `getByText`) e `data-testid` somente onde essencial; evitar seletores frágeis por classes CSS.
- Usar `expect.poll`, asserções web-first e esperas por condição; **não usar sleeps fixos** como solução.
- Page Objects só para fluxos compartilhados relevantes; fixtures reutilizáveis; testes independentes; paralelismo adequado ao banco.
- Detectar e relatar flakiness por múltiplas execuções, não mascarar falhas com retries excessivos.
- Nunca gravar tokens, cookies, dumps de banco ou informações sensíveis em screenshots/traces publicados.

## 6. CI GitHub Actions

- Adicionar job E2E separado ou melhorar workflow existente; Node/pnpm conforme lockfile; PostgreSQL isolado com healthcheck; `pnpm install --frozen-lockfile`; migrations, seed de teste, boot Fastify/Angular e Playwright.
- Instalar navegadores e dependências, limitar concorrência, configurar caching adequado e exportar traces/screenshots/JUnit em falhas; não depender de serviço pago.
- Smoke E2E em PR; suíte completa em main ou agenda se o custo justificar, com documentação de cobertura e frequência; bloquear merge nas regressões críticas.

## 7. Validações e evidências

Executar `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, além do E2E no(s) navegador(es), reportando contagem por projeto, falhas, tempo, relatórios e screenshots. Validar `GET /api/v1/health`, `/api/v1/ready`, `/docs/json`, e APIs reais usadas. Reexecutar um subconjunto crítico ao menos duas vezes. Identificar recursos indisponíveis em vez de simular resultados.

## 8. Entregáveis documentais

- `docs/audits/AUDIT-PHASE-29-BROWSER-E2E.md`
- `docs/reports/REPORT-PHASE-29-PLAYWRIGHT-E2E.md`
- `docs/testing/E2E-PLAYWRIGHT-STRATEGY.md` com execução Windows/CI, dados de teste e troubleshooting.
- Atualizações `docs/testing/TEST-MATRIX.md`, `docs/ROADMAP.md`, `docs/operations/RELEASE-CHECKLIST.md`; ADR apenas se decisão arquitetural nova.

## 9. Gate de aceite

- [ ] Playwright instalado e integrado sem duplicação de toolchain.
- [ ] Banco E2E isolado e fixtures reproduzíveis.
- [ ] Catálogo, navegação, StudioGraph, LoreGraph, AdaptationLab e read-only testados em browser real.
- [ ] Anti-spoiler verificado no payload da API e em rotas diretas.
- [ ] Rotas admin continuam fail-closed sem identidade.
- [ ] Testes de estados vazios, falhas de rede e telas responsivas.
- [ ] CI e artefatos de falha configurados.
- [ ] Lint/typecheck/build/unit/integration/E2E executados; cada navegador explicitamente reportado.
- [ ] Documentação e relatório completos.

**Resultado esperado:** evidência real de fluxos completos, com lista de riscos não cobertos e preparação objetiva para a auditoria visual da Fase 30. Se navegador não executar, status PARCIAL/BLOQUEADO; nunca CONCLUÍDO.
