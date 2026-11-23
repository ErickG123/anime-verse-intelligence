# PROMPT 10 — Frontend de catálogo e detalhe

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 10 / catalogo-angular

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
Objetivo: entregar jornada principal ponta a ponta com dados reais.
- Criar páginas de Catálogo, Detalhe do anime, Busca e Explorar por temporadas/estúdios. Utilizar API real e estados loading/empty/error/retry.
- Implementar filtros sincronizados à URL (consulta compartilhável/back-forward), pesquisa com debounce e cancelamento, paginação acessível, indicadores de resultado e skeletons rápidos sem reflow exagerado.
- Detalhes: nomes alternativos, tipo, duração, episódios, status, temporada, gêneros/tags, estúdios/produtoras, links externos quando seguros, última atualização/proveniência e relações não tipadas exibidas como 'relacionados'.
- Imagens: adotar placeholder/fallback neutro de identidade própria; usar somente URLs cuja exibição for autorizada e com tratamento de falhas (nunca baixar redistribuindo capas sem permissão).
- Usar Angular Signals para estado derivado, services para I/O e models em `.model.ts` por feature; HTML/SCSS separados; atualizar traduções pt-BR/en e tokens de tema.
- Testes de unit de serviços, filtros, URL/state, detail 404 e UI de erro; Playwright smoke desktop/mobile se infraestrutura disponível.
Aceite: usuário encontra obra importada em catálogo e visualiza detalhes corretos sem mock ativo.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-10-CATALOGO-ANGULAR.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
