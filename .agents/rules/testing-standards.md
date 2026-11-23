# Regra — Testes e Qualidade (`testing-standards.md`)

- Vitest para testes unitários e de integração (`@animeverse/contracts`, `@animeverse/api`, `@animeverse/web`); `fastify.inject` para API; PostgreSQL real em Docker/CI para integração de banco e migrações.
- CI (`.github/workflows/ci.yml`) nunca depende de chamadas de rede a provedores externos.
- Antes de encerrar qualquer tarefa/fase: executar `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm test`, registrando comandos e resultados reais.
- Nunca declarar sucesso sem evidência real; classificar explicitamente `APROVADO`, `PARCIAL` ou `BLOQUEADO`.
