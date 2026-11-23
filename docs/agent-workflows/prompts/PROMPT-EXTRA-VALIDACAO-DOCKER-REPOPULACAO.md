# PROMPT EXTRA — Validação Geral do AnimeVerse, Docker PostgreSQL, Reconstrução Segura e Repopulação Completa

**Executor:** Antigravity CLI no repositório local. **Pode ser executado após a Fase 32**, ou antecipadamente para preparar ambiente isolado de testes. **Leitura obrigatória:** `CONTRATO-TRANSVERSAL.md`, `AGENTS.md`, `GEMINI.md`, `.agents/rules/**`, `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`, ADRs, relatórios 21–32 e `docs/operations/**`.

## Missão e definição de pronto

Executar uma validação **real e integral** do AnimeVerse Intelligence, incluindo ambiente Docker, PostgreSQL 17, esquema Drizzle, carga completa do anime-offline-database, API Fastify, Angular, integrações, segurança, grafos e Playwright. Criar/popular um **banco novo do zero em ambiente isolado** como prova de reprodutibilidade e, em paralelo, comprovar que a importação idempotente é segura em um banco existente.

**Não significa apagar a base atual do usuário.** Banco de desenvolvimento persistente, curadoria editorial e volumes de Docker são dados valiosos. A reconstrução padrão deve ocorrer em banco/volume/projeto **novos e isolados**; não trocar a conexão principal para a base reconstruída sem autorização específica. Se o usuário posteriormente pedir reset do banco existente, solicitar aprovação explícita com destino identificado e backup/restore comprovados.

## 0. Gate operacional contra perda de dados

Antes de rodar qualquer comando:

1. Executar `git status`, `docker version`, `docker compose version`, `docker compose ps`, `docker volume ls` e listar bancos/rede/ports de maneira segura. Identificar claramente container e banco alvo.
2. Verificar se o projeto já possui `animeverse-postgres`/porta 5432 e quais volumes estão montados. **Nunca assumir que volume anônimo pode ser apagado.**
3. Confirmar qual ambiente será alterado: somente DEV/TEST/ISOLADO; recusar atuar em produção sem autorização distinta.
4. Definir duas modalidades e registrar a modalidade escolhida:
   - **A (padrão, recomendada): REBUILD-ISOLATED.** Criar novo banco vazio e/ou projeto Compose com nome exclusivo e volume exclusivo; não apagar nem desligar o ambiente já existente. Se `container_name` fixo impedir executar Compose duplo, preparar override seguro ou outro mecanismo de isolamento documentado; portas distintas (exemplo 55432) e URLs específicas.
   - **B: UPSERT-EXISTING.** `docker compose up -d postgres`, migrations incrementais, importação idempotente e verificações sem truncar nada. Sempre backup verificável antes de mudanças significativas.
5. **Bloquear** `docker compose down -v`, `docker volume rm`, `docker volume prune`, `DROP DATABASE`, `TRUNCATE`, `DELETE` massivos, `drizzle-kit push --force` e outras operações destrutivas sobre o ambiente existente. Não fazer limpeza agressiva de Docker geral.
6. Caso existam modificações não commitadas ou scripts de reset inseguros, parar ações potencialmente destrutivas e documentar, mas realizar auditorias estáticas seguras.

## 1. Auditoria de reprodutibilidade e configuração

- Conferir scripts do monorepo e toolchain realmente instalada: pnpm/Node, Angular 22, TypeScript, Fastify 5, Drizzle, PostgreSQL 17, Playwright e Docker; bloquear versões incompatíveis.
- Verificar `compose.yaml`, `.env.example`, `DATABASE_URL`, usuários/roles e extensão `pg_trgm`, `unaccent`; assegurar que hosts de containers e host Windows têm endpoints coerentes.
- Validar que logs não imprimem `DATABASE_URL` integral ou segredos; preparar env isolado com credenciais fortes que não são commitadas.
- Confirmar estado esperado: migrações `0000_initial`, `0001_lore_adaptation_foundation`, `0002_editorial_governance` **e quaisquer posteriores**; não editar arquivos históricos.
- Ler o resultado real das Fases 21–32 e listar endpoints e contratos; documentar diferenças entre relatório e código.
- Criar `docs/audits/AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md` contendo riscos, bancos/volumes identificados (sem segredos) e plano de execução.

## 2. Subir Docker PostgreSQL com healthcheck

### Modalidade A: banco vazio isolado (padrão)

- Construir ou adaptar `compose` override para um projeto `animeverse-validation` (nome ilustrativo, verificar conflitos) com PostgreSQL 17 e **volume novo dedicado**, sem interferir no serviço atual; não usar `container_name` compartilhado.
- Garantir banco/usuário novos e namespace de teste; healthcheck com `pg_isready` e timeout real. Se publicar porta, usar apenas loopback (`127.0.0.1`) e porta livre; o agente deve descobrir porta disponível e exibir escolha, não sobrescrever serviços locais.
- Subir apenas serviços necessários: `docker compose ... up -d postgres` com arquivo/projeto corretos; depois `docker compose ... ps` e aguardar estado `healthy` com timeout e diagnóstico claro.
- Verificar conexão via `psql SELECT version()`, `current_database()` e `current_user`, sem expor senha. Provar que **não** se conectou ao PG existente ou de produção.

### Modalidade B: banco existente, sem recriação

- `docker compose up -d postgres` conforme compose real; verificar health, conexão, versão e privilégios.
- Antes de migration/import, fazer backup consistente `pg_dump` de formato customizado, salvar fora do volume e conferir arquivo/sha256; ensaiar restore em banco descartável separado quando aplicável. Não publicar credenciais.

## 3. Criar esquema desde zero via migrações Drizzle

- Em **banco vazio isolado**, executar o mecanismo oficial do projeto (`pnpm --filter @animeverse/api db:migrate` ou equivalente comprovado) para aplicar todas as migrações em ordem.
- Executar `db:status`; exigir `pending: []` e comparar snapshot do esquema com modelo Drizzle sem `push` destrutivo.
- Validar tabelas, índices, unique, FKs, checks, operações de isolamento, locks otimistas e append-only; registrar resultado por tabela/esquema, com foco em `anime`, `external identities`, relações, entidades editoriais, LoreGraph e AdaptationLab segundo nomes reais.
- Confirmar `pg_trgm`/`unaccent` e demais extensões exigidas; buscar índices adequados com consultas SQL introspectivas.
- Rodar migrations **pela segunda vez** para verificar idempotência da execução; não criar alterações de schema na segunda aplicação.
- Se houver erro, investigar causa raiz, aplicar migração **nova** quando necessário e rodar testes de regressão; não editar migrations previamente aplicadas.

## 4. Obter release oficial do dataset e importar de verdade

- Fonte: `https://github.com/cedya77/anime-offline-database`.
- Verificar releases, changelog, versão publicada, licenças e formato real (JSON/JSONL). Escolher dataset integral (não fixture), registrar URL de origem, data, identificador de release, tamanho, checksum SHA-256 e total de linhas/records; não tratar baseline 2026-47 como release obrigatória.
- Respeitar integridade, disponibilidade e limites do download. Se houver arquivo local com SHA verificável, preferir reutilizar; se a fonte remota estiver indisponível, **não marcar importação completa como concluída**.
- Confirmar parser streaming e metadados JSONL; não carregar tudo em memória. Validar campos opcionais e UTF-8/títulos japoneses; distinguir registro inválido, duplicado, relação pendente e erro inesperado.
- Executar o CLI real (`pnpm --filter @animeverse/api dataset:import -- --file <caminho-verificado>` ou equivalente descoberto). Registrar duração, throughput, createdCount, updatedCount, unchangedCount, rejectedCount, unexpectedErrors, relationsCount, relações pendentes e log de versão.
- O baseline anterior foi **38.519 obras e 138.093 relações para release 2026-47**. Comparar somente se estiver usando exatamente aquela release e sem mudança de normalização. Para release nova, usar contagem da origem e política de tratamento de relações como referência; **não maquiar contagens para bater baseline**.
- Reexecutar o mesmo importador no mesmo banco; verificar **zero duplicações** e `createdCount=0` quando sem dados novos; se UPSERT reportar registros "updated" mesmo sem alteração, justificar e testar semântica. Nenhum efeito colateral indevido em curadoria.
- Verificar integridade referencial, IDs externos não duplicados, fontes, versões, títulos não vazios, unicode, relações resolvidas/pendentes e valor de cobertura.
- Testar falha interrompida/retry em banco isolado com fixture ou cenário seguro: transações atômicas e recuperação idempotente.

## 5. População dos módulos além do catálogo

**Não inventar dados editoriais ou narrativos.** O anime-offline-database não fornece uma base completa de arcos, eventos, capítulos adaptados, créditos individuais ou decisões de revisão. A população deve ser separada em camadas:

1. **Base real autorizada:** animes, identificadores e relações permitidos pelo snapshot.
2. **Dados de referência internos:** categorias, configurações, permissões e tabelas auxiliares que exigem seed técnico; versionar seed idempotente.
3. **Dados editoriais reais autorizados:** importar somente se já existir fonte/licença verificáveis e workflow apropriado; preservar proveniência e status de revisão, sem promover UNKNOWN a VERIFIED.
4. **Fixtures de teste:** dataset fictício claramente marcado e limitado a bancos E2E, jamais inserido como conteúdo factual do catálogo público ou misturado ao snapshot real sem marcação clara.

- Auditar se existem seeds idempotentes oficiais. Se não, implementar scripts separados `db:seed:reference` e `db:seed:test` (nomes adaptáveis) com guardas para `NODE_ENV` e destino; `db:seed:test` só pode executar em banco isolado com tag/flag de ambiente inequívoca.
- Revisar papéis/RBAC para evitar criação automática de admins e senhas padrão. Se IdP OIDC não configurado, a escrita administrativa continua 401.
- Reportar cobertura por módulo: número de obras com produtoras/studios, personagens, profissionais consultáveis, LoreGraph aprovado, correspondências verificadas do AdaptationLab e entradas com direitos liberados; diferenciar consultas remotas transitórias de dados locais.

## 6. Validação da API Fastify em banco real

- Subir API com `DATABASE_URL` do banco **isolado**; executar `GET /api/v1/health`, `GET /api/v1/ready`, `GET /docs/json` e comparar a quantidade real de rotas com baseline histórico 34 (não exigir 34 se novas rotas legítimas foram adicionadas).
- Catálogo: paginação, ordenação, busca por Unicode/japonês, filtros, detalhe, relações, 404/400, limites por página, respostas tipadas e performance.
- StudioGraph: PRODUCTION/COLLABORATION, filtros, vizinhos, caminho mínimo, IDs tipados, ausência de N+1, limites de expansão; se detalhes de staff dependem do AniList, testar integração sob demanda sem persistência não autorizada.
- LoreGraph: endpoints de progresso, bloqueio por spoiler inclusive ID direto, busca, grafo e mídia; verificar que payload não contém dados bloqueados.
- AdaptationLab: UNKNOWN ≠ OMITTED, coverage denominador, evidências, source policies, páginas sem mapeamento; impedir conteúdo imaginário.
- Admin: sem sessão deve retornar 401 **antes** de validação de schema sensível; com IdP configurado e ambiente autorizado, validar RBAC/CSRF/409/422/append-only.
- Simular indisponibilidade de AniList/MangaUpdates/Wikidata com mocks: catálogo local continua funcionando, rate limiter e cache transitório respeitados.

## 7. Performance e observabilidade com dataset real

- Executar `EXPLAIN (ANALYZE, BUFFERS)` nas buscas e filtros críticos com banco populado; registrar planos e tempos, sem `VACUUM FULL` ou operações invasivas no DB existente.
- Registrar custo de importação, memória (aproximado por monitoramento real), throughput, p50/p95 das rotas e índices utilizados. Contextualizar ambiente (CPU/RAM/OS/container/versão/release).
- Confirmar que consultas API paginam e que grafos expandem sob demanda; testar timeout, erro externo e estado sem conexão.
- Validar queries com caracteres acentuados e japoneses, trigram/unaccent conforme semântica do índice.

## 8. Validação do Angular e browser E2E

- Subir frontend com API isolada, executar rotas efetivas em Chromium; quando disponíveis, Firefox/WebKit. Sem `Playwright` instalado, instalar/configurar conforme Fase 29 ou marcar BLOQUEADO.
- Fluxos: Home, Catálogo, busca/filtros/paginação, detalhes, relações, StudioGraph, LoreGraph com níveis de spoiler, AdaptationLab e Sources; avaliar layout em 1440×900/390×844, dark/light e pt-BR/en.
- Fazer asserts sobre contagem de resultados, payloads e navegação, não apenas screenshots. Confirmar que nenhum componente carrega todos os 38k+ registros de uma vez.
- Validar admin fechado quando não houver OIDC, erros HTTP e estados de vazio/loading; sem vazamento de dados em logs/traces.
- Registrar screenshots/traces de falhas e evidências de resultados; não declarar E2E completo se rodou apenas `fastify.inject`.

## 9. Verificação final e prova de reconstrução

Executar comandos reais de qualidade — descobrir scripts antes:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test
# executar scripts existentes de migração, importação e e2e
```

- Rodar verificações do banco: schema aplicado, tabelas, índices, FKs/unique, base de dados conectada, contagens, integridade, histórico de importação e erros não tratados.
- Executar backup/restore em banco separado quando aplicável, com checksum; se não possível, registrar BLOQUEADO e riscos.
- Repetir uma importação sobre a base isolada para provar idempotência, e executar reconsulta de dados após restart do container para demonstrar persistência.
- Reconectar ao ambiente original somente se foi alterada alguma variável de ambiente da sessão, garantindo que conexões do agente não fiquem apontadas por engano para banco de verificação.
- **Não executar limpeza destrutiva** de volumes por padrão; se banco isolado deve permanecer disponível para análise, documentar Compose project, volume, porta e comando seguro de parada sem remover volumes. Remoção posterior somente sobre recursos isolados identificados e mediante aprovação específica.

## 10. Problemas encontrados e política de correção

- Classificar severidade, origem, caminho afetado e evidência. Corrigir bugs P0/P1 com testes, sem mascarar.
- Se correção exigir schema, gerar nova migração incremental e repetir o fluxo de banco vazio. Se exigir mudança de regras, atualizar ADR/rules e relatar o motivo.
- Não criar scripts de reset global para contornar erro. Não mudar fontes/datasets silenciosamente.
- Qualquer ação destrutiva não autorizada deve ser bloqueada, não executada.

## 11. Entregáveis documentais

- `docs/audits/AUDIT-ENV-DOCKER-DB-AND-E2E-VALIDATION.md`.
- `docs/reports/REPORT-ENV-FULL-REBUILD-AND-VALIDATION.md`.
- `docs/operations/DOCKER-POSTGRES-REBUILD-RUNBOOK.md` com dois fluxos A/B, backups, problemas no Windows, portas, healthchecks e comandos reais para ambiente isolado.
- `docs/operations/DATASET-IMPORT-RUNBOOK.md` atualizado.
- `docs/testing/TEST-MATRIX.md`, `docs/ROADMAP.md`, `docs/operations/RELEASE-CHECKLIST.md` atualizados conforme resultado.

Relatório final precisa conter, no mínimo: contexto do ambiente (sem dados privados), método A/B, containers/volumes identificados, versões de Docker/PG/pnpm/Node, migrations aplicadas, checksums, release e data do dataset, contagens reais, erros, segunda importação, integridade, SQL EXPLAIN, endpoints/rotas, suites de teste por browser, observabilidade, questões de licença, arquivos alterados e **decisão real de prontidão**.

## 12. Critérios de aceite inegociáveis

- [ ] Ambiente original preservado, sem perda/remoção de volumes.
- [ ] PostgreSQL 17 sobe com healthcheck e conexão testada.
- [ ] Banco **novo** criado do zero via migrations Drizzle, pending: [].
- [ ] Dataset integral real obtido com release/checksum e importado; caso indisponível, marcar bloqueio.
- [ ] Importação repetida sem duplicação; métricas explicadas.
- [ ] FKs, uniques, extensões, Unicode e relações verificados.
- [ ] Dados do catálogo separados de fixtures e conteúdo editorial não licenciado.
- [ ] API Fastify testada contra o novo banco; OpenAPI, health/readiness e buscas verificadas.
- [ ] StudioGraph, LoreGraph e AdaptationLab testados conforme dados realmente disponíveis.
- [ ] Anti-spoiler no payload e admin fail-closed/seguro confirmados.
- [ ] Angular validado com navegação real; E2E browser quando disponível.
- [ ] Lint, typecheck, build e testes reportados com evidência.
- [ ] Backup/restore ou bloqueio explícito; persistência pós-restart comprovada.
- [ ] Documentação atualizada, riscos e GO/CONDITIONAL-GO/NO-GO fundamentados.

**RESULTADO ESPERADO:** prova de que o AnimeVerse Intelligence pode ser reconstruído e populado do zero, com volume real e sem dependência de dados manuais ocultos ou destruição do banco atual. Não alegar conclusão total quando um passo obrigatório não pôde ser executado.
