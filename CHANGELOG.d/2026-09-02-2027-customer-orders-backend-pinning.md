# 2026-09-02 20:27 — Seus pedidos reforça pinning do backend

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD atual antes da alteração.
- O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io.
- Revisados `acompanhamento.html`, `tests/customer-orders-audit.mjs` e `tests/customer-orders-ux-audit.mjs` antes da mudança.
- Confirmado que `acompanhamento.html` continua mobile-first, sem campo de pesquisa, carregando `padoka_orders` filtrados pelo `customer_id` autenticado, ordenados por `created_at` decrescente, com Realtime filtrado por cliente, destaque `Pode vir buscar!`, progresso completo e detalhes expansíveis.
- `tests/customer-orders-ux-audit.mjs` agora fixa explicitamente `https://yncspxfsvlqdnodlsosb.supabase.co` como origem da configuração pública e exige que a CSP permita somente os endpoints HTTP/WSS do projeto PADOKA.
- A auditoria também rejeita wildcard `https://*.supabase.co` / `wss://*.supabase.co`, reduzindo o risco de regressão que amplie silenciosamente a superfície de conexão do navegador.
- Permanecem as verificações de ausência de `service_role`/`sb_secret_` e de links públicos para `internal.html`, `pedidos.html`, `pdv.html` ou `gestao.html`.
- `node --check` passou para a auditoria atualizada.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, credencial Google ou objeto não-`padoka_` foi alterado nesta execução; portanto não houve mudança de banco que exigisse consulta aos Security Advisors.
