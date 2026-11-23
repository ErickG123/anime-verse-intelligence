# Regra — Documentação e SDD (`documentation-sdd.md`)

- Especificações em `docs/specifications/` (`SPEC-XXXX`) são a fonte de verdade de requisitos (`RF-XXXX` / `RNF-XXXX`) com critérios verificáveis.
- Toda fase ou refatoração relevante gera relatório em `docs/reports/` e atualiza `docs/ROADMAP.md` e `docs/testing/TEST-MATRIX.md` quando pertinente.
- Nunca reescrever relatórios históricos como se mudanças futuras já existissem na época; quando necessário, adicionar seção de atualização datada.
- Não criar código duplicado nem dados fictícios em produção; manter estados explícitos `MISSING`, `CONFLICT`, `UNVERIFIED` e `UNAVAILABLE`.
