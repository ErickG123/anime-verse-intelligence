# PROMPT 14 — Preparação de integrações opcionais

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 14 / contratos-enriquecimento

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
Objetivo: permitir múltiplos provedores no futuro SEM integrar serviços de forma irrestrita.
- Definir interfaces `IDataProvider`, `SourceCapabilities`, `FetchPolicy`, `SourceAttribution`, `ExternalIdentity`, `EnrichmentResult`, `Conflict` e tipagem por recurso.
- Criar registro de provedores AniList, Wikidata, MangaUpdates e TMDB como DESATIVADOS, com docs de autenticação, chaves, TOS e campos potenciais; não criar chaves fictícias ou usar API no runtime sem autorização.
- Implementar no máximo um adaptador POC opt-in de leitura pontual para uma obra (preferir Wikidata para menor risco), incluindo rate limit/timeout/circuit breaker, cache compatível com licença e flag padrão OFF. Se não for permitido, fazer adapter fake APENAS nos testes.
- Criar contratos de personagens/pessoas/créditos/mangás com campos opcionais e provenance. Não popular produção sem dados reais ou licenças.
- Resolver match entre fontes com external IDs, conflito humano e relatório; não reusar código do dataset como se fosse API.
- Testes com mock HTTP/fixtures e falhas timeout/429/500; não depender de rede externa na CI.
Aceite: arquitetura extensível documentada sem dados de terceiros armazenados irregularmente.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-14-CONTRATOS-ENRIQUECIMENTO.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
