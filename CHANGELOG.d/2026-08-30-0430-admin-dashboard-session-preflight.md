# 2026-08-30 04:30 — Dashboard interno reconfirma sessão antes de leituras

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo como backend exclusivo da PADOKA o projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- `assets/admin-dashboard-live.js` agora centraliza `auth.getSession()` em `safeSession()`, tratando tanto o campo `error` retornado pelo Supabase Auth quanto rejeições reais de transporte.
- `refreshOrders` e `refreshOperational` reconfirmam `user_id + lifecycleEpoch` imediatamente antes de consultar `padoka_orders`, `padoka_inventory` ou `padoka_production_plans`.
- Se a sessão não puder ser confirmada, o dashboard entra em modo fail-closed: limpa métricas, pedidos e canais Realtime da identidade anterior e agenda nova validação com um epoch novo, sem reutilizar estado antigo.
- A recuperação automática foi preservada para falhas transitórias: a reativação só ocorre depois que o mesmo funcionário volta a ser confirmado pelo guard de staff e pelo Supabase Auth.
- `tests/admin-dashboard-audit.mjs` passou a exigir a leitura segura da sessão, o preflight antes das consultas e o retry fail-closed por novo lifecycle.
- O dashboard continua somente-leitura; nenhuma escrita direta em pedidos, estoque ou produção foi adicionada.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de privilégios nem modificação de objetos não `padoka_`.
