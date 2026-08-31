## 2026-08-30 — Telemetria limitada à superfície pública

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- `assets/telemetry.js` agora encerra imediatamente em `internal.html`, `pedidos.html`, `pdv.html`, `gestao.html`, `enterprise.html` e `mfa.html`, antes de criar/restaurar sessão de telemetria ou configurar envios.
- A telemetria pública continua enviando somente eventos permitidos, metadados sanitizados e `credentials: 'omit'` para a Edge Function `padoka-telemetry`.
- Criado `tests/telemetry-boundary-audit.mjs` para impedir que páginas internas voltem a produzir telemetria pública por regressão.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução.
