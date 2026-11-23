# PROMPT 09 — API de catálogo e busca

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 09 / catalogo-api-busca

## Protocolo obrigatório — executar em TODAS as fases
1. Trabalhe no repositório atual, nunca em uma pasta nova paralela. Antes de qualquer edição, leia `AGENTS.md`, `GEMINI.md` (se houver), `.agents/rules/`, `docs/ROADMAP.md`, `docs/specifications/`, `docs/architecture/decisions/`, `docs/reports/` (principalmente o último relatório de fase), `docs/audits/` e o código existente. Se alguma pasta ainda não existir, registre esse fato sem falhar.
2. Inspecione o estado real: branch, git status, arquivos, scripts, versões instaladas e testes existentes. Não descarte mudanças do usuário; não execute comandos destrutivos, migrações irreversíveis ou sobrescritas sem evidência e aprovação.
3. Siga SDD: escreva/atualize especificações com IDs RF/RNF, critérios de aceite verificáveis e rastreabilidade requisito → implementação → teste → evidência. Registre ADR em `docs/architecture/decisions/` antes de introduzir decisões arquiteturais significativas.
4. Implemente somente o escopo desta fase, com arquivos pequenos, tipagem estrita e sem placeholders enganosos, dados falsos em produção, `any` sem justificativa ou código morto. Modifique especificações existentes quando necessário, sem duplicá-las.
5. Rode comandos reais de validação pertinentes (lint, typecheck, testes, build, migração, smoke test). Documente comando + resultado e distinga APROVADO, PARCIAL e BLOQUEADO. Se faltar Docker, rede, permissão ou ferramenta, não declare sucesso: evidencie o impedimento e um teste reproduzível.
6. Gere `docs/reports/REPORT-PHASE-XX-<slug>.md` com resumo, arquivos alterados, requisitos cobertos, decisões, comandos/resultados, riscos, pendências e próximos passos. Atualize `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md` e `README.md` somente quando pertinente.
7. Termine com um resumo enxuto contendo status, evidências, arquivos gerados e pendências. Não avance automaticamente para outra fase. Preserve compatibilidade com Windows 11/PowerShell e Docker Desktop.
8. Respeite direitos e limites de fontes externas: URLs não equivalem a licença de imagem; não faça scraping de fontes proibidas, contorne bloqueios nem armazene dados de APIs sem autorização. Registre a origem dos dados e suas permissões.

## Missão da fase
Objetivo: disponibilizar dados realmente importados em endpoints performáticos.
- Implementar `GET /api/v1/anime` com paginação, busca em títulos/sinônimos, filtros por tipo/status/ano/season/tag/studio/producer, ordenação allowlist e limites maxPageSize.
- Implementar `GET /api/v1/anime/:id`, `/api/v1/anime/:id/related`, `/api/v1/studios` (organizações com papel STUDIO), `/api/v1/studios/:id/anime`, `/api/v1/statistics/overview` apenas quando dados suportarem.
- Todas as respostas validadas por TypeBox, com OpenAPI, cursor/offset documentado, erros 400/404 e indicadores de proveniência/freshness. Não expor raw dump irrestrito.
- Separar lógica de pesquisa do controller, queries parametrizadas via Drizzle, nunca interpolar sort livre em SQL. Testar filtros combinados, busca sem acento, aliases, paginação estável e resposta vazia.
- Especificar semântica de `score`: média do dataset quando presente, não nota pessoal; diferenciar data de última importação e data original da obra.
- Gerar relatório de `EXPLAIN ANALYZE` para consultas críticas em base representativa, corrigir índices se necessário.
Aceite: endpoints integrados a PostgreSQL e cobertos por testes de integração reais.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-09-CATALOGO-API-BUSCA.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
