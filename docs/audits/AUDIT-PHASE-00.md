# Auditoria Inicial do Repositório — Fase 00

**Projeto:** AnimeVerse Intelligence  
**Data:** 2026-11-23  
**Fase:** 00 / baseline-e-ambiente  
**Raiz verificada:** `C:\Users\erick.alves\Documents\GitHub\anime-verse-intelligence`  
**Status da auditoria:** CONCLUÍDA

---

## 1. Estado do Git e controle de versão

Comandos executados na raiz do repositório:

```powershell
git rev-parse --show-toplevel
git branch -a
git status --short --branch
git log --stat -n 5
git remote -v
```

### Resultados observados

- **Top-level Git:** `C:/Users/erick.alves/Documents/GitHub/anime-verse-intelligence` (Antigravity CLI `1.5.15` operando na raiz correta).
- **Branch atual:** `main` (rastreando `origin/main`).
- **Remote configurado:** `origin` → `https://github.com/ErickG123/anime-verse-intelligence.git` (fetch/push).
- **Histórico de commits:** 1 commit (`403b0df feat: initial commit`, em `2026-11-23 14:52:25 -0300`), contendo apenas `README.md` com 58 bytes (`# anime-verse-intelligence`).
- **Mudanças não commitadas e arquivos não rastreados:**
  - `M README.md` — arquivo modificado no working tree (substituído pelo README do kit de prompts; 3.355 bytes). O Git exibiu aviso `LF will be replaced by CRLF` devido a `core.autocrlf = true` e `git diff` tratou o arquivo original como binário (possível BOM/UTF-16LE no commit inicial).
  - `?? CHECKLIST-EXECUCAO.md`
  - `?? PROMPT-MESTRE.md`
  - `?? REFERENCIAS.md`
  - `?? bootstrap/` (contendo regras, templates e docs base do kit)
  - `?? prompts/` (21 arquivos `PROMPT-00` a `PROMPT-20`)

---

## 2. Inventário reproduzível de arquivos e diretórios

Comando de inventário (excluindo `.git`):

```powershell
Get-ChildItem -Force -Recurse | Where-Object { $_.FullName -notmatch '\\\.git(\\|$)' } | Select-Object @{N='RelativePath';E={$_.FullName.Substring((Get-Location).Path.Length + 1)}}, @{N='Type';E={if($_.PSIsContainer){'DIR'}else{'FILE'}}}, Length | Format-Table -AutoSize
```

### 2.1 Raiz do repositório (antes da criação dos artefatos da Fase 00)

| Caminho                 | Tipo | Tamanho (bytes) | Situação Git     | Observação                                           |
| ----------------------- | ---- | --------------: | ---------------- | ---------------------------------------------------- |
| `README.md`             | FILE |           3.355 | Modificado (`M`) | Documentação do kit de prompts (não do app)          |
| `CHECKLIST-EXECUCAO.md` | FILE |           2.589 | Untracked (`??`) | Checklist de execução das fases 00–20                |
| `PROMPT-MESTRE.md`      | FILE |           2.241 | Untracked (`??`) | Guia opcional de orquestração SDD                    |
| `REFERENCIAS.md`        | FILE |           1.329 | Untracked (`??`) | Referências técnicas e licenças verificadas          |
| `bootstrap/`            | DIR  |               — | Untracked (`??`) | Arquivos de bootstrap ainda não copiados para a raiz |
| `prompts/`              | DIR  |               — | Untracked (`??`) | 21 prompts sequenciais (`PROMPT-00` a `PROMPT-20`)   |

### 2.2 Conteúdo de `bootstrap/`

| Caminho                                                 | Tipo | Tamanho (bytes) | Finalidade                                  |
| ------------------------------------------------------- | ---- | --------------: | ------------------------------------------- |
| `bootstrap/AGENTS.md`                                   | FILE |           2.696 | Regras permanentes canônicas do agente      |
| `bootstrap/GEMINI.md`                                   | FILE |             188 | Ponteiro para `AGENTS.md`                   |
| `bootstrap/.agents/rules/01-sdd.md`                     | FILE |             312 | Regra de processo SDD                       |
| `bootstrap/.agents/rules/02-angular.md`                 | FILE |             278 | Regra de padrões Angular 22                 |
| `bootstrap/.agents/rules/03-fastify.md`                 | FILE |             257 | Regra de padrões Fastify 5                  |
| `bootstrap/.agents/rules/04-dados.md`                   | FILE |             338 | Regra de modelagem, JSONL e licenças        |
| `bootstrap/.agents/rules/05-tests.md`                   | FILE |             272 | Regra de testes e CI                        |
| `bootstrap/docs/PRODUCT-BASELINE.md`                    | FILE |           1.169 | Escopo MVP, pós-MVP e fora do MVP           |
| `bootstrap/docs/ROADMAP.md`                             | FILE |           1.638 | Tabela inicial das fases 00–20              |
| `bootstrap/docs/architecture/decisions/ADR-TEMPLATE.md` | FILE |             260 | Template de ADR                             |
| `bootstrap/docs/data-sources/SOURCE-REGISTRY.md`        | FILE |             932 | Registro inicial de fontes e licenças       |
| `bootstrap/docs/templates/REPORT-TEMPLATE.md`           | FILE |             473 | Template de relatório de fase               |
| `bootstrap/docs/templates/SPEC-TEMPLATE.md`             | FILE |             452 | Template de especificação SDD               |
| `bootstrap/docs/testing/TEST-MATRIX.md`                 | FILE |             193 | Matriz inicial de rastreabilidade de testes |

### 2.3 Conteúdo de `prompts/`

Contém 21 arquivos Markdown sequenciais, de `prompts/PROMPT-00-baseline-e-ambiente.md` até `prompts/PROMPT-20-roadmap-pos-mvp.md`.

### 2.4 Pastas esperadas pelo protocolo que ainda NÃO existiam na raiz

- `AGENTS.md` (existe apenas em `bootstrap/AGENTS.md`)
- `GEMINI.md` (existe apenas em `bootstrap/GEMINI.md`)
- `.agents/rules/` (existe apenas em `bootstrap/.agents/rules/`)
- `docs/specifications/` (não existe ainda — prevista a partir da Fase 01)
- `docs/architecture/decisions/` (não existe na raiz; template em `bootstrap/docs/architecture/decisions/`)
- `docs/reports/` (criada nesta Fase 00)
- `docs/audits/` (criada nesta Fase 00)
- `docs/testing/` (não existe na raiz; template em `bootstrap/docs/testing/`)
- `docs/data-sources/` (não existe na raiz; registro base em `bootstrap/docs/data-sources/`)

---

## 3. Tecnologias, dependências e scripts existentes

- **Código de aplicação:** Nenhum (`apps/`, `packages/`, `src/` inexistentes).
- **Manifestos e lockfiles:** Nenhum (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.json`, `angular.json` inexistentes).
- **Infraestrutura:** Nenhum (`docker-compose.yml`, `Dockerfile`, `.env.example` inexistentes).
- **Testes automatizados / CI:** Nenhum (`vitest.config.*`, `playwright.config.*`, `.github/workflows/` inexistentes).
- **Scripts de automação:** Nenhum script executável no repositório.

---

## 4. Conferência de `.gitignore`, `README.md` e arquivos de regras (lacunas)

| Item                      | Estado atual                                                          | Lacuna / Risco                                                                                                                                                                  | Ação recomendada                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.gitignore`              | **Ausente** na raiz                                                   | Risco alto de versionar `node_modules/`, `.env`, `dist/`, `.angular/`, logs e artefatos temporários a partir da Fase 03                                                         | Criar `.gitignore` completo (Node/pnpm/Angular/Fastify/Docker/IDE/OS) antes ou no início da Fase 03                                                                                   |
| `.gitattributes`          | **Ausente** na raiz                                                   | `core.autocrlf = true` no Git Windows já gerou aviso LF→CRLF em `README.md`; pode gerar diffs ruidosos em scripts/YAML/JSON                                                     | Adicionar `.gitattributes` padronizando LF para código/docs e CRLF apenas se necessário para `.ps1`/`.bat`                                                                            |
| `README.md`               | **Presente e modificado (`M`)**, mas descreve o ZIP do kit de prompts | Não reflete ainda o projeto AnimeVerse Intelligence (setup, arquitetura, comandos); está divergente de `HEAD`                                                                   | Decidir se commita o estado atual como baseline do kit e atualizar o `README.md` do projeto a partir das Fases 01–03                                                                  |
| `AGENTS.md` e `GEMINI.md` | **Ausentes na raiz** (presentes apenas em `bootstrap/`)               | O Antigravity CLI procura `AGENTS.md`/`GEMINI.md` e `.agents/rules/` na raiz do repositório; enquanto ficarem apenas dentro de `bootstrap/`, não são carregados automaticamente | Copiar o conteúdo de `bootstrap/` para a raiz do repositório (conforme instruído no passo 2 do `README.md` do kit) antes da Fase 01, sem sobrescrever `docs/ROADMAP.md` já atualizado |
| `.agents/rules/`          | **Ausente na raiz** (presente apenas em `bootstrap/.agents/rules/`)   | As 5 regras temáticas (`01-sdd.md` a `05-tests.md`) não estão ativas na raiz                                                                                                    | Promover junto com `bootstrap/` para a raiz                                                                                                                                           |

---

## 5. Riscos de substituição e preservação de trabalho não commitado

1. **Trabalho não commitado do operador:** `README.md` (modificado), `CHECKLIST-EXECUCAO.md`, `PROMPT-MESTRE.md`, `REFERENCIAS.md`, `bootstrap/` e `prompts/` não estão commitados. Nenhum desses arquivos foi alterado ou descartado na Fase 00.
2. **Risco de conflito ao promover `bootstrap/`:** Ao copiar `bootstrap/docs/` para `docs/`, o operador deve preservar `docs/ROADMAP.md` (já criado e atualizado na Fase 00) para não regredir o status da Fase 00 para `Planejado`.
3. **Política de versionamento do kit:** Definir se `prompts/`, `bootstrap/`, `PROMPT-MESTRE.md` e `CHECKLIST-EXECUCAO.md` permanecerão versionados no repositório ou serão removidos/ignorados após a cópia do `bootstrap/` para a raiz.
4. **Licenças e fontes externas:** Nenhuma fonte externa foi consultada para ingestão nesta fase. O registro inicial em `bootstrap/docs/data-sources/SOURCE-REGISTRY.md` já documenta `cedya77/anime-offline-database` (ODbL 1.0 / DbCL 1.0) como fonte inicial e mantém AniList, Wikidata, MangaUpdates e TMDB inativos.
