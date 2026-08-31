# 2026-08-31 09:40 — UPDATE direto de pedidos removido do RLS

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md`; confirmado HEAD anterior `51d242126f7cb6eddb9a3e9a460ea97628e8689d` e backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Antes do DDL, confirmado que `padoka_orders` estava com RLS ativa e `authenticated` já não possuía privilégio `UPDATE`, embora ainda existisse a policy legada `padoka_staff_update_orders`.
- A fila interna já altera status exclusivamente pela RPC `padoka_update_order_status`; não existe necessidade operacional de `UPDATE` direto pelo navegador.
- Criada e aplicada a migration `067_remove_stale_order_update_policy.sql`, que reafirma RLS, revoga `UPDATE` de `anon`/`authenticated` e remove a policy legada sem substituí-la.
- Verificação pós-migration confirmou `rls_enabled=true`, `anon_update=false`, `authenticated_update=false` e ausência de qualquer policy `UPDATE` em `padoka_orders`.
- Criado `tests/order-direct-update-policy-audit.mjs` para impedir que a policy ou o caminho de `UPDATE` direto sejam reintroduzidos e exigir a RPC server-authoritative na fila interna.
- Nenhum objeto não-`padoka_`, credencial Google, Edge Function ou projeto InfoTech.io foi alterado.
