# Regra — Convenções TypeScript (`typescript-conventions.md`)

- TypeScript 6 `strict` em todos os pacotes; `@typescript-eslint/no-explicit-any: error` (zero `any` sem justificativa documentada).
- **Separação rigorosa de arquivos no frontend (validada via ESLint AST):**
  - Interfaces/modelos de domínio → `.model.ts`
  - Type aliases auxiliares → `.types.ts`
  - Enumerações → `.enum.ts`
  - Constantes nomeadas de domínio → `.constants.ts`
  - Funções puras → `.utils.ts`
  - **Proibido** exportar interfaces, types, enums ou constantes de domínio dentro de `.component.ts`, `.service.ts` ou `.interceptor.ts`.
- Não duplicar contratos HTTP existentes em `packages/contracts/` nem criar arquivos genéricos `interfaces.ts`/`types.ts` misturando múltiplos domínios.
