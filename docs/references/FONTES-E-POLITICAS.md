# Referências públicas e registro de decisões de fontes

Consultar **novamente** ao executar cada fase; os termos podem mudar. Esta lista é orientação de investigação, não concessão de licença ou aprovação de armazenamento.

| Provedor               | Documentação                                                    | Pontos que devem ser verificados                                                                  |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| AniList                | https://docs.anilist.co/guide/terms-of-use                      | Condições sobre concorrência, uso comercial, armazenamento e coleta massiva                       |
| AniList                | https://docs.anilist.co/guide/rate-limiting                     | Headers, quota vigente, tratamento 429 e Retry-After                                              |
| MangaUpdates           | https://mangaupdates.apidocumentation.com/                      | Endpoints públicos, autenticação por operação, política de uso/atribuição, caching e persistência |
| MangaUpdates           | https://api.mangaupdates.com/                                   | Condições de uso e acceptable use policy disponibilizada pelo serviço                             |
| Wikidata               | https://www.wikidata.org/wiki/Wikidata:Data_access              | API, SPARQL, JSON, alternativas e limitações                                                      |
| Wikidata               | https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/API | Endpoint público, quotas, identificação e disponibilidade                                         |
| Wikimedia              | https://www.mediawiki.org/wiki/API:Main_page                    | API de wikis quando a fonte permitir, licenças de texto e mídia separadas                         |
| Cytoscape.js           | https://js.cytoscape.org/                                       | APIs de layout, eventos, filtros, memória e performance                                           |
| anime-offline-database | https://github.com/cedya77/anime-offline-database               | Revisar releases/schema/licenças e formatos com snapshot do ambiente                              |

## Modelo de análise obrigatória por fonte

1. Fonte e documentação primária oficial.
2. Versão/data/hora da política examinada e evidência (link/tópico).
3. Acesso público ou com chave, quota, limites, autenticação.
4. Operações permitidas: leitura, consulta em tela, extração, transformação, armazenamento, redistribuição, analytics, cache e retenção.
5. Uso comercial e condições de atribuição.
6. Direitos de mídia associados (capa/ilustração/scan não se confundem com dados).
7. Implementação autorizada, mitigação de riscos e alternativas quando bloqueada.
8. Testes de regressão da política (feature flag, não persistência, fallback).

**Decisão padrão em dúvida:** restringir a consulta sob demanda, não gravar payload bruto, não exibir material protegido e registrar impedimento. Solicitar revisão humana/jurídica quando necessário.
