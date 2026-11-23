# Auditoria — Fase 30: Auditoria Visual, UX, Acessibilidade e Consistência da Interface

**Data:** 2026-11-23  
**Base de validação:** Execução real em Chromium (`1440x900`), Firefox (`1440x900`), WebKit (`1440x900`) e Mobile Chromium (`390x844`) contra Angular 22 + Fastify 5 + PostgreSQL 17 (`38.519` obras).

---

## 1. Inventário Visual das Rotas Efetivas

| Rota           | Desktop (`1440x900`) | Mobile (`390x844`)  | Overflow Horizontal | Erros JS / Console |
| -------------- | -------------------- | ------------------- | ------------------- | ------------------ |
| `/catalog`     | Renderizado          | Renderizado         | `0`                 | `0`                |
| `/catalog/:id` | Renderizado          | Renderizado         | `0`                 | `0`                |
| `/relations`   | Renderizado          | Renderizado         | `0`                 | `0`                |
| `/studios`     | Renderizado          | Renderizado         | `0`                 | `0`                |
| `/sources`     | Renderizado          | Renderizado         | `0`                 | `0`                |
| `/lore`        | Placeholder honesto  | Placeholder honesto | `0`                 | `0`                |
| `/adaptation`  | Placeholder honesto  | Placeholder honesto | `0`                 | `0`                |
| `/about`       | Renderizado          | Renderizado         | `0`                 | `0`                |

---

## 2. Achados Classificados

| ID       | Severidade | Origem                             | Descrição                                                                                                                                                                           | Critério de Correção                                                       |
| -------- | ---------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `UX-001` | **P2**     | `apps/web/src/styles/_tokens.scss` | Ausência de `color-scheme: dark` / `color-scheme: light` nos seletores de tema, fazendo controles nativos (scrollbars/selects) não acompanharem o tema no Windows/Chromium/Firefox. | Adicionar `color-scheme: dark` e `color-scheme: light` nos tokens de tema. |
| `UX-002` | **P3**     | `/lore`, `/adaptation`             | Telas exibem placeholder explícito enquanto não há curadoria editorial autenticada (Fase 31).                                                                                       | Manter placeholder honesto sem simular conteúdo editorial fictício.        |

---

## 3. Pontos Fortes Verificados

- Tokens centralizados em `apps/web/src/styles/_tokens.scss` com suporte completo a `dark` e `light`, contraste adequado e `@media (prefers-reduced-motion: reduce)`.
- `:focus-visible` global com outline `2px solid var(--accent-secondary)` e classe `.sr-only` acessível.
- Navegação por teclado (`Tab`) verificada em todos os 4 projetos Playwright.
- Zero emojis usados como ícones estruturais; 100% paridade i18n (`pt-BR`/`en`) validada em `i18n-parity.spec.ts`.
- Bundle inicial otimizado (`293.87 kB` raw / `79.66 kB` transfer) com lazy loading em todas as rotas.
