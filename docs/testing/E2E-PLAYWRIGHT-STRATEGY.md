# Estratégia de Testes E2E com Playwright — AnimeVerse Intelligence

**Última atualização:** 2026-11-23  
**Configuração canônica:** `apps/web/playwright.config.ts`  
**Suítes:** `apps/web/e2e/*.spec.ts`

---

## 1. Matriz de Navegadores

| Projeto           | Engine   | Viewport   | Uso Principal                        |
| ----------------- | -------- | ---------- | ------------------------------------ |
| `chromium`        | Chromium | `1440x900` | Desktop principal + CI PR smoke      |
| `firefox`         | Firefox  | `1440x900` | Cross-browser desktop                |
| `webkit`          | WebKit   | `1440x900` | Cross-browser Safari engine          |
| `mobile-chromium` | Chromium | `390x844`  | Mobile responsivo + touch + overflow |

---

## 2. Execução Local (Windows PowerShell)

```powershell
# 1. Instalar binários na primeira vez
pnpm --filter @animeverse/web exec playwright install chromium firefox webkit

# 2. Garantir PostgreSQL 17 isolado ativo (compose.validation.yaml, porta 55432)
# 3. Subir API e Angular (portas 3000 e 4200) e rodar:
pnpm test:e2e            # Todos os 4 projetos (48 testes)
pnpm test:e2e:smoke      # Apenas Chromium desktop (12 testes)
pnpm --filter @animeverse/web test:e2e:report
```

---

## 3. Política de Dados e Segurança em E2E

- **Nunca** rodar E2E contra banco de produção ou banco pessoal de desenvolvimento com mutações.
- Em CI, o job `e2e` usa PostgreSQL 17 efêmero com `test/fixtures/anime-offline-sample.jsonl` (zero rede externa).
- Em validação local completa, pode-se usar o banco isolado `animeverse_validation` (`127.0.0.1:55432`) com o snapshot integral (`38.519` obras).
- Testes validam diretamente payloads HTTP (`request`) para garantir `401` fail-closed em `/api/v1/admin/*` antes do schema e `404` em `POST /api/v1/anime`.
