# PROMPT 19 — Auditoria final de ponta a ponta e preparação MVP

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 19 / auditoria-final-mvp

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
Objetivo: verificar E2E e encerramento do ciclo, sem mascarar pendências.
- Repassar 00–18 e os relatórios anteriores; confrontar features do roadmap/Specs com código real, API, banco e UI. Preparar tabela por RF/NFR com estado implementado/testado/pendente/bloqueado.
- Em ambiente limpo: `pnpm install`, Docker Compose PostgreSQL, migrations, importação controlada de fixture e dataset real se acesso/licença permitir, back-end, front-end, lint, typecheck, testes e build.
- Testar jornada: importar → localizar anime → filtrar → abrir detalhe → explorar relacionados → explorar estúdio → ver proveniência e erros; desktop e mobile.
- Validar reimportação idempotente, relações órfãs, score ausente, fonte faltante, imagem quebrada, dados em branco e falha de rede.
- Avaliar licenças e atribuição/redistribuição, SEO/SPA ADR, performance e observabilidade antes de liberar publicamente.
- Criar `docs/audits/AUDIT-MVP.md`, `docs/reports/REPORT-PHASE-19-AUDITORIA-FINAL.md`, checklist release e roadmap pós-MVP por prioridade.
Aceite: evidências detalhadas; se houver bloqueadores, status PARCIAL e lista de correções em vez de 'CONCLUÍDO'. Não criar tag/release sem aprovação explícita.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-19-AUDITORIA-FINAL-MVP.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
