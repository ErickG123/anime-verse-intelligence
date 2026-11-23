# PROMPT 05 — Fastify modular, Swagger e contratos

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 05 / fundacao-api-fastify

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
Objetivo: estruturar API modular testável sem lógica de coleção ainda.
- Implementar app factory separada de `server.ts` para usar `fastify.inject` nos testes; módulos por feature, controller/route, service/usecase, repository, schema.
- Configuração de env validada no startup; Pino com redaction de segredos; Problem Details padronizado com código, correlation/request id, sanitização de stack e HTTP status.
- Habilitar CORS estrito, headers de segurança, rate limits razoáveis, compressão se medida e Swagger/OpenAPI em ambiente apropriado (nunca expondo schemas internos perigosos).
- `GET /api/v1/health` liveness e `GET /api/v1/ready` readiness que verifica DB, sem divulgar credenciais.
- TypeBox com schemas JSON Schema completos para entradas e respostas; evitar lançar exceções como resposta de sucesso; request lifecycle, hooks e dependency injection explícita simples.
- Criar testes unitários e integração via `inject` de health, erro 400/404/500, validação, docs e readiness.
- Respeitar Fastify 5 e plugin versions compatíveis, confirmado por documentação atual.
Aceite: OpenAPI acessível em dev, health/ready coerentes, erros uniformes, suíte passando.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-05-FUNDACAO-API-FASTIFY.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
