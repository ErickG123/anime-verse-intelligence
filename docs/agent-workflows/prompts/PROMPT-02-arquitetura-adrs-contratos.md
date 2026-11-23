# PROMPT 02 — Arquitetura e decisões técnicas

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 02 / arquitetura-adrs-contratos

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
Objetivo: definir arquitetura evolutiva e contratos antes de scaffolding.
- Monorepo `apps/web` (Angular 22 zoneless standalone/signals) + `apps/api` (Fastify 5 TypeScript) + `packages/contracts` (apenas tipos/contratos estáveis de transporte, sem entidades de persistência) + `packages/tooling` quando justificado.
- `pnpm-workspace.yaml`; TypeScript estrito; frontend por features, backend modular por domínio (`domain/application/infrastructure/http`) sem camada cerimonial; Fastify plugins e route schemas TypeBox JSON Schema; API versionada `/api/v1`.
- Drizzle ORM + `pg`, PostgreSQL com migrations versionadas e sem `push` silencioso em produção; migrations não ficam nos contratos compartilhados.
- Versões compatíveis Angular 22/TS6/Node 26 (ou Node24 >=24.15 se necessário). Documentar verificação do ambiente antes de instalar.
- Especificar contratos conceituais: anime, provider-id, studio, producer-company, tags, related-anime (sem inferir relation-type), ingestion-run, snapshot, source-evidence, import-conflict.
- Definir UUID interno para entidades, fonte URL como identificador externo, deduplicação baseada em ID forte, matriz de proveniência por campo quando disponível e política de cache por fonte.
- Definir paginação, filtros, erros RFC7807/Problem Details quando adequado, sorting allowlist, validação de query, OpenAPI, logs estruturados Pino e health/readiness.
- ADRs: monorepo, modelo de dados e matching, API contracts, segurança de ingestão, política imagens/licenças, frontend SPA vs SSR (decisão motivada, SEO futuro).
- Criar `docs/architecture/SYSTEM-DESIGN.md`, `docs/architecture/DATA-FLOW.md`, `docs/architecture/API-CONTRACTS.md`, ADRs e diagrama Mermaid de alto nível.
Aceite: contratos, decisões e riscos aprováveis/documentados; sem migrações ou UI nesta etapa.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-02-ARQUITETURA-ADRS-CONTRATOS.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
