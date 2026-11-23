# PROMPT 03 — Scaffolding do monorepo e ferramentas

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 03 / fundacao-monorepo

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
Objetivo: criar repositório compilável com duas aplicações reais, mas sem lógica de negócio.
- Inicializar pnpm workspace em raiz; `apps/web` com Angular CLI 22 e `apps/api` com Fastify 5; `packages/contracts` apenas se houver contrato usado por ambas as aplicações.
- Fixar versões compatíveis em package.json, lockfile, `engines`, `.npmrc` e `.node-version`/`.nvmrc` quando apropriado; scripts de dev, build, lint, test, typecheck e format em todos os pacotes.
- TS strict, ESM para API quando apropriado, aliases sem acoplamento indevido, ESLint, Prettier, EditorConfig e Husky + lint-staged + Conventional Commits. Não introduzir Nx/Turborepo sem prova de necessidade.
- Criar estrutura `.agents/rules/`, `AGENTS.md`, `GEMINI.md` canônico/ponteiro; manter docs SDD e prompts fora de código de produção.
- Criar `.env.example`, configuração de portas, `.gitignore` para banco, logs, artefatos e segredos; não comitar `.env`.
- Angular deve ter arquivos `.ts/.html/.scss` separados, standalone, zoneless e Signals; nenhuma dependência Zone.js se não requerida pela configuração oficial.
- API deve expor apenas resposta mínima `/api/v1/health` e testes básicos.
- Executar pnpm install, lint, typecheck, build, tests; corrigir todos os erros encontrados antes de concluir.
Aceite: uma única instalação na raiz, aplicações inicializando, comandos documentados e pipeline local verde.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-03-FUNDACAO-MONOREPO.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
