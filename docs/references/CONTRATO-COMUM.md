# CONTRATO COMUM — Todas as fases 23–28

Este arquivo é parte **obrigatória de cada prompt**. Se conflitar com o estado real do repositório, registre o conflito e reconcilie com o ADR existente; não sobrescreva decisões silenciosamente.

## A. SDD e protocolo de execução

1. **Ler antes de agir:** `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, specs, ADRs, auditorias, relatórios anteriores (em especial da fase imediatamente precedente). Verificar também scripts, Git status, migrações e estrutura efetiva de `apps/web`, `apps/api`, `packages/contracts`.
2. **Diagnosticar:** escrever `docs/audits/AUDIT-PHASE-XX-<tema>.md` com mapa de código, contratos, cobertura, riscos, licenças e bloqueios. Se já houver auditoria equivalente, atualizá-la sem duplicar.
3. **Especificar primeiro:** registrar requisitos funcionais e não funcionais, fluxos, casos adversos, critérios de aceite verificáveis. Atualizar specs/ADRs apenas quando aplicável; numerar de acordo com convenção real.
4. **Implementar incrementalmente:** reutilizar serviços, layouts, componentes, tabelas e infraestrutura; planejar migrações reversíveis, sem drop/truncate destrutivos. Evitar pastas vazias, arquivos genéricos gigantes e abstrações especulativas.
5. **Testar com evidências:** unitário, integração, contratos, UI, E2E quando possível; fixtures determinísticos e offline para CI; smoke externo limitado e autorizado quando pertinente. Executar os scripts **reais** do repositório, ao menos lint, typecheck, build, test, e testes E2E se disponíveis.
6. **Consolidar documentação:** `docs/ROADMAP.md`, matriz de testes, specs, ADRs, documentação de fontes, README, auditoria e `docs/reports/REPORT-PHASE-XX-<tema>.md`. Incluir arquivos afetados, comandos e saídas resumidas, resultados, riscos, métricas e pendências.
7. **Gate:** a próxima fase só pode ser considerada pronta para prosseguir quando seus pré-requisitos funcionais e de integridade estiverem satisfeitos; se a restrição for externa, entregar parte independente segura e classificar corretamente como **PARCIAL** ou **BLOQUEADO**.

## B. Invariantes da arquitetura

- **Frontend:** Angular 22, standalone/Signals/OnPush/zoneless, lazy routes quando fizer sentido, Transloco (pt-BR/en), dark mode, responsividade e acessibilidade.
- **Feature-first:** `apps/web/src/app/features/<dominio>/{pages,components,models,services,stores,constants,...}`; `core` infraestrutura transversal, `shared` reutilização genuína, `layout` shell. Evitar import interno de uma feature por outra; preferir contratos públicos compartilhados.
- **Separação estrita:** componentes `.component.ts` + `.component.html` + `.component.scss` (e specs adequados); nada de `template:` ou `styles:` inline. Modelos/interfaces em `.model.ts`, tipos auxiliares em `.types.ts`, enums em `.enum.ts`, constantes nomeadas em `.constants.ts`, mappers/utils separados quando reutilizáveis. Não exportar contratos/constantes de componentes ou services.
- **Backend:** Fastify 5/TypeScript strict, validação JSON Schema/TypeBox e OpenAPI alinhados, modularização coesa, handlers finos, serviços de domínio claros, queries eficientes, Problem Details ou formato de erro já adotado.
- **DB:** PostgreSQL 17 com Drizzle, migrações incrementais, integridade referencial, IDs internos estáveis, índices justificáveis, auditoria de consultas críticas, sem exclusões destrutivas implícitas.
- **Qualidade:** preservar ESLint custom AST, Prettier, Vitest, Playwright e CI existentes; não desligar testes nem enfraquecer regras para aprovar fase.
- **Operação:** logs estruturados, correlação, métricas sem dados sensíveis, health e degradação graciosa para fontes externas. Não criar Docker/Redis/filas adicionais sem evidência de necessidade.

## C. Dados externos e propriedade intelectual — gate obrigatório

- Cada provedor tem um registro de políticas com `source`, URL oficial, data da consulta, restrições de acesso, quota, cache, persistência, atribuição, redistribuição, uso comercial, imagens e retenção. **Ausência de autorização não é autorização**.
- **AniList**: consultas pontuais conforme condições atuais; vedado replicar base, fazer coleta massiva ou usar como storage; atenção a serviços concorrentes. Se uma funcionalidade exigir armazenamento persistente proibido, desabilitá-la e usar somente evidência própria/autorizada ou bloquear.
- **MangaUpdates**: registrar política e autorização explícita para operações de escrita/armazenamento; respeitar atribuição e não contornar restrições.
- **Wikidata**: dados estruturados CC0 em geral, mas imagens/materiais ligados têm direitos distintos; SPARQL com identificação de cliente, volume moderado, limites e observabilidade.
- **Wikis, editoras, distribuidoras e redes sociais:** não raspar conteúdo sem permissão; `robots.txt` e termos, proibições de reprodução e regras de API; links não transferem licenças de imagem/texto.
- **Conteúdo de obras:** não incorporar scans, capítulos integrais, quadros, cenas, diálogos ou legendas protegidos sem licença. Preferir metadados, resumos originais breves, fatos, hyperlinks de origem e anotações autorizadas; IA não afasta direitos autorais.
- **Confiabilidade:** todo dado derivado ou manual tem proveniência e `status` (rascunho, em revisão, aprovado, rejeitado) e confiança/método quando apropriado; não publicar inferências como fatos confirmados.
- **Independência:** o catálogo local deve permanecer funcional sem AniList/MangaUpdates/Wikidata. Sem integração forçada e sem mocks apresentados como dados reais.

## D. Contratos compartilhados para o domínio

- IDs internos UUID ou padrão real do projeto; `external_identifiers` com fonte e id original. Nunca usar título aproximado como vínculo definitivo.
- Distinguir `anime`, `manga`, `person`, `character`, `company`, `arc`, `event`, `adaptation mapping`, `source`, `evidence`, `review`. Evitar misturar obra/franquia, temporada/episódio, volume/capítulo, edição e tradução.
- Time de créditos: relações contextualizadas à obra/episódio, papel e fonte; profissionais não equivalem a estúdios.
- Dados narrativos: ordenação e janela de spoiler baseada em escopo de obra/edição e posição; valores `unknown` são diferentes de `none`.
- Auditoria editorial: versionamento, autoria (identidade interna), motivo, status, antes/depois, correlação e histórico imutável.
- Todas as relações precisam de IDs estáveis, chaves únicas compostas sensatas, integridade e prevenção de N+1.

## E. Segurança e usabilidade

- Validação entrada/saída, escaping/sanitização de texto rico, rate limits internos, proteção contra SSRF, URLs externas allowlist quando pertinente, configurações em env, secrets fora de git, autenticação/autorização para **qualquer rota de mutação**.
- A Fase 27 consolidará RBAC/revisão; **antes dela não criar endpoints públicos de edição ou contas administrativas padrão**. Autoriação temporária deve ser restrita/desabilitada fora de desenvolvimento e auditada.
- Spoilers: filtro é imposto na API, não somente por ocultação CSS. Nunca pré-carregar em resposta pública detalhes de uma fase não liberada.
- Acessibilidade: navegação por teclado, foco, rótulos, contraste, estados de vazio/erro/carregamento; gráficos oferecem resumo/listagem alternativa, inclusive para leitores de tela.

## F. Tabela de status e definição de pronto

- `CONCLUÍDO`: implementação + evidência de testes/integração + documentação e sem bloqueios críticos.
- `PARCIAL`: entregas funcionais, mas requisito ou validação essencial ausente, explicar qual.
- `PENDENTE`: ainda não executado.
- `BLOQUEADO`: limitação externa ou risco não resolvido; sem contorno inseguro.
- Para cada fase o relatório deve possuir **matriz `requisito → arquivo(s) → teste(s) → resultado → evidência`**, mudanças de migração, comandos executados, eventuais falhas, lacunas e proposta de continuação.
- Nunca afirmar teste E2E quando só houve teste unitário, nem indicar benchmark sem dados ambientais e tamanho do conjunto.
