# Ambiente de Desenvolvimento e Matriz de Ferramentas

**Projeto:** AnimeVerse Intelligence  
**Última verificação:** 2026-11-23  
**Sistema operacional:** Microsoft Windows 11 (`Microsoft Windows NT 10.0.26200.0`, `win32 x64`)  
**Shell verificado:** Windows PowerShell `5.1.26100.9818` (`pwsh` 7 não instalado)

---

## 1. Matriz de ferramentas instaladas

Todas as versões abaixo foram obtidas por execução direta no terminal PowerShell na raiz do repositório (`C:\Users\erick.alves\Documents\GitHub\anime-verse-intelligence`).

| Ferramenta         | Comando executado                           | Versão / Resultado real                                                       | Requisito alvo                                | Estado                        |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------- |
| Antigravity CLI    | `agy --version`                             | `1.5.15`                                                                      | Instalado e na raiz do repo                   | **APROVADO**                  |
| Node.js            | `node -v`                                   | `v24.16.0`                                                                    | Node 26 LTS ou Node 24 `>=24.15` (Angular 22) | **APROVADO**                  |
| npm                | `npm -v`                                    | `11.13.0`                                                                     | Compatível com Node 24                        | **APROVADO**                  |
| pnpm               | `pnpm -v`                                   | `11.17.0`                                                                     | pnpm workspaces (Fase 03+)                    | **APROVADO**                  |
| Corepack           | `corepack -v`                               | `0.35.0`                                                                      | Disponível                                    | **APROVADO**                  |
| Angular CLI        | `ng version`                                | `22.0.2`                                                                      | Angular 22                                    | **APROVADO**                  |
| TypeScript (`tsc`) | `tsc -v`                                    | Não encontrado no PATH global                                                 | `>=6.0.0 <6.1.0` no workspace (Fase 03)       | **PENDENTE (workspace)**      |
| Git                | `git --version`                             | `2.54.0.windows.1`                                                            | Git >= 2.x                                    | **APROVADO**                  |
| Docker CLI         | `docker --version`                          | `29.9.2` (build `a82e528`)                                                    | Docker Desktop                                | **APROVADO (CLI)**            |
| Docker Compose     | `docker compose version`                    | `v5.6.1`                                                                      | Docker Compose v2+                            | **APROVADO (CLI)**            |
| Docker Daemon      | `docker info --format '{{.ServerVersion}}'` | Erro: pipe `//./pipe/dockerDesktopLinuxEngine` não encontrado (daemon parado) | Necessário a partir da Fase 04                | **BLOQUEADO (daemon parado)** |
| PostgreSQL local   | `psql --version` / `Get-Service *postgres*` | Não instalado localmente (sem `psql`, sem serviço Windows)                    | PostgreSQL via Docker Compose na Fase 04      | **PARCIAL (via Docker)**      |
| Gerenciador Node   | `nvm` / `fnm` / `volta`                     | Nenhum encontrado no PATH                                                     | Opcional (Node 24.16.0 já atende)             | **INFORMATIVO**               |
| winget             | `winget --version`                          | `v1.29.380`                                                                   | Opcional                                      | **DISPONÍVEL**                |

---

## 2. Compatibilidade Angular 22 verificada

Consulta realizada na documentação de compatibilidade do Angular 22 (`angular.dev/reference/versions` e `REFERENCIAS.md`):

- **Node.js suportado pelo Angular 22:** `^22.22.3 || ^24.15.0 || ^26.0.0` (suporte ao Node 20 removido).
  - **Ambiente atual:** `v24.16.0` → **Compatível** (atende `^24.15.0`).
- **TypeScript suportado pelo Angular 22:** `>=6.0.0 <6.1.0` (TypeScript 5.x não é suportado).
  - **Ambiente atual:** `tsc` não está instalado globalmente; deverá ser fixado como `devDependency` do workspace em `~6.0.0` (`>=6.0.0 <6.1.0`) na Fase 03.
- **Angular CLI instalado:** `22.0.2` → **Compatível**.
- **Testes no Angular 22:** Vitest como padrão (`angular.dev/guide/testing`), alinhado com as regras do projeto.

---

## 3. Verificação de portas locais

Comando executado:

```powershell
Get-NetTCPConnection -LocalPort 3000,4200,5432,8000,8080 -State Listen -ErrorAction SilentlyContinue
```

| Porta  | Uso planejado          | Estado atual |
| ------ | ---------------------- | ------------ |
| `3000` | API Fastify (dev)      | **LIVRE**    |
| `4200` | Frontend Angular (dev) | **LIVRE**    |
| `5432` | PostgreSQL (Docker)    | **LIVRE**    |
| `8000` | Reserva / utilitários  | **LIVRE**    |
| `8080` | Reserva / utilitários  | **LIVRE**    |

---

## 4. Comportamento e particularidades no Windows 11 / PowerShell

1. **PowerShell Execution Policy (`Get-ExecutionPolicy -List`):**
   - `LocalMachine`: `RemoteSigned` (demais escopos: `Undefined`).
   - Permite execução de shims locais de `pnpm`, `npm` e `ng` sem necessidade de alterar políticas globais.
2. **Git no Windows:**
   - `core.autocrlf = true` está ativo; `core.longpaths` e `core.eol` não estão definidos explicitamente.
   - **Recomendação (sem alterar config global automaticamente):** adicionar `.gitattributes` no repositório na Fase 03 para padronizar fins de linha (LF) e, se houver erros de caminho longo com `node_modules`/pnpm, o operador pode habilitar `git config core.longpaths true` localmente no repositório.
3. **Docker Desktop:**
   - Os binários `docker` (`29.9.2`) e `docker compose` (`v5.6.1`) estão instalados, mas nenhum processo do Docker Desktop estava em execução no momento da auditoria (`Get-Process -Name '*docker*'` retornou vazio).
   - **Ação necessária antes da Fase 04:** iniciar o Docker Desktop com engine Linux (`dockerDesktopLinuxEngine`) e validar com `docker info` e `docker compose version`.
4. **Testes reproduzíveis de prontidão do ambiente:**
   ```powershell
   node -v
   pnpm -v
   ng version
   git status --short --branch
   docker info --format '{{.ServerVersion}}'
   ```
