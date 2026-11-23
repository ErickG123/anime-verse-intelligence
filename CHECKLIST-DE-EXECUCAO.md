# Checklist de execução — Fases 23 a 28

## Antes de cada fase

- [ ] Ler contrato comum, `AGENTS.md`, `GEMINI.md`, `.agents/rules/` e relatórios existentes.
- [ ] Verificar git status, migrações, tarefas pendentes, licença das fontes e baseline de testes.
- [ ] Confirmar gates da fase anterior (documentar qualquer bloqueio, sem presumir conclusão).
- [ ] Criar auditoria inicial e especificação/critério de aceite da fase.

## Durante a execução

- [ ] Reutilizar arquitetura feature-based e não criar lógica de domínio nos componentes.
- [ ] Separar HTML, SCSS, TS, modelos, tipos e constantes.
- [ ] Validar contratos Fastify e tipos compartilhados; versionar migrações.
- [ ] Implementar estados reais de loading, empty, error e recurso indisponível.
- [ ] Controlar fonte, licença, provenance, revisão e spoilers conforme escopo.
- [ ] Cobrir casos felizes e falhas com testes determinísticos/offline.

## Ao terminar cada fase

- [ ] `pnpm lint` e `pnpm typecheck` executados e resultados registrados.
- [ ] `pnpm build` e `pnpm test` executados e resultados registrados.
- [ ] E2E/UI e testes DB relevantes executados ou impedimentos explicitados.
- [ ] APIs/rotas, migrações e OpenAPI verificados.
- [ ] Segurança e dados reais testados de acordo com políticas externas.
- [ ] `docs/ROADMAP.md`, specs, ADRs pertinentes, `docs/testing/TEST-MATRIX.md` atualizados.
- [ ] Relatório final com status, métricas, matriz de rastreabilidade e riscos.
- [ ] Nenhum TODO crítico oculto ou comportamento falso apresentado como funcional.

## Passagem de fases

- [ ] 23 → 24: StudioGraph com filtros/navegação, fontes autorizadas, fallback e testes.
- [ ] 24 → 25: conectores isolados, reconciliação com proveniência e sem mistura de entidades.
- [ ] 25 → 26: LoreGraph de ao menos uma obra demonstrável via dados próprios/permitidos e spoiler backend testado.
- [ ] 26 → 27: correspondências e comparações com evidências, revisão pendente claramente indicada.
- [ ] 27 → 28: autorização e trilha de auditoria de todas as mutações, fluxo editorial testado.
- [ ] 28 → encerramento: matriz funcional, segurança, performance, acessibilidade, E2E, docs e release readiness demonstrados.
