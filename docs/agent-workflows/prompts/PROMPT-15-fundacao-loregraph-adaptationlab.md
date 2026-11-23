# PROMPT 15 — Fundamentos de LoreGraph e AdaptationLab

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 15 / fundacao-loregraph-adaptationlab

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
Objetivo: criar modelos e ferramenta de curadoria sem alegar análise automática existente.
- Modelar `manga_work`, `manga_chapter`, `anime_episode`, `story_arc`, `story_event`, `character`, `event_relation`, `adaptation_mapping`, `source_evidence`, `curation_review` com dados opcionais e labels localizados.
- Marcar explicitamente `DRAFT/REVIEWED/PUBLISHED`, confidence, reviewer, fonte e spoiler boundary. Nunca misturar dados comprovados com inferências sem rótulo.
- Interface simples e **local/segura** para criar relações manualmente, somente após mecanismo de autenticação/admin ou via script de seed de curadoria versionado (sem endpoint público de escrita). Preferir CLI de curadoria no MVP.
- O comparador deve mostrar estado vazio explicativo quando não houver conteúdo, com detalhes da futura expansão. Não utilizar trechos/cenas/capas protegidos sem autorização.
- Casos de teste: capítulos não contíguos, episódio adaptando mais de um capítulo, eventos omitidos, relações unidirecionais, spoilers, revisão e proveniência.
- Documentar SPEC de expansão para StudioGraph com pessoas, LoreGraph e AdaptationLab e criar critérios para fontes licenciadas.
Aceite: fundação de dados útil, sem promessas de mapeamento automático, sem conteúdo fabricado.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-15-FUNDACAO-LOREGRAPH-ADAPTATIONLAB.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
