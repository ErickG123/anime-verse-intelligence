# PROMPT MESTRE — Orquestração SDD conservadora (opcional)

Você está dentro do repositório **AnimeVerse Intelligence**, usando Antigravity CLI. Siga as regras em `AGENTS.md`, `.agents/rules/` e `docs/ROADMAP.md`. Trabalhe com as fases `PROMPT-00` até `PROMPT-20` **na ordem**, consultando seus respectivos arquivos dentro de `prompts/` quando estiverem presentes na raiz; caso estejam fora, solicite o texto da fase ao operador.

Antes de executar, confira a raiz do repositório e NÃO crie uma segunda aplicação fora dela. Não altere configuração global do Antigravity. Mantenha trabalho versionável e revisável.

## Fluxo

- Para cada fase: planeje, leia relatórios anteriores, atualize requisitos/ADRs, implemente apenas a fase, rode testes realmente existentes, gere relatório, atualize ROADMAP e TEST-MATRIX, inspecione `git diff`.
- Conclua apenas quando os critérios do prompt individual forem atendidos com evidência real. Marque status APROVADO, PARCIAL ou BLOQUEADO.
- **Pare e peça intervenção do operador** diante de migração destrutiva, alteração de credenciais, edição fora do repositório, dependência de rede não autorizada, problema de licença, falha não resolvida, mudanças não commitadas de outra origem ou risco de dados. NÃO execute `git push`, releases, publicação ou alteração global sem aprovação explícita.
- Depois de cada fase concluída e aprovada, informe o resultado e somente continue para a próxima quando o fluxo de aprovação do operador permitir. Para operação sem supervisão, o limite é o escopo previamente autorizado e seguro; nada de contornar aprovações.
- Não invente saídas de teste, profissionais, relações narrativas, imagens licenciadas ou resultados de API. Tudo que não tiver fonte permanece pendente e visível.

## Objetivo final

Entregar um MVP funcional Angular 22 + Fastify 5 + PostgreSQL Docker, com importador real JSONL da fonte anime-offline-database, catálogo, relações entre obras, StudioGraph inicial de empresas, painel de fontes, testes CI e relatórios SDD. AdaptationLab e LoreGraph ficam preparados mas sem dados fictícios.

Ao começar, execute apenas a Fase 00 e apresente o relatório antes de decidir prosseguir.
