# Regra — Governança do Repositório (`repository-governance.md`)

- Regras ativas vivem em `AGENTS.md`, `GEMINI.md` e `.agents/rules/`.
- Prompts históricos, checklists e referências de execução vivem em `docs/agent-workflows/`.
- Não manter cópias redundantes ou obsoletas (`bootstrap/`, `primpts/` etc.) na raiz.
- Nunca commitar `.env`, credenciais, segredos ou dumps brutos; nunca executar comandos destrutivos (`DROP`, reset de banco, `git push --force`, release) sem autorização explícita e backup.
- Preservar compatibilidade com Windows 11/PowerShell, Docker Desktop e CI Linux.
