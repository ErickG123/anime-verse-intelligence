# Política de Curadoria e Direitos — LoreGraph

**Versão:** `1.0`  
**Data:** 2026-11-23

1. **Proibição de reprodução de conteúdo protegido:** nunca copiar capítulos integrais, legendas, falas extensas, scans ou textos de wikis sem licença compatível.
2. **Conteúdo permitido:** resumos breves e originais de curadoria, fatos objetivos, links de referência autorizados e relações tipadas com `evidenceRef` explícito.
3. **Separação rigorosa de fixtures:** fixtures sintéticas existem apenas em `apps/api/test/` e jamais são exibidas como fatos oficiais em produção.
4. **Causalidade:** relações `CAUSES` exigem evidência e revisão editorial; nunca inferir causalidade apenas por anterioridade temporal (`PRECEDES`).
5. **Proteção de spoilers:** imposta no backend antes de serialização, contagens, busca, grafos e deep-links; sem progresso informado aplica-se modo conservador (0 spoilers).
