---
name: documentation-validation
description: Valida a consistência documental SDD do AnimeVerse Intelligence (links internos quebrados, ADRs, ROADMAP, TEST-MATRIX, checklists e frontmatter de Agent Skills).
---

# Skill: `documentation-validation`

## Objetivo

Garantir integridade e ausência de contradições na documentação canônica SDD sem reescrever relatórios históricos.

## Quando usar

- Após mover/criar arquivos Markdown, ADRs, relatórios ou skills.
- Antes de fechar uma fase ou release candidate.

## Procedimento e comandos reais

1. Executar `pnpm validate:docs` para verificar todos os `.md`, links relativos quebrados e YAML frontmatter de `.agents/skills/*/SKILL.md`.
2. Conferir alinhamento entre `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md` e `docs/operations/RELEASE-CHECKLIST.md`.
3. Preservar relatórios históricos e ADRs; atualizar apenas documentação canônica quando houver evolução.

## Critérios de aceite

- Zero skills com frontmatter inválido.
- Links canônicos válidos e fonte de verdade única por categoria.
