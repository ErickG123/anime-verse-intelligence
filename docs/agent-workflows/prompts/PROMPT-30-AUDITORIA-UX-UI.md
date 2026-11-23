# PROMPT 30 — Auditoria Visual Completa, UX, Acessibilidade e Consistência da Interface

**Projeto:** AnimeVerse Intelligence. **Executor:** Antigravity CLI. **Dependência:** Fase 29 ou registro explícito de bloqueios. **Leitura obrigatória:** `CONTRATO-TRANSVERSAL.md` e documentos SDD anteriores.

## Objetivo

Transformar o MVP funcional em uma experiência **clara, agradável, consistente e eficiente**, sem aparência de painel genérico artificial, layout de revista/editorial excessivamente carregado ou navegação confusa. Revisar as telas reais, corrigir as causas de problemas visuais e de interação e preservar conteúdo, segurança e funcionalidades já aprovadas.

**Não gerar um redesign completo no escuro.** Exigir auditoria visual com screenshots reais, priorização de problemas e validação posterior nos navegadores.

## 1. Diagnóstico inicial obrigatório

1. Ler `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, `docs/ROADMAP.md`, ADRs de design, relatórios 21–29, `docs/testing/TEST-MATRIX.md` e E2E existentes.
2. Iniciar a aplicação com catálogo real ou conjunto representativo **identificado como fixture**; verificar integração Fastify/PostgreSQL.
3. Listar todas as rotas efetivas, incluindo Home, Catalog, Anime Detail, Relations, StudioGraph, LoreGraph, AdaptationLab, Sources/About e Admin quando existente; não deduzir telas a partir apenas dos nomes das pastas.
4. Produzir capturas de cada tela nos modos claro e escuro e em viewports desktop 1440×900, tablet 768×1024, mobile 390×844 e mobile estreito 320×720 quando viável; documentar browser, URL, dados usados e estado da página.
5. Inspecionar Header, Sidebar, pesquisa, formulário, filtros, paginação, cards, modais, menus, estados vazios, loading, erros, gráficos e grafos; capturar interações reais (não apenas screenshot inicial).
6. Verificar Console, Network, erros de JS, warnings Angular, CLS/layout shift, overflow, cortes, scroll horizontal e navegação por teclado.
7. Registrar achados `UX-001...`, severidade P0–P3, evidência de antes, impacto, reprodução, componente raiz e critérios de correção.
8. Gerar `docs/audits/AUDIT-PHASE-30-UX-UI.md` antes da implementação.

## 2. Critérios de identidade visual

- Projetar uma linguagem própria de uma ferramenta de pesquisa de anime/mangá, focada em **legibilidade, informação e exploração**, e não imitar MyAnimeList ou layouts genéricos de dashboards.
- Usar hierarquia clara, grid consistente, tipografia legível, espaçamentos normalizados, contraste adequado, imagens de obra como complemento e não substituto de informação.
- Não utilizar emojis como ícones na interface; usar biblioteca de ícones livre já adotada, verificando licença.
- Padronizar tokens CSS/SCSS existentes para cores, tipografia, spacing, radius, sombras, bordas, elevation, z-index e motion. Não criar tokens duplicados em múltiplas features.
- Dark e light com contrastes e estados hover/focus/active/desabilitado adequados. Evitar fundos escuros com textos acinzentados ilegíveis e tonalidades dispersas por tela.
- Reduzir ruído visual, títulos exagerados, excesso de cards e espaços vazios que comprimam dados relevantes. Responsividade deve preservar informações prioritárias.
- Respeitar `prefers-reduced-motion`; transições sutis e funcionais, sem animações meramente decorativas.

## 3. Layout e navegação global

- Auditar desktop sidebar/header e experiência mobile. Determinar responsividade por breakpoints de conteúdo, não por números arbitrários.
- Verificar alinhamento de títulos, ações, tabs e breadcrumbs; posicionamento de pesquisa global versus pesquisa local; estados ativos de navegação; menus colapsados com tooltips e labels acessíveis.
- Revisar sidebar com scroll independente quando necessário e foco visível. Evitar layout com duas barras de pesquisa quase idênticas sem distinção funcional.
- Checar overlay de modais, dropdowns, popovers e menus em viewport reduzido; fechamento por Escape, foco devolvido e scroll lock.
- URLs e filtros devem ser reprodutíveis/compartilháveis quando faz sentido; preservar back/forward e feedback de navegação.

## 4. Catálogo, busca e detalhes

### Catálogo
- Consolidar design de cards/listagem, densidade, metadados exibidos, ícones, badges sem excesso, imagem fallback e títulos longos em idiomas diferentes.
- Pesquisa com debounce/cancelamento de requests e estados de busca; filtros agrupados por significado, clear/reset visível, ordenação consistente, paginação compreensível e resultados carregados progressivamente quando pertinente.
- Testar com milhares de obras via API paginada, sem despejar coleção inteira no DOM. Avaliar tamanhos de listas, skeletons, virtualização somente se medido necessário.

### Detalhes
- Informação principal em primeiro plano; relações, staff, estúdios, fonte, médias, temporadas e disponibilidade agrupados de modo coerente.
- Diferenciar informação local e enriquecimento externo e comunicar indisponibilidade sem sugerir que obra não tem personagens.
- URLs externas seguras; alt texts; imagens autorizadas; fallback confiável; descrição sanitizada.

## 5. Grafos especializados

### StudioGraph
- Criar/ajustar legenda consistente para obra, estúdio, profissional; modo PRODUCTION e COLLABORATION, filtros de função/ano/obra; botões de zoom, reset, centralizar, fit e ajuda.
- Evitar explosão de nós, linhas atravessadas, labels sobrepostas e perda de contexto. Renderização incremental de vizinhos e caminho mínimo com feedback de seleção claro.
- Para mobile: viewport mínimo útil, painel de detalhes em drawer, controles touch e opção de visualização textual/lista como alternativa acessível.
- Fazer medidas reais de performance com cenários pequenos, médios e limites de tamanho.

### LoreGraph
- Não revelar títulos, textos, nomes ou contagens de conteúdo bloqueado por spoiler; configuração de progresso explícita, persistência adequada e mensagens neutras para nós ocultos.
- Testar diferentes níveis de progresso na API e UI. Layout navegável com expansão controlada, legenda e descrição por teclado.

### AdaptationLab
- Comparador episódio ↔ capítulo com legenda para VERIFIED, PARTIAL, UNKNOWN, OMITTED somente quando comprovado; exibir fontes e denominadores de métricas.
- Distinguir ausência de mapeamento de ausência de adaptação; evitar gráficos de cobertura enganosos.
- Mobile com seleção em sequência ou tabela rolável acessível e clara; garantir navegação sem hover.

## 6. Estados de interface e usabilidade

- Padronizar skeleton, loading, empty, error, forbidden, no network e rate-limited, com mensagem e ação útil (retry apropriado) sem loop.
- Toasts e notificações com duração apropriada, acessibilidade e informação concreta; não mascarar falhas.
- Formulários com labels reais, validação inline, mensagens de erro úteis, teclado e botão primário claro. Evitar autenticação falsa ou botões que prometem ações indisponíveis.
- Revisar tabela/listagem administrativa apenas se a Fase 31 habilitou o fluxo; em caso contrário, apresentar acesso bloqueado adequadamente.
- Validar rotas não encontradas, listas vazias, títulos extensos, strings internacionais e respostas parciais.

## 7. Acessibilidade e i18n

- Validar navegação somente com teclado, foco, `aria-*` apropriados, semântica de headings, labels, modais, dialogs, tablist, tabelas, links e live regions.
- Executar `axe-core`/auditoria automática (se compatível) e testes manuais; reportar WCAG 2.2 AA como meta, mas não declarar conformidade total por scanner automático.
- Validar en/pt-BR com strings reais, textos longos, truncamento seletivo, formatação de datas/números, plurais e ausência de textos hardcoded.
- Contrast check no dark/light, zoom de navegador 200%, high contrast quando viável, reduced motion.

## 8. Implementação segura e governança Angular

- Reaproveitar componentes comuns antes de criar novos. Evitar global CSS de seletores frágeis e overrides de terceiros em cadeia.
- `.component.ts/.html/.scss` separados, OnPush e Signals; interfaces em `.model.ts`, constants em `.constants.ts`; manter fronteiras e AST ESLint.
- Não alterar API ou schema sem prova de necessidade e cobertura; ao detectar bug do backend, corrigir na fonte e adicionar regressão.
- Não trocar biblioteca de design/grafo sem avaliação documentada e sem necessidade.
- Não introduzir componentes que não tenham uso real ou adicionar abas vazias sem razão.

## 9. Testes visuais e funcionais

- Estender Playwright com cenários funcionais por tela e screenshots de referência com procedimentos de atualização controlados. Não aceitar snapshots atualizados automaticamente como prova de correção.
- Testar mobile touch, teclado, filtros, paginação, grafos, links de navegação, erros, loading, anti-spoiler e dark/light.
- Testar Chromium e Firefox/WebKit nas páginas críticas conforme capacidade do runner; documentar qualquer navegador não executado.
- Executar métricas de performance (Lighthouse ou equivalente, LCP/CLS/INP quando disponível), evitando alvos inventados; registrar baseline, mudanças e regressões.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e` ou comandos equivalentes; imagens comparativas antes/depois no relatório com nomes de arquivos (não incorporar tokens ou segredos).

## 10. Entregáveis e critérios de aceite

- `docs/audits/AUDIT-PHASE-30-UX-UI.md`: inventário visual, capturas, checklist por página, severidades e before.
- `docs/reports/REPORT-PHASE-30-UX-UI.md`: melhorias implementadas, after, itens adiados e medições.
- Atualizar design tokens/documentação canônica, `docs/testing/TEST-MATRIX.md`, `docs/ROADMAP.md`, relatório do Playwright e `docs/operations/RELEASE-CHECKLIST.md`.

Gate:

- [ ] Todas as rotas efetivas auditadas visualmente em pelo menos desktop e mobile com evidências.
- [ ] Sem overflow ou controles inacessíveis nas telas prioritárias.
- [ ] Navegação, pesquisa, filtros, grafos e comparador funcionalmente testados.
- [ ] Estados loading/empty/error e anti-spoiler revisados, inclusive payload onde aplicável.
- [ ] Contraste, foco, labels, teclado e i18n avaliados.
- [ ] Dark/light consistentes; tokens centralizados; sem atalhos de CSS.
- [ ] Screenshots antes/depois, testes e métricas no relatório.
- [ ] Sem regressão de contratos, catálogo, rotas ou segurança.

**Resultado esperado:** experiência navegável e visualmente consistente, com problemas residuais priorizados e prova real das correções. Não declarar "design aprovado" sem confronto visual de antes/depois.
