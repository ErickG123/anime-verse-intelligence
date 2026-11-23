# PROMPT 24 — MangaUpdates + Wikidata: enriquecimento editorial, identidades e proveniência

**Executar no repositório real, com leitura prévia de `docs/agent-workflows/references/CONTRATO-COMUM.md`** e todas as regras de `.agents/`, `AGENTS.md`, `GEMINI.md`, ROADMAP, ADRs, specs, matriz de testes e relatório da Fase 23. Auditar/implementar/testar/documentar, sem antecipar resultados.

## 0. Gate inicial

- Inspecionar relatório real da Fase 23 e bloqueios. Confirmar que os mecanismos comuns de fonte (Fase 22) estão disponíveis, ou documentar plano de adaptação sem duplicação.
- Auditar modelos de anime/mangá, autores, editoras, obras de origem, pessoas, empresas, identificadores externos, `data-sources`, filas/jobs e permissões de persistência.
- Confirmar que a arquitetura do frontend continua feature-based, arquivos separados e regras AST ativas.
- Criar `docs/audits/AUDIT-PHASE-24-EDITORIAL-SOURCES.md` com matriz de lacunas e riscos.

## 1. Objetivo e limites

Complementar o catálogo anime com **metadados editoriais e relações de adaptação/animação** provenientes de fontes legais: MangaUpdates e Wikidata. Implementar **conectores independentes**, resolução de identidade com evidência, apresentação contextual e governança por atributo. **Não** desenvolver scraping ou clonagem de bases, comparativo Japão/Brasil completo, cronologia de capítulos ou análises do LoreGraph nesta fase.

## 2. Gate obrigatório de termos, licenças e acesso

1. Consultar fontes oficiais no dia da implementação: `https://mangaupdates.apidocumentation.com/`, `https://api.mangaupdates.com/`, `https://www.wikidata.org/wiki/Wikidata:Data_access`, `https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/API`.
2. Confirmar endpoints e autenticação por operação (não presumir chave/ausência de chave universal); revisar acceptable use/attribution/retention e usos comerciais.
3. Wikidata geralmente oferece dados estruturados sob CC0; licenças de imagens/capas/anexos são independentes. Para WDQS respeitar `User-Agent` identificado, quotas e limites operacionais; verificar migrações de endpoints se houver.
4. MangaUpdates pode permitir leitura pública, mas **isso não autoriza replicar todas as séries**, copiar textos longos ou persistir payload completo. Distinguir consulta sob demanda, armazenamento de identificador, cache e persistência de atributos, cada qual autorizado ou bloqueado.
5. Criar `docs/data-sources/MANGAUPDATES-SOURCE-POLICY.md` e `WIKIDATA-SOURCE-POLICY.md`, com evidências, data da revisão, política por campo, atribuição, retenção, termos e feature flags.
6. Nenhuma credencial em frontend/repositório; segredo somente em env. Não contornar 403/429/bloqueios, nem consultar em massa para enriquecer todo o catálogo.

## 3. Modelo editorial e identidade

Reutilizar tabelas anteriores e acrescentar, **se necessário e permitido**:

- `MangaWork`: obra original, título, status, serialização e origem; distinguir obra de edição e volume.
- `Contributor`: criador/autor/ilustrador, papéis por obra, com fontes.
- `Publisher`/`Imprint`: editora e selo, sem confundir com estúdio/produtora da animação.
- `MediaRelation`: anime adapta/é inspirado por mangá/novel; tipo de relação verificado, fonte e escopo.
- `ExternalIdentity`: par (provedor, ID), vínculo com entidade local, confiança, status/revisão.
- `SourceAssertion`: afirmação granular com propriedade, valor normalizado, link, captura temporal, licença, estado e autoridade da fonte.

Regras: não confundir nome igual com mesma obra, diferenciar remakes e versões, manter `unknown` como desconhecido, preservar idioma e originalidade dos títulos, preferir identidade forte por ID externo/external links e só depois match com pontuação assistida por revisão. A relação de anime↔mangá pode ser muitos-para-muitos. Guardar IDs internos imutáveis.

## 4. Conector MangaUpdates (Fastify)

- Criar/reusar `MangaUpdatesClient`, `MangaUpdatesMapper`, `MangaUpdatesIdentityResolver`, camada de serviços e testes dentro de módulos de integração adotados.
- Implementar consultas pontuais de séries e pessoas/edições quando endpoints e licenças permitirem; especificar páginas, rate limiting, timeouts, headers, respostas inválidas, 429/403/5xx, retries limitados.
- Campos alvo **apenas se oferecidos/permitidos**: título, nomes alternativos, tipo de mídia, autores/artistas, ano/status, editora/serialização e links editoriais.
- Documentar diferenças entre dados de obra japonesa e publicação brasileira (não inferir licença brasileira de `publisher` genérico).
- Não guardar sinopses integrais, reviews, capas ou payload bruto sem permissão específica.
- Rastrear importações/consultas em logs operacionais sem copiar dados não licenciados.

## 5. Conector Wikidata (Fastify)

- Preferir acesso direto por QID conhecido ou consultas parametrizadas SPARQL de escopo pequeno; impedir SPARQL arbitrário de cliente.
- Evitar queries federadas/pesadas e crawlers; impor timeout, paginação/limite, User-Agent apropriado e backoff de forma compatível com política.
- Dados alvo: QIDs de obras, criadores, editoras/companhias, gênero/tipo e relações explícitas, com qualifiers e referências quando disponíveis.
- Diferenciar afirmações com qualificadores temporais, idiomas, proveniência e possíveis itens homônimos.
- Registros Wikimedia Commons e imagens não ficam automaticamente licenciados como CC0; tratar cada mídia separadamente.
- Implementar fixtures para resultados ausentes, múltiplos QIDs parecidos, propriedades inconsistentes, obsoletas e dados contraditórios.

## 6. Reconciliador e matriz de autoridade

1. Fluxo: identificar obra local → inspecionar identificadores existentes → consultar fonte correspondente → gerar candidatos → avaliar sinais fortes/fracos → aceitar automaticamente **somente ID inequívoco e permitido** → enviar ambíguos para revisão.
2. Registrar `source`, `sourceEntityId`, `property`, valor normalizado, timestamp e status de revisão conforme contrato e permissão.
3. Estabelecer uma **matriz de precedência por atributo** (ex.: estúdio do anime ≠ editora do mangá). Não escolher uma única fonte globalmente como verdade para todos os campos.
4. Para divergências reais, preservar asserções conflitantes e mostrar conflito no painel. Não sobrescrever curadoria manual sem autorização.
5. Suportar reconsulta sob demanda, tolerância a fonte indisponível, expiração se permitido e fallback de informações locais.
6. Sem fusão automática a partir apenas da distância Levenshtein, string transliterada ou título comercial.

## 7. API, OpenAPI e frontend

- Endpoints internos sob padrões reais da API para `GET anime/:id/editorial`, `GET manga/:id`, `GET .../sources`, `GET .../identity-candidates` (este último apenas restrito). Não criar duplicações de rotas existentes.
- Contratos compartilhados com campos ausentes explicitamente; status das fontes visível em erro/indisponibilidade; validação de entrada e limites.
- Frontend: seção **Obra original / Mangá**, créditos editoriais, editora (com contexto), mídia original, status da correspondência e link de fonte; badges discretos para verificado/pendente, não colorir todos os campos sem necessidade.
- Adicionar filtros por mídia/origem **somente se tiver dados**; não criar abas vazias para todo anime.
- Integrar módulo data-sources com status de MangaUpdates/Wikidata, frequência, falhas, limites e status da política.
- Angular Signals/OnPush, HTML/SCSS/TS separados, feature-based e Transloco. Imagens só com direitos verificáveis e fallbacks.

## 8. Operação, testes e validações

### Unitários
- QID/source IDs, Unicode, títulos japoneses, homônimos, edições, mapeamento de roles, ano parcial, duplicidade, qualificador, transformação de campos, conflitos.

### Integração
- Clientes mockados (sem chamadas em CI), autenticação conforme operação, HTTP 429/403/5xx, timeouts, cancelamento, quota, páginas, não persistência de campo restrito e segurança de rotas.
- PostgreSQL real via testes isolados, migrações, integridade dos IDs, reconsulta idempotente, transações e asserções com proveniência.

### E2E
- Abrir anime → visualizar manga/origem → navegar para dados editoriais → abrir referência → ver fallback sem provedor; revisão de item ambíguo somente se painel de revisão já seguro.

### Smoke externo
- Apenas 1–3 obras de prova, consultas autorizadas, tempo/limites registrados, **sem coleta massiva**. Se bloqueado, deixar integração `BLOQUEADA`, teste offline implementado e justificativa.

Executar e registrar `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, testes E2E disponíveis, migrations status, OpenAPI e estado do Git.

## 9. Entregáveis e aceite

- `docs/audits/AUDIT-PHASE-24-EDITORIAL-SOURCES.md`
- `docs/data-sources/MANGAUPDATES-SOURCE-POLICY.md` e `WIKIDATA-SOURCE-POLICY.md`
- specs/ADR quando necessário; `docs/ROADMAP.md`, `docs/testing/TEST-MATRIX.md`
- `docs/reports/REPORT-PHASE-24-EDITORIAL-SOURCES.md` com fonte/termos, arquivo e campo permitido, cobertura real, ID matches aprovados/rejeitados, testes e matriz rastreabilidade.

### Critérios de aceite
- [ ] Conectores independentes, testados, com quota/erros e circuitos de fallback corretos.
- [ ] Consultas reais limitadas e políticas documentadas **antes** de persistir ou mostrar conteúdo.
- [ ] Reconciliação rejeita homônimos e armazena decisões revisáveis apenas quando autorizada.
- [ ] Conteúdo editorial apresentado sem confundir anime/mangá/novel, obra/edição e editora/estúdio.
- [ ] Data-sources, erros e proveniência legíveis; catálogo não depende de serviços externos online.
- [ ] Migrações, lint, build, typecheck, testes e documentação SDD com evidência.

**Não iniciar a Fase 25 com vínculos editoriais enganosos ou persistência sem licença.**
