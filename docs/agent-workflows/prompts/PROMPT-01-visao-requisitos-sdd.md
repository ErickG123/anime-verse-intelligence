# PROMPT 01 — Visão de produto e governança SDD

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 01 / visao-requisitos-sdd

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
Objetivo: transformar AnimeVerse Intelligence em visão e requisitos claros antes do código.
Escopo MVP: catálogo, filtros, detalhe de animes, estúdios/produtoras, relacionamentos explícitos ou indefinidos entre obras, painel de proveniência, importação JSONL semanal manual/CLI e grafos de obras/empresas. Fora do MVP: autenticação de usuários finais, avaliações pessoais, scraping em larga escala, IA generativa, personagens/profissionais sem fonte, análise automática de cenas, comparação detalhada anime x mangá.
Criar: `docs/VISION.md`, `docs/PRODUCT-SCOPE.md`, `docs/GLOSSARY.md`, `docs/BACKLOG.md`, `docs/ROADMAP.md`, `docs/specifications/SPEC-0001-catalogo.md`, `SPEC-0002-ingestao.md`, `SPEC-0003-relacionamentos.md`, `SPEC-0004-data-governance.md`, `docs/testing/TEST-MATRIX.md`.
- Definir públicos, jornadas, métricas-alvo não inventadas, riscos, NFRs (desempenho, disponibilidade, segurança, a11y, i18n, observabilidade, LGPD caso dados pessoais entrem no futuro).
- Definir RF/NFR com IDs estáveis e critérios Given/When/Then; registrar prioridades MVP/Pós-MVP.
- Criar estados e regras para dado faltante, conflitante, sem proveniência e indisponível.
- Representar módulos futuros StudioGraph/LoreGraph/AdaptationLab no roadmap, sem prometer dados inexistentes.
Aceite: cada funcionalidade MVP mapeia a requisitos e testes previstos; escopo fora do MVP explícito.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-01-VISAO-REQUISITOS-SDD.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
