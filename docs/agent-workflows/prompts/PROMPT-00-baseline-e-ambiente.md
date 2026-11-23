# PROMPT 00 — Auditoria inicial do repositório e ambiente

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 00 / baseline-e-ambiente

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
Objetivo: criar um baseline verificável e não presumir que o repositório está vazio.
Tarefas:
- Inventariar arquivos, pastas, tecnologias, dependências e scripts já presentes. Identificar trabalhos não commitados e riscos de substituição.
- Verificar Node.js, pnpm/Corepack, Angular CLI, TypeScript, Git, Docker/Docker Compose, disponibilidade de PostgreSQL, portas e comportamento no Windows 11. Consultar documentação Angular 22 de compatibilidade; preferir Node 26 LTS ou Node 24 >=24.15 e TypeScript >=6.0 <6.1, conforme instalação real.
- Verificar se o Antigravity CLI está operando dentro da raiz correta; não modificar configurações globais nem permissões automaticamente.
- Criar/adaptar `docs/audits/AUDIT-PHASE-00.md`, `docs/reports/REPORT-PHASE-00-BASELINE.md`, `docs/ENVIRONMENT.md` e `docs/ROADMAP.md` sem gerar implementação de negócio.
- Conferir `.gitignore`, `README.md` e arquivos de regras, documentando lacunas.
Aceite: inventário reproduzível, matriz de ferramentas com versões/estado e roadmap inicial. Não iniciar scaffolding nesta fase.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-00-BASELINE-E-AMBIENTE.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
