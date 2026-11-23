# SPEC-0005 — Expansão Pós-MVP: StudioGraph (Pessoas), LoreGraph e AdaptationLab

**Status:** Rascunho (Fase 15)  
**Prioridade:** Pós-MVP (`POST-MVP`)

## 1. Motivação e limites

O `anime-offline-database` não fornece staff individual, personagens, arcos narrativos ou capítulos de mangá. Esta especificação estabelece a fundação estrutural e os critérios obrigatórios antes de qualquer ativação em produção.

## 2. Requisitos de fundação já modelados (`0001_lore_adaptation_foundation.sql`)

- **`RF-0019` (Ciclo de curadoria):** todo registro de LoreGraph e AdaptationLab inicia em `DRAFT`, exige revisão explícita (`REVIEWED` → `PUBLISHED`) e registro de `reviewer` + `evidence_source_id`.
- **`RF-0020` (Mapeamentos não triviais):** `adaptation_mapping` suporta episódios adaptando múltiplos capítulos (inclusive não contíguos), eventos omitidos (`OMITTED`) e conteúdo original do anime (`ANIME_ORIGINAL`).
- **`RF-0021` (Fronteira de spoilers):** cada capítulo, episódio, arco, evento e mapeamento carrega `spoiler_level` (`NONE`, `MILD`, `MAJOR`) filtrável na consulta.

## 3. Critérios obrigatórios para fontes licenciadas futuras

1. Termos de uso revisados e aprovados em ADR dedicado.
2. Atribuição visível na UI e API.
3. Proibição de textos/imagens/quadros protegidos por direitos autorais sem autorização.
4. Nenhuma escrita pública na API sem autenticação forte e RBAC.
