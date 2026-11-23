# ADR-0009 — Integração AniList Sob Demanda sem Replicação em Banco de Dados

- **Status:** Aceito
- **Data:** 2026-11-23

## Contexto

O `anime-offline-database` não fornece personagens, dubladores nem equipe de produção individual. A API GraphQL pública do AniList disponibiliza esses metadados, porém seus Termos de Uso proíbem expressamente o uso da API como serviço de backup ou espelhamento massivo de banco de dados, além de impor rate limits rígidos (`30 req/min` em modo reduzido).

## Alternativas consideradas

1. Importar em lote todos os personagens e staff do AniList para o PostgreSQL: **rejeitado** — viola diretamente os Termos de Uso do AniList e sobrecarrega o rate limit.
2. Permitir que o frontend Angular chame `https://graphql.anilist.co` diretamente: **rejeitado** — impede controle centralizado de rate limit, deduplicação, sanitização e observabilidade.
3. Implementar conector mediado pelo Fastify (`apps/api/src/modules/integrations/anilist/`) com consultas **sob demanda por obra**, queries estáticas tipadas, rate limiter conservador (`25 req/min`), deduplicação in-flight, cache transitório exclusivamente em memória (TTL curto) e zero persistência permanente no PostgreSQL.

## Decisão e motivação

Adotar a alternativa 3. Preserva conformidade jurídica, protege o catálogo local contra falhas externas e viabiliza Personagens, Dubladores, Equipe de Produção e expansão do StudioGraph com dados verificados e proveniência explícita.

## Consequências e trade-offs

- **Prós:** conformidade com TOS do AniList, zero risco de banco desatualizado/replicado, isolamento total do catálogo local.
- **Contras:** dados de personagens/staff dependem de conectividade e ativação da flag `ENRICHMENT_ANILIST_ENABLED=true` quando não estiverem no cache transitório em memória.
