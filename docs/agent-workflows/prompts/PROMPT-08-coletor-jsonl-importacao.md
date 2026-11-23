# PROMPT 08 — Pipeline completo do anime-offline-database

**Projeto:** AnimeVerse Intelligence
**Execução:** Antigravity CLI, dentro da raiz do repositório.
**Fase:** 08 / coletor-jsonl-importacao

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
Objetivo: criar importador utilizável, streaming, reexecutável e seguro.
- Inspecionar primeiro schema atual do repositório/asset (não confiar em exemplos antigos) e README; arquivos de release na URL `https://github.com/cedya77/anime-offline-database/releases/download/latest/anime-offline-database.jsonl` ou a release versionada.
- Criar `dataset:download` CLI para baixar arquivo com timeout, tamanho máximo configurável, redirects seguros, status/ETag quando existente, SHA256 e registro de versão/metadata. Permitir `--file` local e `--dry-run`, para funcionar sem rede.
- Criar `dataset:import --file ...` com leitura por stream: **primeira linha é metadata**, demais linhas registros; rejeitar linha malformada com relatório, validação por JSON Schema (schema da release), normalização de fontes/URLs, detecção de duplicidades e erros.
- Persistir lotes em transações curtas com cursor/checkpoints, limites de memória, retries seguros e falha recuperável. Identificadores internos UUID, URLs de fontes associadas ao anime, `studios`, `producers`, `tags`, `relatedAnime`; relações relacionadas sem direção/tipo inferido, resolver em segunda passada.
- Criar idempotência com snapshot/version/hash: rodar duas vezes mantém contagens; atualização não apaga dados manuais ou enriqueci­dos; ausência no novo snapshot não implica remoção física; conflitos registrados.
- Testes unitários: metadata, formato inválido, campos opcionais, URLs, duplicação, conflitos, missing relationship, zero records; integração banco real; fixture pequena versionada como teste, não seed falso de produção.
- Relatar contagens total/lido/válido/atualizado/criado/ignorado/rejeitado/relacionado/conflitos e tempo; snapshots só são marcados concluídos após validação.
Aceite: importação local real, reimportação idempotente, falhas recuperáveis e registro de proveniência auditável.

## Instrução final
Entregue código e documentação apenas nos itens desta fase. Atualize `docs/reports/REPORT-PHASE-08-COLETOR-JSONL-IMPORTACAO.md` (ou um nome único equivalente) e registre o estado exato em `docs/ROADMAP.md`. Se ainda não existe requisito implementável nesta fase, escreva somente especificações/evidências. Não passe à fase seguinte.
