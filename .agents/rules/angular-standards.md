# Regra — Padrões Angular 22 (`angular-standards.md`)

1. Angular 22 standalone, **zoneless** (proibido `zone.js`) e orientado a **Signals** para estado local/derivado; RxJS apenas para I/O assíncrono (`HttpClient`, debounce, `switchMap`, `takeUntilDestroyed`).
2. **Separação obrigatória de arquivos:** proibido `template:` e `styles:` inline em `@Component`. Usar sempre `templateUrl` (`.html`) e `styleUrl` (`.scss`).
3. **`ChangeDetectionStrategy.OnPush`** obrigatório em todos os componentes Angular (validado via AST em `tooling/eslint-plugin-animeverse.mjs`).
4. Schematics em `apps/web/angular.json` fixados para `style: "scss"`, `inlineTemplate: false`, `inlineStyle: false`, `changeDetection: "OnPush"`.
5. Internacionalização via `@jsverse/transloco` (`pt-BR` padrão e `en` com 100% de paridade de chaves), dark/light mode com tokens em `_tokens.scss`, contraste WCAG 2.1 AA, zero emojis como ícones de UI (usar `AppIconComponent` SVG).
6. Componentes contêm apenas estado de apresentação, eventos e integração com serviços/stores — nunca lógica complexa de domínio ou `HttpClient` direto.
