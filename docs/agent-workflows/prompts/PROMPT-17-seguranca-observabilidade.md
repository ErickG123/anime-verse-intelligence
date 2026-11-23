# PROMPT 17 — Segurança, observabilidade e resiliência

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 17 / seguranca-observabilidade

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
Objetivo: hardening de API, dados e ingestão.
- Auditar dependências e vulnerabilidades, CORS, rate-limit, headers, validação JSON Schema, SQL parametrizado, SSRF em download, path traversal, logs de secrets, URLs externas e redirecionamentos.
- Nunca expor ferramenta de ingestão pública ou credenciais no browser. Verificar variáveis de ambiente e política de admin; documentar auth futura em ADR.
- Pino e requestId/correlationId, métricas essenciais de API/ingestão, erro com contexto sem dados sensíveis, readiness DB, status job e retries; logs legíveis em Docker/Windows.
- Cobrir resiliência: erro do banco, schema drift, falha rede, arquivo truncado, interrupção de job, retry parcial e execução concorrente (lock lógico/DB).
- Criar `docs/operations/SECURITY.md`, `OBSERVABILITY.md`, `INCIDENT-RUNBOOK.md` e registrar decisões relevantes.
Aceite: checklist de riscos evidenciado, falhas simuladas tratadas, zero segredos em Git e sem endpoint privilegiado exposto.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-17-SEGURANCA-OBSERVABILIDADE.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
