# AnimeVerse Intelligence — Instruções Canônicas do Agente (`AGENTS.md`)

Este arquivo é o ponto de entrada canônico para o Antigravity CLI na raiz do repositório. **Não duplique** regras detalhadas aqui; consulte sempre as regras temáticas em `.agents/rules/`.

## Ordem obrigatória de leitura antes de qualquer alteração

1. `.agents/rules/` (`architecture.md`, `angular-standards.md`, `feature-based-structure.md`, `typescript-conventions.md`, `fastify-and-data.md`, `testing-standards.md`, `documentation-sdd.md`, `repository-governance.md`).
2. `docs/ROADMAP.md` e o último relatório em `docs/reports/`.
3. Especificações aplicáveis em `docs/specifications/` e ADRs em `docs/architecture/decisions/`.
4. Auditorias relevantes em `docs/audits/`.

## Proibições absolutas

- Contrariar as fronteiras arquiteturais ou padrões verificados por `eslint.config.mjs` (`tooling/eslint-plugin-animeverse.mjs`).
- Criar componentes Angular com `template:`/`styles:` inline, sem `ChangeDetectionStrategy.OnPush`, ou com `zone.js`.
- Exportar interfaces/types/enums/constantes de domínio dentro de `.component.ts` ou `.service.ts`.
- Inventar dados ausentes, inferir semântica em `relatedAnime`, redistribuir imagens externas sem licença ou abrir endpoints HTTP públicos de escrita/ingestão no MVP.
- Executar comandos destrutivos (`DROP`, `docker compose down -v`, `git push --force`, releases) sem autorização explícita.

## Comandos de validação obrigatórios

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Com PostgreSQL Docker ativo (`docker compose up -d postgres`):

```powershell
pnpm --filter @animeverse/api db:migrate
pnpm --filter @animeverse/api db:status
pnpm --filter @animeverse/api dataset:import -- --file test/fixtures/anime-offline-sample.jsonl
```
