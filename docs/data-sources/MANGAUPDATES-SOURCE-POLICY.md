# Política de Uso da Fonte — MangaUpdates API v1

**Versão:** `1.0`  
**Data da revisão:** 2026-11-23  
**Endpoint oficial:** `https://api.mangaupdates.com/v1`  
**Documentação consultada:** `https://api.mangaupdates.com/`

---

## 1. Condições verificadas

- Leitura pública de metadados de séries sem exigir conta de usuário para consultas básicas.
- **Atribuição obrigatória:** creditar explicitamente **MangaUpdates** sempre que dados da API forem exibidos.
- **Rate limit comportamental:** espaçamento razoável entre requisições e uso de cache para minimizar carga no servidor; proibido sobrecarregar a infraestrutura ou clonar a base.
- **Proibições:** nunca armazenar sinopses longas, resenhas, capas sem licença ou dumps brutos completos.

## 2. Política por campo no AnimeVerse Intelligence

- **Ativação:** opt-in via `ENRICHMENT_MANGAUPDATES_ENABLED` (`false` por padrão).
- **Permitido sob demanda (cache transitório em memória):** título da série, títulos alternativos, tipo de mídia (`Manga`/`Novel`), autores/ilustradores, ano, status de publicação, editora original (distinguindo explicitamente de publicação brasileira) e URL oficial da série.
- **Bloqueado:** sinopses integrais, reviews de usuários, imagens de capa sem licença e coleta em massa.
