# PROMPT 32 — Preparação da Release Pública, Operação e Gate Go/No-Go

**Projeto:** AnimeVerse Intelligence. **Executor:** Antigravity CLI. **Dependência:** Fases 29–31 verificadas ou bloqueios formalmente registrados. **Leitura obrigatória:** `CONTRATO-TRANSVERSAL.md`, relatórios das fases anteriores e `docs/operations/RELEASE-CHECKLIST.md`.

## Missão

Preparar uma release pública **read-only** do AnimeVerse Intelligence, preservando os módulos de inteligência e a segurança editorial. Estabelecer processo reproduzível de build, deploy, migração, backup/restore, configuração, monitoramento e rollback; decidir GO/CONDITIONAL-GO/NO-GO com evidências, sem publicar automaticamente na internet.

## 1. Auditoria de prontidão

- Ler todas as regras e documentos SDD, relatórios das Fases 21–31, últimas migrações, políticas de dados, termos de provedores, decisões OIDC e estado do Git.
- Inventariar app web Angular, API Fastify, PostgreSQL 17, arquivos de mídia/links externos, filas/jobs, dataset, DNS/TLS, cookies, Swagger e workers existentes.
- Conferir se Playwright E2E roda, se a Fase 30 eliminou problemas críticos e se a Fase 31 tem provedor OIDC real. Se não: **desabilitar escrita/admin e declarar a limitação**, mantendo read-only publicável se demais gates passarem.
- Gerar `docs/audits/AUDIT-PHASE-32-RELEASE-READINESS.md` com evidências, matriz de risco (P0–P3), dependências e decisão preliminar.

## 2. Perfis e ambientes

- Definir DEV, TEST/E2E, STAGING e PROD com valores de configuração **externos ao código**; `.env.example` sem segredos e validação de env no startup.
- Docker Compose local com PostgreSQL persistente, `healthcheck`, rede privada, volumes nomeados, `restart` adequado e porta 5432 publicada só quando necessária (preferir loopback em DEV); nunca expor PG público inadvertidamente.
- Preparar Dockerfile multi-stage para API e/ou web somente onde justificado. Imagens base com versões pinadas/atualizadas e usuário não-root; `.dockerignore` sem `.env`, `node_modules`, dumps, traces ou chaves.
- Estruturar proxy/TLS conforme provedor de hospedagem escolhido; não inventar provedor ou domínio. Configuração HTTPS, headers de segurança, compressão, cache correto, CSP compatível com Angular e imagens usadas, limites de payload, rate limit e CORS restrito.
- Se política de produção depende de serviço/segredo não configurado, documentar bloqueio, não improvisar fallback.

## 3. Banco, esquema, sincronização e backups

- Auditar drift entre Drizzle schemas e migrações aplicadas; `db:status` sem pendências no banco de staging; preservar histórico 0000/0001/0002 e posteriores. Nunca reescrever migração aplicada.
- Plano de deploy: backup **antes** da migração, executar migrations incrementais, checar integridade e readiness, rollback de aplicação sem rollback destrutivo de schema; planejar estratégia expand/contract para mudanças incompatíveis.
- Executar **backup real** em banco de staging, `pg_dump` com versão compatível, checksum, armazenamento fora do volume e **restore em banco separado**, testar queries e FKs. Documentar RPO/RTO pretendidos e resultados reais; não alegar restore sem testar.
- Dataset `anime-offline-database`: registrar release e checksum, política de atualização, reimportação idempotente, logs estruturados, retenção, validação de contagens e dados de proveniência. Não autoimportar fonte externa na inicialização em produção sem controle.
- Cuidados com registros editoriais e licenças: não sobrescrever curadoria manual, não replicar AniList em massa, não vazar dados anti-spoiler.

## 4. Segurança e governança do produto

- Revisar autenticação/autorização: público read-only, admin fail-closed sem OIDC operacional, CORS/CSRF/cookies, sessão, RBAC, gate de direitos 422, optimistic locking 409, append-only audit.
- Testes adversariais básicos: SQL injection/JSON Schema, XSS em Markdown/texto externo, SSRF em integradores, links externos, escopo de API admin, IDOR, rastreabilidade, headers e dependências vulneráveis.
- Implementar revisão de dependências e licença, inclusive ferramentas frontend, fontes de imagem, dados de AniList/MangaUpdates/Wikidata e dataset ODbL/DbCL. Documentar atribuição pública e obrigações de compartilhamento quando aplicáveis; não inferir permissão pela disponibilidade da API.
- Proteger endpoints `docs/json`/Swagger conforme contexto; garantir que o schema não revele segredo ou dados pessoais.
- Preparar política de logs e privacidade, sem persistir cookies, payloads sensíveis, URLs com tokens ou dados de identidade desnecessários.

## 5. Observabilidade e resiliência

- Padronizar logs Fastify com request/correlation ID, método/rota, status, latência e erro sanitizado; separar logs operacionais de auditoria editorial append-only.
- `GET /api/v1/health`: processo vivo; `GET /api/v1/ready`: PostgreSQL e dependências críticas realmente prontas. Endpoint administrativo só quando seguro, sem dados sensíveis.
- Registrar métricas úteis: latência p50/p95/p99 API, 5xx, taxa de 429, DB connections, filas de sincronização, falhas de fornecedores, contagem de obras, relações resolvidas, cobertura LoreGraph/AdaptationLab e disponibilidade dos conectores.
- Implementar limites e timeouts de consultas externas; isolamento por circuit breaker/cache permitido para impedir falha de AniList de derrubar catálogo local.
- Preparar dashboard mínimo operacional ou documentação de consultas de log/health; não instalar stack pesada de observabilidade sem benefício concreto.

## 6. Release pipeline e rollback

- CI em GitHub Actions: install frozen lockfile, lint, typecheck, unit, integração PG, build, Playwright smoke; publicar artefatos e versionamento com Conventional Commits conforme governança existente.
- Preparar scripts reproduzíveis de build, migração, smoke test pós-deploy e rollback de aplicação. Ações de publicação/deploy devem ser **manuais e explicitamente autorizadas**; nenhuma chave de deploy em repositório.
- Se usar imagem Docker, registrar tag imutável/digest, scan de vulnerabilidades e SBOM quando viável; não impor configuração comercial.
- Separar `0.1.0-rc.1` baseline de uma futura versão final. Versão/tag só após aprovação e controle de release, sem inventar changelog.
- Documentar smoke pós-deploy: health/readiness, `/docs/json`, catálogo, detalhes, grafos, anti-spoiler e 401 admin; procedência das imagens e cobertura do dataset.

## 7. Validação de performance e carga realista

- Executar benchmarks **com dados do snapshot real** para busca, filtros, paginação, detalhe, StudioGraph e endpoints de inteligência, respeitando proteção anti-spoiler.
- Coletar latência e consumo com contexto (hardware, release, execução, concorrência); verificar N+1, `EXPLAIN (ANALYZE, BUFFERS)`, indexes e paginadores.
- Testes de carga moderada, não DDoS e **sem enviar carga às APIs de terceiros**; mockar fornecedores externos para performance do próprio app.
- Avaliar bundle web, lazy loading, Lighthouse/Core Web Vitals quando factível, consumo e layout em mobile.
- Alvos de SLO devem ser propostos e justificados, não declarados alcançados sem medição.

## 8. Testes de aceitação e cobertura do conteúdo

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm test:e2e` ou equivalentes.
- Garantir E2E real de catálogo, filtros, grafos, LoreGraph, AdaptationLab, fontes, acessibilidade mínima e admin fail-closed/OIDC conforme estado.
- Conferir discrepância entre **funcionalidade implementada** e **conteúdo disponível**: número de obras com créditos, cobertura StudioGraph, obras com LoreGraph verificado, mapeamentos AdaptationLab, conflitos pendentes e itens bloqueados por direitos.
- Não rotular páginas vazias como módulos completos em termos de experiência. Registrar taxa de cobertura com denominador e versão do dataset.

## 9. Checklist de release e decisão

Definir gates explícitos:

**NO-GO absoluto** se: anti-spoiler vaza, escrita sem autenticação, perda/corrupção de dados, backup/restore não verificáveis para migração de risco, violações graves de licença, build quebrado, E2E críticos falhando, serviços críticos indisponíveis.

**CONDITIONAL-GO read-only** se: catálogo e navegação E2E passam, direitos e segurança estão adequados, admin efetivamente fechado, observabilidade e backup implementados, porém escrita editorial continua não habilitada.

**GO completo** somente com IdP production-ready, matriz RBAC/CSRF/IDOR testada, migrações e recuperação verificadas, aprovação de políticas e revisão de release documentada.

Não transformar a decisão em um deploy não solicitado. Preparar comandos e documentação; executar apenas em ambiente de desenvolvimento/staging autorizado.

## 10. Entregáveis

- `docs/audits/AUDIT-PHASE-32-RELEASE-READINESS.md`
- `docs/reports/REPORT-PHASE-32-RELEASE-READINESS.md`
- `docs/operations/DEPLOYMENT-RUNBOOK.md`
- `docs/operations/BACKUP-RESTORE-RUNBOOK.md`
- `docs/operations/ROLLBACK-RUNBOOK.md`
- `docs/operations/RELEASE-CHECKLIST.md` atualizado.
- `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, especificações e ADRs pertinentes atualizados.
- Evidência: commits/arquivos, versões, health, testes, restore, carga/performance e capturas do UI.

## 11. Critérios de aceite

- [ ] Variáveis e perfis de ambiente validados, sem segredos versionados.
- [ ] PostgreSQL persistente, healthcheck e migrações íntegras.
- [ ] Backup e **restore em banco separado** realmente testados.
- [ ] Build/release/rollback documentados e smoke executado em ambiente autorizado.
- [ ] CI, Playwright e regressões de segurança executadas.
- [ ] Anti-spoiler e admin fail-closed confirmados no backend.
- [ ] Fontes externas e direitos documentados; indisponibilidade não derruba catálogo.
- [ ] Cobertura real de conteúdo e performance medidas.
- [ ] Relatório Go/Conditional-Go/No-Go baseado em evidências.
- [ ] Nenhum deploy externo sem aprovação explícita.

**Resultado esperado:** release candidata publicável com risco conhecido e processo de operação testável. Se houver pendências críticas, concluir com NO-GO em vez de maquiar o resultado.
