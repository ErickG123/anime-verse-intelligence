# ADR-0006 — Frontend Angular 22: SPA Zoneless no MVP (com caminho para SSR futuro)

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

Precisamos decidir entre SPA (Single Page Application) pura ou SSR (Server-Side Rendering) no Angular 22 para o MVP do AnimeVerse Intelligence.

## Alternativas consideradas

1. Angular SSR (`@angular/ssr`) desde o dia 1: útil para SEO público indexável, mas adiciona complexidade de hidratação, servidor Node extra, cuidados com `window`/DOM nos grafos interativos e configuração adicional de deploy/CORS.
2. Angular 22 SPA standalone + zoneless + Signals no MVP, mantendo código browser-agnostic nos services/DTOs para viabilizar SSR no pós-MVP se houver publicação pública orientada a SEO.

## Decisão e motivação

Adotar **SPA zoneless com Signals** no MVP (`apps/web`). O MVP é uma ferramenta de exploração analítica e grafos interativos executada localmente/internamente; evitar SSR agora reduz complexidade acidental e acelera estabilidade, mantendo a arquitetura limpa para adicionar `@angular/ssr` quando houver necessidade real de indexação pública.

## Consequências e trade-offs

- **Prós:** build estático simples, zero bugs de hidratação com grafos SVG/Canvas, menor consumo de recursos no ambiente Docker/Windows local.
- **Contras:** meta tags dinâmicas por anime para crawlers sem JS não serão renderizadas no servidor durante o MVP.

## Reversão / plano de migração

Isolar acessos a `window`/`document` atrás de `isPlatformBrowser` ou services dedicados permite ativar `@angular/ssr` via `ng add @angular/ssr` sem reescrever as features.

## Referências e validações

- `AGENTS.md`, `.agents/rules/02-angular.md`, `REFERENCIAS.md`.
