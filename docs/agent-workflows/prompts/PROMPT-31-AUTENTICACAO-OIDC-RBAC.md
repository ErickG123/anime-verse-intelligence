# PROMPT 31 — Autenticação OIDC, Sessões Seguras, RBAC e Liberação Controlada da Curadoria

**Projeto:** AnimeVerse Intelligence. **Executor:** Antigravity CLI. **Dependências:** relatórios 27–30 e `CONTRATO-TRANSVERSAL.md`.

## Missão

Substituir, **somente depois de validação**, o `failClosedAuthenticator` atual por autenticação administrativa real com OpenID Connect, sessões seguras e autorização robusta por recurso, preservando a proteção fail-closed até a liberação formal. A implementação não deve exigir login para as rotas públicas de leitura já previstas.

## 1. Auditoria inicial e escolha responsável

1. Ler `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, decisões de segurança, relatórios 27–30, código real dos hooks `onRequest`, rotas `/api/v1/admin/*`, modelo RBAC/locks 409/gate 422, cookies, CORS e proxy.
2. Inventariar papéis e permissões atuais, fluxos de publicação/revisão, logs append-only, histórico de alterações, riscos IDOR, CSRF, XSS, session fixation e brute-force.
3. Registrar o provedor OIDC escolhido **somente se houver configuração explícita no repositório ou instrução humana documentada**. Caso não haja: implementar integração genérica via OIDC discovery e suporte a IdP de desenvolvimento isolado (por exemplo Keycloak opcional, sem usuário/senha padrão), **manter admin de produção desabilitado**.
4. Comparar sessões servidor-side e sessão criptografada em cookie versus tokens no browser; justificar em ADR. Preferir BFF (Fastify) com cookie HttpOnly/Secure/SameSite, sem expor access tokens para SPA.
5. Verificar bibliotecas e compatibilidades/avisos de segurança na versão exata. Não instalar plugins sem revisar changelog, suporte Fastify 5 e CVEs.
6. Gerar `docs/audits/AUDIT-PHASE-31-ADMIN-AUTH.md` com modelo de ameaça e decisão de identidade.

## 2. Contrato de autenticação

Implementar fluxo **Authorization Code + PKCE (S256)** e validações OIDC adequadas:

- Descoberta via issuer pré-configurado, validação TLS, endpoints permitidos e falha segura em caso de alteração inesperada.
- Verificar `state`, `nonce`, code verifier, issuer, audience/client ID, assinatura JWT via JWKS, exp/nbf/iat e rotação de chaves, usando biblioteca madura em vez de criptografia manual.
- Configurar redirect URI, post-logout redirect e origens permitidas de forma exata; evitar open redirect.
- Não aceitar JWTs ou identidades não emitidas pelo issuer confiável; não confiar em headers `X-User` vindos de clientes.
- Definir callback de login, logout, sessão vigente, expiração, refresh/reautenticação, invalidação e tratamento de falhas com erros não informativos.
- Cookies `HttpOnly`, `Secure` em HTTPS, `SameSite` adequado, `Path`, prefixo `__Host-` quando válido, rotação de sessão e política de timeout; avaliar `@fastify/secure-session` ou armazenamento servidor-side conforme necessidade de revogação e escala.
- Evitar armazenamento de tokens em `localStorage` e exposição em logs, OpenAPI, traces ou frontend.
- CSRF para alterações de estado via cookies: token sincronizador e/ou checagem Origin/Referer e Fetch Metadata, conforme arquitetura. Não confiar em SameSite como única defesa.
- Restringir CORS aos domínios reais, rate-limit nas rotas de auth/callback e acesso administrativo; redirecionar usuário só na UX, retornar 401/403 corretamente na API.

## 3. RBAC e autorização por recurso

Auditar as permissões existentes, documentando uma matriz clara, por exemplo (adaptar aos nomes reais):

| Papel | Leitura pública | Propor mudança | Revisar | Aprovar | Publicar | Administrar usuários |
|---|---|---|---|---|---|---|
| visitante | sim | não | não | não | não | não |
| editor | sim | sim | limitado | não | não | não |
| revisor | sim | sim | sim | conforme política | não | não |
| administrador | sim | sim | sim | sim | conforme política | conforme política |

A tabela é ilustrativa, **não atribua todos os poderes ao admin automaticamente**. Priorizar menor privilégio, separação entre proposta/revisão/aprovação e regra de quatro olhos quando aplicável.

- Mapear claims/grupos vindos do IdP para papéis **de modo explícito e versionado** no backend; ausência de claim/usuário não concede papel.
- Validar autorização em cada rota e operação (inclusive IDs), não somente ocultar menus. Isolar políticas do domínio, evitar duplicação.
- Testar IDOR (registro de outra obra/revisão/escopo), mudança de papéis em sessão ativa, revogação, auditoria de tentativas negadas, paginação/export e alterações em lote.
- Preservar lock otimista: escrita concorrente em revisão retorna **409**, com detalhes seguros e sem sobrescrever alterações.
- Preservar gate de direitos: ação não licenciada retorna **422** e não escreve efeitos secundários.
- Preservar auditoria append-only, com ator estável, ação, recurso, timestamp, diff seguro, correlação; sem tokens nem dados pessoais desnecessários. Testar atomicidade escrita + auditoria.

## 4. Implementação Fastify

- Separar módulos/configurações de identidade, middleware/hooks, autenticação, autorização, sessão e handlers. Usar padrão de plugins Fastify existente, scopes e ordem de hooks corretos.
- Garantir `onRequest` ou ponto equivalente **antes do schema validation/handler** nas rotas sensíveis, mantendo o comportamento comprovado na Fase 28: requisição sem identidade e payload malformado para `POST /api/v1/admin/reviews/:id/decisions` retorna 401, sem schema oracle.
- Criar endpoints mínimos necessários de sessão/login/logout/callback, com TypeBox/JSON Schema e documentação OpenAPI não sensível. Não expor endpoints de criação livre de admin.
- Definir modo `AUTH_MODE=disabled|oidc` (ou equivalente existente). Em `disabled`, escrita admin **sempre 401**. Falha de configuração de issuer/client/secret no ambiente previsto para produção deve fazer **startup falhar** ou deixar admin inacessível, nunca fallback permissivo.
- Configurar health/readiness que não revelem segredos e não considerem autenticação operacional se IdP obrigatório estiver indisponível. Diferenciar readiness público vs administrativo, se necessário.
- Não criar senha `admin/admin`, master key no código, rota `dev-login` ativável por cabeçalho ou bypass em produção.

## 5. Frontend Angular

- Implementar estados autenticado, não autenticado, sessão expirada, sem permissão, IdP indisponível; barra de usuário e botões admin apenas se realmente disponíveis.
- Guards de rotas são UX, **não** a camada de autorização. Requisições HTTP devem depender da sessão controlada pelo backend.
- Não misturar interfaces/types/constants em `.component.ts/.service.ts`; `.html/.scss` externos, OnPush, Signals, Transloco, tema claro/escuro, mobile acessível.
- Mensagens de 401/403/409/422 específicas e úteis; confirmação de ações sensíveis, preservação de rascunhos quando sessão expirar sem vazar dados.
- Login/logout acessível, sem tela de login falsa ou conta hardcoded. Respeitar origem e cookies em desenvolvimento; HTTPS em produção.

## 6. Desenvolvimento e ambientes

- Opcional: configurar Keycloak local somente em Docker Compose *profile* separado e isolado, com segredo via `.env` não versionado e setup documentado, sem poluir a compose padrão ou abrir admin sem permissão.
- Se não houver IdP escolhido para produção, completar implementação/testes contratuais em ambiente isolado e deixar `admin writes = NO-GO` na release. Documentar configuração necessária para ativar, com checklist de validação.
- Não criar tabelas de usuários duplicadas se as identidades externas forem suficientes; se precisar de papéis editoriais locais, modelar associação explícita `issuer+subject` com migração incremental.
- Observar políticas de privacidade e retenção de logs/auditoria.

## 7. Testes de segurança obrigatórios

### Unit/integration Fastify
- Usuário ausente, token inválido, issuer/audience incorretos, assinatura inválida, token expirado, nonce/state inválidos, PKCE inválido, JWKS stale/rotacionado, falha IdP.
- Permissões por papel em **cada tipo de rota**; acesso por ID de outra conta/escopo; falhas de CSRF; Origin/CORS inválido; logout/invalidação; sessão revogada/expirada.
- Regressões **401 antes do schema oracle**, **409 em optimistic lock**, **422 direitos**, **auditoria append-only** e ausência de efeitos colaterais em negativas.
- Sem IdP: fail-closed funcional com mocks e PostgreSQL local.

### E2E browser
- Fluxo completo de login com IdP **de teste** isolado (não mockar apenas UI); sessão, permissão, erro de direitos, decisão editorial, logout e expiração.
- Testar cookies no navegador e ausência de token em localStorage/URL final/logs; comportamento em mobile e dark mode quando relevante.
- Se IdP real de teste indisponível, marcar **BLOQUEADO** e manter rotas de escrita fechadas.

## 8. Operações, documentação e evidência

- Documentar configuração de issuer/cliente/redirect URLs, segredos, TLS, reverse proxy, CORS, cookies, rotação, logout, revogação, backups de estado local e incident response.
- Criar `docs/architecture/decisions/ADR-...-admin-oidc-session.md` (numeração conforme existente), `docs/operations/ADMIN-AUTH-RUNBOOK.md` e `docs/specifications/` pertinentes.
- `docs/audits/AUDIT-PHASE-31-ADMIN-AUTH.md`
- `docs/reports/REPORT-PHASE-31-ADMIN-AUTH.md`
- Atualizar `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md` e `docs/operations/RELEASE-CHECKLIST.md`.
- Executar lint, typecheck, build, testes unitários, Fastify+PostgreSQL real, Playwright auth E2E e openapi checks; reportar casos falhos/não executados.

## Gate de liberação

- [ ] Provedor e configurações efetivamente definidos e testados; caso contrário **NO-GO para escrita pública**.
- [ ] Code + PKCE + OIDC id-token validation completa.
- [ ] Sessão segura, proteção CSRF, logout, timeout e origens restritas.
- [ ] RBAC no backend, com IDOR negativo e menor privilégio.
- [ ] Sem vazamento de schema em requests não autenticados.
- [ ] Regressões 401/403/409/422 preservadas.
- [ ] Logs append-only, atomicidade e rastreabilidade preservados.
- [ ] IdP indisponível não torna admin acessível.
- [ ] Testes reais E2E com IdP de teste, se possível; lacunas explicitamente marcadas.
- [ ] Documentação operacional, ADR e relatório com evidências.

**Resultado esperado:** auth/admin implantáveis **somente mediante gate de segurança**; o público read-only segue independentemente. Não anunciar escrita administrativa pronta enquanto depender de decisão humana ou configuração faltante.
