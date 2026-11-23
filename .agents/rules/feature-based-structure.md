# Regra — Estrutura Feature-Based (`feature-based-structure.md`)

- `apps/web/src/app/` organiza-se em `core/`, `layout/`, `shared/` e `features/<feature>/` (`pages/`, `components/`, `services/`, `models/`, `constants/`, `<feature>.routes.ts`).
- `core/` contém apenas infraestrutura transversal (interceptors, i18n, temas, modelos transversais).
- `shared/` contém apenas componentes/modelos genuinamente reutilizáveis.
- **Fronteiras obrigatórias (verificadas via ESLint AST):**
  - `core/` e `shared/` NÃO podem importar de `features/`.
  - Uma feature NÃO pode importar arquivos internos de outra feature.
  - Usar aliases `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*` evitando caminhos relativos profundos.
  - Lazy loading (`loadChildren` / `loadComponent`) em todas as rotas de features.
