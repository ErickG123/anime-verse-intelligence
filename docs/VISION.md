# Visão de Produto — AnimeVerse Intelligence

**Status:** Aprovado (Fase 01)  
**Última atualização:** 2026-11-23

---

## 1. Propósito

**AnimeVerse Intelligence** é uma plataforma de inteligência de metadados, relações entre obras e ecossistema de produção de animes, construída com rigor de proveniência, transparência sobre lacunas de dados e respeito estrito a licenças de fontes externas.

Diferente de catálogos genéricos que misturam dados sem origem ou inferem relações não verificadas, o AnimeVerse Intelligence trata cada dado com rastreabilidade (`data_source`, `source_snapshot`, `source_evidence`), distinguindo explicitamente fatos importados, dados ausentes e conflitos entre fontes.

---

## 2. Públicos-alvo (Personas)

| Persona                                | Necessidade principal                                                                                                        | Uso no MVP                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Pesquisador / Analista de catálogo** | Consultar obras com filtros combinados, conferir sinônimos, temporadas, tags e origem verificável dos metadados              | Catálogo, busca, filtros, detalhe e proveniência                   |
| **Explorador de franquias e estúdios** | Entender conexões entre obras relacionadas e mapear quais estúdios/produtoras participaram de quais animes                   | Grafo de relações (`UNSPECIFIED` por padrão) e StudioGraph inicial |
| **Operador / Curador de dados**        | Executar ingestões idempotentes do `anime-offline-database` via CLI, auditar snapshots, erros e conflitos sem destruir dados | CLI de ingestão JSONL e painel read-only de fontes/ingestões       |

---

## 3. Jornadas principais do MVP

1. **Ingestão rastreável (Operador):** baixar/fornecer release JSONL de `cedya77/anime-offline-database` → executar CLI de importação por stream → registrar snapshot, métricas, erros/conflitos → consultar histórico no painel de fontes.
2. **Descoberta e inspeção no catálogo (Pesquisador):** pesquisar por título/sinônimo → aplicar filtros (tipo, status, temporada, ano, tag, estúdio/produtora) → abrir detalhe da obra → verificar fontes externas, metadados e eventuais lacunas sem dados inventados.
3. **Exploração de relações entre obras (Explorador):** a partir do detalhe ou da visão de grafo → navegar por `relatedAnime` como arestas não direcionadas/não tipadas (`UNSPECIFIED` salvo evidência verificada) → inspecionar vizinhança sem sobrecarga visual.
4. **Exploração de empresas — StudioGraph inicial (Explorador):** listar/buscar estúdios e produtoras → visualizar obras associadas por papel (`STUDIO` / `PRODUCER`) → navegar entre empresa e obra, com aviso explícito de que créditos individuais de staff não constam no dataset inicial.
5. **Auditoria de fontes (Operador/Pesquisador):** abrir painel read-only de fontes → verificar licença, atribuição, último snapshot e execuções de ingestão.

---

## 4. Métricas-alvo (objetivos de engenharia — não medições já realizadas)

> [!NOTE]
> Os valores abaixo são **metas de engenharia** a serem medidas em fases futuras com testes reais; nenhum número aqui representa benchmark já executado.

- **Integridade de ingestão:** 100% dos registros válidos do JSONL importados de forma idempotente (reexecução do mesmo snapshot não duplica animes, empresas, tags ou referências externas).
- **Latência de busca/catálogo (meta local/MVP):** p95 `< 300 ms` para consultas paginadas com índices PostgreSQL adequados.
- **Acessibilidade:** conformidade WCAG 2.1 AA nas telas do MVP (navegação por teclado, contraste dark/light, labels ARIA).
- **Qualidade de código:** 0 erros de lint/typecheck, cobertura de testes unitários, integração (PostgreSQL real) e E2E nos fluxos críticos do MVP.

---

## 5. Riscos estratégicos e mitigação

| Risco                                                                 | Impacto                | Mitigação                                                                                                   |
| --------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Inferir semântica inexistente em `relatedAnime` (ex.: sequel/prequel) | Alto (desinformação)   | Persistir `relation_type = UNSPECIFIED` por padrão; só especializar com evidência verificada                |
| Usar URL externa de imagem como prova de licença                      | Alto (jurídico)        | Tratar URL apenas como referência externa (`picture`/`thumbnail`); nunca redistribuir sem licença explícita |
| Espelhamento indevido de APIs terceiras (ex.: AniList)                | Alto (violação de TOS) | Manter provedores externos desativados no MVP; proibir mirror massivo em contrato e código                  |
| Ausência de dados (score, season, episodes, sinopse, personagens)     | Médio (UX enganosa)    | Estados vazios explícitos e honestos; nunca preencher com placeholders fictícios                            |

---

## 6. Evolução pós-MVP (sem prometer dados inexistentes)

- **StudioGraph completo:** créditos de profissionais/staff mediante fontes licenciadas específicas.
- **LoreGraph:** arcos, personagens, eventos, spoilers e evidências com curadoria ou fonte licenciada.
- **AdaptationLab:** comparação entre capítulos de mangá e episódios de anime com correspondências revisadas.
- **LGPD (futuro):** aplicável caso contas de usuários ou dados pessoais sejam introduzidos em fases pós-MVP (o MVP não armazena dados pessoais de usuários finais).
