# Roadmap Evolutivo Pós-MVP — AnimeVerse Intelligence Completo

**Data:** 2026-11-23  
**Status:** Planejado (Fase 20 — nenhuma API externa ativada silenciosamente)

---

## 1. Ciclos evolutivos priorizados (sem prazos inventados)

| Ciclo       | Módulo                                             | Valor      | Complexidade | Dependências principais                                                                            | Riscos e requisitos legais                                                                                        |
| ----------- | -------------------------------------------------- | ---------- | ------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Ciclo 1** | **Validação operacional + Dataset completo local** | Alto       | Baixa        | Docker Desktop ativo, `EXPLAIN ANALYZE`, Playwright E2E                                            | Validar performance de trigramas com ~40k registros                                                               |
| **Ciclo 2** | **StudioGraph Completo (Pessoas e Créditos)**      | Alto       | Média        | Fonte licenciada de staff (ex.: Wikidata CC0 opt-in ou parceria), desambiguação de homônimos       | Risco de homônimos e atribuição incorreta; exige score de confiança + proveniência por crédito                    |
| **Ciclo 3** | **Curadoria Autenticada + RBAC**                   | Alto       | Média        | `ADR-0007` (OIDC/OAuth2 + `CURATOR`/`ADMIN`), auditoria `curation_review`, política LGPD           | Proteção de dados pessoais (LGPD), prevenção de vandalismo/spam                                                   |
| **Ciclo 4** | **LoreGraph (Arcos, Personagens e Eventos)**       | Médio-Alto | Alta         | Tabelas `0001_lore_adaptation_foundation.sql`, revisão humana obrigatória, filtro de spoilers      | Proibido copiar sinopses/wikis protegidas sem licença compatível (CC BY-SA exige share-alike)                     |
| **Ciclo 5** | **AdaptationLab (Mangá ↔ Anime)**                  | Alto       | Alta         | Fonte licenciada de mangás (ex.: MangaUpdates após revisão TOS), mapeamento não contíguo revisado  | Alto custo de curadoria humana; nunca alegar correspondência automática sem revisão                               |
| **Ciclo 6** | **Enriquecimento Multi-Fonte & IA Opcional**       | Médio      | Alta         | `IDataProvider` + circuit breaker + cache compatível com TOS; IA apenas sobre metadados permitidos | AniList proíbe mirror massivo; TMDB exige token/atribuição; IA nunca pode fabricar fatos sem rótulo de inferência |

---

## 2. ADRs pendentes para ciclos futuros

- **ADR-0007 (já proposto):** Autenticação OIDC/RBAC para curadoria web e governança LGPD.
- **ADR-0008 (futuro):** Estratégia de desambiguação de profissionais/staff e fontes CC0/licenciadas.
- **ADR-0009 (futuro):** SEO / Angular SSR (`@angular/ssr`) caso o catálogo seja publicado em domínio público aberto.
- **ADR-0010 (futuro):** Política de uso de IA assistiva (somente com rótulo explícito de inferência e revisão humana obrigatória).

---

## 3. Próximas fases executáveis sugeridas (Prompts 21+)

- **PROMPT-21:** Ativação do ambiente Docker + benchmark `EXPLAIN ANALYZE` + suíte Playwright E2E completa (desktop/mobile/temas).
- **PROMPT-22:** Autenticação e RBAC de curadoria (`ADR-0007`) + CLI/UI segura para `curation_review`.
- **PROMPT-23:** Integração opt-in Wikidata (CC0) para enriquecimento pontual com cache e resolução de conflitos.
- **PROMPT-24:** LoreGraph & AdaptationLab curados com controle de spoilers e proveniência auditável.
