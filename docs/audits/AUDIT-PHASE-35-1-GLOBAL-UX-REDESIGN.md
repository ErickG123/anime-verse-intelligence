# Auditoria — Fase 35.1: Redesign Global, UX/UI, Formatação de Dados e Internacionalização

**Data:** 2026-11-23  
**Escopo:** Revisão visual e funcional de todas as rotas públicas (`/catalog`, `/catalog/:id`, `/relations`, `/studios`, `/sources`, `/lore`, `/adaptation`, `/about`) em dark/light mode, desktop e mobile, com paridade 100% `pt-BR`/`en`.

## Principais Problemas Identificados e Solucionados

| ID          | Severidade | Componente / Página    | Problema Identificado                                                                                                                              | Correção Aplicada                                                                                                                       |
| ----------- | ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `UX-351-01` | **P1**     | `/catalog`             | `scoreArithmeticMean` exibido com até 8+ casas decimais; `status` e `season` como enums crus (`FINISHED`, `SPRING`); `sortBy` hardcoded em inglês. | Aplicado `DecimalPipe` (`number:'1.2-2'`), chips rápidos de formato, cards com monograma tipográfico e tradução completa via Transloco. |
| `UX-351-02` | **P1**     | `/lore`, `/adaptation` | Textos de interface hardcoded em inglês (`Work`, `No Spoilers`, `Timeline`, `Source Manga`).                                                       | Internacionalizados 100% via `TranslocoPipe` com paridade verificada em `pt-BR.json` e `en.json`.                                       |
| `UX-351-03` | **P2**     | `/about`               | Página resumida apenas à stack técnica (Angular/Fastify/PG).                                                                                       | Redesenhada com Hero + 3 cards: Missão do Produto, 4 Pilares de Inteligência e Governança Técnica.                                      |
