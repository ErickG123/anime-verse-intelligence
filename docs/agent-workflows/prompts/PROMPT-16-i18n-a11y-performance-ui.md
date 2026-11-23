# PROMPT 16 — Refino de UX, i18n, acessibilidade e performance

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 16 / i18n-a11y-performance-ui

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
Objetivo: consolidar consistência visual e experiência responsiva baseada em telas reais.
- Auditar navegação, alinhamento, escalas tipográficas, componentes, formulários, filtros, states, modais, dark/light, densidade, overflow e navegação mobile.
- Corrigir problemas reais com tokens; evitar visual de dashboard corporativo excessivo e aparência genérica de IA. UI inspirada em universo anime sem infringir marcas/personagens.
- Expandir tradução pt-BR/en e tratamento de idiomas e títulos japoneses; não traduzir nomes próprios automaticamente.
- WCAG AA: navegação por teclado, foco, labels, aria nas visualizações, alternativa tabular ao grafo, reduced motion, contraste e testes de acessibilidade automatizados.
- Lazy load por rota, perfis de bundle, virtualização somente quando necessário, cache frontend criterioso, AbortController e tratamento race conditions.
- Testes screenshot/responsive desktop/tablet/mobile e regressão de temas com Playwright conforme disponibilidade.
Aceite: nenhum problema bloqueador de responsividade/a11y no fluxo principal; relatórios visuais com evidências reais.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-16-I18N-A11Y-PERFORMANCE-UI.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
