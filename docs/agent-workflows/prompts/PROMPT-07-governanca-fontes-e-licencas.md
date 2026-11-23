# PROMPT 07 — Política de fontes, identificadores e licenças

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 07 / governanca-fontes-e-licencas

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
Objetivo: preparar ingestão legalmente consciente e rastreável.
- Documentar fonte inicial `cedya77/anime-offline-database` com URL da release, schema, formatos JSONL/JSONL.zst, licença ODbL/DbCL, atribuição a cedya77 e manami-project, origem de cada snapshot e obrigatoriedade de revisar termos de provedores associados.
- Definir `DATA-SOURCE-POLICY.md`: operações permitidas (download de release licenciado), limites, atribuições, imagens externas, limites de cache para futuras APIs, desativação por fonte, proteção contra SSRF e redirects.
- Criar registry tipado com `sourceId`, name, kind, endpoint, status, license, policyVersion, lastCheckedAt, permissions (fetch/store/redistribute), e mapeamento fonte → evidência.
- Especificar política de imagens: URL externa não concede licença, então renderizar fallback neutro até validação de direito de uso/termos; não hospedar quadros de anime.
- Criar decisão de matching: URLs canônicas e IDs externos como chaves fortes; título como indício insuficiente; conflitos vão para revisão humana.
- Registre plano para futuras APIs AniList, Wikidata, MangaUpdates, TMDB sem ativá-las. AniList: sem espelhamento massivo ou cache irrestrito.
Aceite: catálogo de fontes com licença e capacidades, atribuição documentada e nenhuma fonte externa extra ativa.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-07-GOVERNANCA-FONTES-E-LICENCAS.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
