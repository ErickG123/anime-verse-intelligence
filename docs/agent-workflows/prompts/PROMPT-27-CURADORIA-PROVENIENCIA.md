# PROMPT 27 — Governança editorial, curadoria, proveniência, conflitos, RBAC e auditoria

**Executar integralmente no repositório real**, após ler `docs/agent-workflows/references/CONTRATO-COMUM.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, ADRs, specs, matriz de testes, ROADMAP e relatórios de todas as fases anteriores, sobretudo 24–26. A implementação deve responder aos riscos reais de ingestão/curadoria, não montar uma infraestrutura genérica sem uso.

## 0. Gate de entrada e diagnóstico

1. Verificar o funcionamento do StudioGraph, conectores, LoreGraph e AdaptationLab; listar quais fatos locais são de origem própria/autorizada, quais são externos somente em leitura e quais não podem ser retidos.
2. Auditar migrações, esquema atual de proveniência e histórico; confirmar auth, autorização, validação, ownership, e existência de rotas de escrita perigosas.
3. Verificar políticas de retenção, licenças e publicações em `docs/data-sources/`; mudanças na governança devem **restringir**, não ampliar implicitamente, a reutilização de dados externos.
4. Validar se há sistema de usuários existente; não criar duas fontes de verdade de identidade/autorização.
5. Criar `docs/audits/AUDIT-PHASE-27-EDITORIAL-GOVERNANCE.md` com inventário de rotas de mutação, matriz de risco (auth, permissão, concorrência, auditoria, licença) e plano de migração não destrutiva.

## 1. Objetivo e produto da fase

Desenvolver uma **área administrativa de curadoria** para que revisores autorizados possam manter dados originais/legais do AnimeVerse com trilha auditável:

- Revisar correspondências entre identidades/obras e fontes.
- Revisar fatos de personagens/profissionais/editoras quando houver direito de manter asserções.
- Criar/aprovar arcos, eventos narrativos e relações com evidências.
- Criar/revisar mapeamentos episódio↔capítulo e diferenças de adaptação.
- Resolver conflitos entre fontes sem sobrescrever decisões anteriores silenciosamente.
- Acompanhar estados, alterações, responsáveis e publicação.
- Retirar de circulação informações incorretas ou não licenciadas.

**Não** abrir contribuições anônimas ou comunidade pública neste marco. Não adicionar recursos sociais sem especificação.

## 2. Autenticação e autorização

### Auditar antes de escolher o mecanismo

- Reutilizar autenticação e sessões já instaladas, se seguras. Se não houver, especificar fluxo de administração mínimo e robusto: identidade de editor, login/sessão segura, hashing resistente de senhas (ex.: Argon2id), cookies HTTP-only + Secure + SameSite apropriados, CSRF nas rotas por cookie, proteção brute force/rate limits, expiração/revogação de sessão, logs e recuperação administrativa segura.
- Evitar JWT no `localStorage`; não guardar senhas ou secrets em arquivo versionado; não criar `admin/admin`, conta padrão, credenciais hardcoded nem endpoints de bootstrap públicos eternos.
- O provisionamento do primeiro administrador deve ser **ação manual protegida** por comando one-shot/secret fora do repositório (ou SSO já existente), com instrução de operação, execução rastreável e desativação automática de setup público.
- Configurar `RBAC` mínimo: **ADMIN** (contas/configuração/políticas), **EDITOR** (criação/revisão conforme política), **REVIEWER** (decisão editorial), **VIEWER** (leitura interna). Auditar necessidade de separação de funções (quem propõe não aprova o próprio conteúdo quando fluxo exigir duas pessoas).
- Autorização é realizada no Fastify, por recurso e ação; botões escondidos no Angular não são controle de segurança.
- Rota de conteúdo público nunca expõe rascunho/rejeitado; logs de auditoria não ficam públicos. Privacidade e minimização de dados pessoais.

## 3. Fluxo editorial com estados claros

Definir máquina de estados **única** e testada, ajustada ao domínio real:

`DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED`

Saídas alternativas: `CHANGES_REQUESTED`, `REJECTED`, `RETRACTED`, `ARCHIVED` conforme contexto. Não permitir saltos sem permissão nem estados inconsistentes. Documentar transições, papéis autorizados, reabertura, retirada e necessidade de motivo.

Regras:

1. Revisão deve validar **conteúdo + fontes + licença + consistência + spoiler** antes de publicar.
2. Um item pode estar correto mas **não publicável** por direitos de uso. Separar `verificationStatus` de `publicationStatus` e `rightsStatus`.
3. Rejeição/retirada deve preservar histórico e impedir reaparecimento por reimportação automática.
4. Conteúdos com conflito aguardam resolução; não exibir versão contestada como fato.
5. Publicação da mesma alteração deve ser idempotente; múltiplos cliques não produzem eventos duplicados.
6. Mecanismo de dois revisores para casos críticos pode ser parametrizável; não complicar o fluxo comum sem justificativa.

## 4. Proveniência granular e licença por atributo

- Registrar entidade/propriedade/valor ou hash adequado, origem, URL/autorização, data de consulta, evidência, método (`manual`, `api`, `dataset`, `suggestion`), versão, status editorial e política de retenção.
- Asserções conflitantes coexistem em área de revisão, com escolha de fonte canônica e motivo; **não apagar a asserção vencida** do histórico, salvo exigência legal de remoção.
- Proveniência não implica reter conteúdo bruto do AniList/MangaUpdates. Links/identificadores só onde legalmente permitidos, e metadados operacionais estritamente necessários.
- Projetar políticas de fonte configuráveis: persistência permitida? cache? mídia? duração? atribuição? uso comercial? Não permitir que um checkbox administrativo burle uma proibição explícita do provedor.
- Exibir no front público `fonte`, `status de revisão` e `data` quando relevantes, sem vazar detalhes sensíveis do revisor.
- Adicionar ferramenta para auditoria de conteúdo com licença ausente/desconhecida; bloquear publicação quando exigido.

## 5. APIs administrativas Fastify

Avaliar contratos antes de criar rotas. Recursos conceituais:

- `GET /api/admin/review-queue` com paginação, escopo, status, responsável, fonte, idade da pendência.
- `GET /api/admin/reviews/:id` com histórico/redações/asserções e links de evidência permitidos.
- `POST /api/admin/reviews/:id/decisions` com `decision`, `reason`, `expectedVersion`; política de transição e log.
- `POST /api/admin/assertions` ou mutações de domínio existentes com validação e `rightsStatus`.
- `GET /api/admin/audit-events` somente autorizado; filtros por ator, recurso e período.
- `GET /api/admin/conflicts` com paginação e estado; resolução manual auditável.

Exigir JSON Schema/TypeBox, OpenAPI, request IDs, limites, verificações auth por operação, validação de IDs internos, error contract consistente. Não expor URLs internas, segredos ou payloads de terceiros não licenciados. Proteção anti-CSRF de acordo com o mecanismo de sessão.

## 6. Consistência transacional e trilha imutável

- Definir `ReviewItem`, `ReviewDecision`, `AssertionRevision`, `AuditEvent`, `SourcePolicy` e `ConflictResolution` somente se modelos equivalentes não existirem.
- Todas as alterações relevantes em transação: atualizar recurso + registrar revisão + adicionar evento imutável. Não gravar evento de sucesso se transação falhar.
- Controle de concorrência otimista (`version`/ETag/expectedVersion); responder 409 para tentativa obsoleta, com opção de recarregar e comparar.
- AuditEvent registra ator, papel, data, recurso, ação, motivo, diff estruturado **sem segredo nem conteúdo externo proibido**, correlação request e resultado. `append-only` protegido no banco para operação comum; acesso de manutenção controlado.
- Garantir que edição direta por administradores do banco não seja confundida com evento editorial auditado; documentar limitações técnicas da garantia de imutabilidade.
- Não alterar audit events de forma destrutiva sem procedimento legal e backup controlado.
- Preparar rotina simples de avaliação de integridade da trilha, sem necessidade de plataforma externa.

## 7. Frontend admin feature-based

Criar/reutilizar `features/editorial` ou área equivalente, com rotas protegidas por auth no front **e** backend:

- **Dashboard**: pendências por categoria/estado, conflitos abertos e tarefas atribuídas, com métricas reais.
- **Fila de revisão**: busca, filtros, paginação, prioridade justificada, fonte e data.
- **Detalhe da proposta**: antes/depois, campos alterados, prova, direitos, entidades envolvidas e contexto spoiler; permitir decidir com motivo.
- **Conflitos**: comparar asserções e versões lado a lado; definir resolução sem descartar registro histórico.
- **Histórico/auditoria**: timeline de decisões, ator autorizado, data e razões.
- **Revisão de LoreGraph/AdaptationLab**: formulários seguros para eventos, relações, mapping, status de spoiler e evidências; coerência com domínio e IDs internos.
- **Políticas de fonte**: tela preferencialmente somente leitura/admin para verificar limites; nunca “ativar scraping” como toggle sem autorização.

Angular 22 + Signals + OnPush, `.ts/.html/.scss` separados, models/types/constants fora de component/service, rotas lazy, Transloco, dark mode e acessibilidade; validações de UI **não** substituem backend. Proteger conteúdo inacabado das páginas públicas e evitar que links antigos exponham versões retiradas.

## 8. Segurança operacional e privacidade

- Corrigir IDOR/elevação de privilégio em todas as rotas de mutação, inclusive métodos PATCH/DELETE; testes com usuário sem sessão, VIEWER, EDITOR e REVIEWER.
- Rate limit de login, cookies seguros, logout/revogação, expiração, CSRF se necessário, CORS e headers de segurança.
- Proteger conteúdo Markdown/HTML e URLs de evidência de XSS; preview sanitizado, evitar renderizar HTML externo não confiável.
- Sanitizar logs e exports; política de retenção, backup e recuperação; rollback de publicação sem apagar o histórico.
- Testar aprovação simultânea por dois revisores, recurso alterado durante decisão, retrabalho e retirada por violação de licença.
- Se auth segura não puder ser concluída, **desabilitar todos os endpoints administrativos em ambiente público** e reportar `BLOQUEADO`.

## 9. Estratégia de testes

### Unitários
- Máquina de estados, papéis, condições de publicação, direitos, resolução de conflito, merge por atributo, optimistic lock, diffs e status editorial.

### Integração PostgreSQL/Fastify
- Auth/roles por endpoint, status 401/403/409, transações, auditoria após rollback, concorrência, idempotência, exclusão lógica, proteção de conteúdo restrito.

### E2E Playwright
- Login permitido → abrir fila → revisar evento → comparar → solicitar correção/aprovar → publicar → conferir visão pública → retratar → conferir ocultação; também teste de usuário sem papel e conflito de revisão.
- Navegar por teclado, error states, sessão expirada e dark mode.

### Policy tests
- Item externo não licenciado não publicável; cópia de payload proibida rejeitada; ausência de evidência em relação causal bloqueia aprovação; spoiler não liberado nunca publicado no payload para usuário sem progresso.

Executar `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, E2E, migrations e smoke real autorizado. Atualizar contrato e OpenAPI. Não mascarar erro de auth com mock de produção.

## 10. Documentação e critérios de aceite

- `docs/audits/AUDIT-PHASE-27-EDITORIAL-GOVERNANCE.md`
- Specs de papéis, workflow, proveniência, retenção e direitos; ADR de auth/auditoria se decisão nova.
- `docs/reports/REPORT-PHASE-27-EDITORIAL-GOVERNANCE.md` com matriz RBAC, fluxos, testes e evidências, migrações, riscos, screenshots quando possível, matriz `RF → implementação → teste`.
- Atualizar ROADMAP, TEST-MATRIX, instruções de configuração inicial segura e política de backups; não gravar credenciais.

### Critérios de aceite
- [ ] Todas as mutações são autorizadas no backend; não existem credenciais padrão e setup seguro é documentado.
- [ ] Fila, detalhe, revisão, conflitos, histórico, aprovação, publicação/retração funcionam.
- [ ] Direitos e proveniência são validados antes da publicação; fonte externa restrita não é copiada para base local.
- [ ] Auditoria é append-only na operação normal e transacionalmente consistente com mudanças.
- [ ] Concorrência e transições ilegais são rejeitadas; rollback preserva consistência.
- [ ] Público só vê conteúdo aprovado/publicado e dentro do limite de spoiler.
- [ ] Lint, typecheck, build, testes, E2E e docs SDD têm evidência real.

**Não avance à Fase 28 declarando curadoria “concluída” caso exista endpoint de edição pública ou fluxo editorial sem auditoria.**
