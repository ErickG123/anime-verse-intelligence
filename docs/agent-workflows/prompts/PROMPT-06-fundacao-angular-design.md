# PROMPT 06 — Angular shell e design system inicial

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 06 / fundacao-angular-design

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
Objetivo: construir interface base consistente sem aparência genérica de dashboard e sem dados simulados.
- Angular 22 standalone, zoneless, Signals para UI local, RxJS somente para I/O async necessário; rotas lazy e features separadas; `.model.ts` domínio, `.ts/.html/.scss` por componente, sem lógica excessiva em components.
- Criar shell com header, navegação Catálogo, Descobrir, Relações, Fontes (read-only), Sobre; componentes de cabeçalho, toolbar, searchbox, filter-panel, cards, estados de carregamento, vazio e erro, breadcrumbs, modal/drawer.
- Design tokens: cores, tipografia, spacing, radius, elevation, motion, acessibilidade e dark/light mode; nenhuma imagem não licenciada, emojis decorativos ou dados fictícios em tela de produção. Ícones gratuitos consistentes.
- Layout responsivo desktop/tablet/celular, navegação por teclado e foco visível, contraste WCAG AA, reduced motion.
- Instalar Transloco pt-BR/en com namespaces por feature; pt-BR padrão, nenhuma string de UI hardcoded em templates.
- API base URL em environment dev/prod sem segredos, interceptor de erro HTTP, models para estados; sem inventar endpoints.
- Testar shell em temas, mobile e desktop; capturar evidências visuais se browser disponível.
Aceite: shell navegável/compilável, visual coerente, i18n funcionando, sem dados falsos.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-06-FUNDACAO-ANGULAR-DESIGN.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
