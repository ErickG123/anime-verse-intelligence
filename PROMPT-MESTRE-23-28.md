# PROMPT MESTRE — Execução controlada das Fases 23–28 (Antigravity CLI)

Você está trabalhando no repositório real **AnimeVerse Intelligence**. Primeiro leia:

1. `docs/agent-workflows/references/CONTRATO-COMUM.md` deste pacote.
2. `AGENTS.md`, `GEMINI.md`, todas as `.agents/rules/**` e os ADRs/relatórios SDD.
3. A sequência em `README.md` deste pacote.

Execute **somente uma fase por vez**, começando em 23, usando o arquivo `docs/agent-workflows/prompts/PROMPT-XX-*.md` e as evidências do projeto. A conclusão deve conter: código implementado, testes efetivamente executados, specs/ADR/ROADMAP/matriz atualizados e relatório final. Concluído não significa apenas criar arquivos.

Após cada fase, avalie os critérios de passagem. **Não avance automaticamente** se houver integridade comprometida, testes essenciais falhando, conteúdo/licença não autorizados, rota de mutação insegura ou dependência essencial não implementada. Registre o bloqueio; não invente dados nem contorne políticas. Mesmo em caso de bloqueio, conclua as entregas independentes seguras e indique claramente seu status.

Na próxima fase, releia o relatório anterior, identifique pendências com impacto e reconcile o código real; não trate o resultado anterior como sucesso garantido. Se necessário, interrompa a sequência com uma lista objetiva de bloqueios que exigem decisão humana. Não modifique `AGENTS.md`/rules por conveniência para afrouxar requisitos.

Entregue ao final da execução o resumo por fase, tabela dos critérios de aceite, testes e evidências, arquivos/rotas/migrações modificados, fontes revisadas, pendências e estado real do MVP. Não prometa trabalho futuro assíncrono.
