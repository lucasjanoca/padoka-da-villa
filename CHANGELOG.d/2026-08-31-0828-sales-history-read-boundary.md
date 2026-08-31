# 2026-08-31 08:28 — Histórico de vendas restrito à gerência

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md`; confirmado HEAD anterior `e19ca34bc85af10f6611d8e099095276d0bd672a` e backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Antes de alterar RLS, confirmado que `padoka_sales` e `padoka_sale_items` estavam com RLS ativa, sem `SELECT` para `anon` e sem escrita direta para `authenticated`.
- Identificado que `assets/pdv-idempotency.js` ainda fazia um `SELECT request_id` em `padoka_sales` apenas para detectar capability, obrigando `cashier/attendant` a depender de leitura ampla do histórico.
- O probe do Caixa passou a usar a RPC não mutável `padoka_list_product_barcodes`, que já valida autenticação e papéis `owner/manager/cashier/attendant` no servidor; a finalização continua exclusivamente por `padoka_create_sale_once`.
- Criada e aplicada a migration `066_sales_history_read_role_boundary.sql`: leitura direta de `padoka_sales` e `padoka_sale_items` agora exige `owner` ou `manager` via `padoka_staff_has_role`, sem ampliar grants e sem criar trigger em `auth.users`.
- O módulo de histórico/estorno continua restrito a `owner/manager`, e relatórios financeiros continuam pela RPC server-authoritative `padoka_report_summary`.
- Criado `tests/sales-history-read-role-boundary-audit.mjs` e atualizado `tests/pdv-idempotency-audit.mjs` para impedir retorno do probe por leitura direta e das policies genéricas por `padoka_is_staff()`.
- Verificação pós-migration confirmou RLS ativa, `anon_select=false`, `authenticated` apenas com `SELECT` e policies de leitura limitadas a `owner/manager`.
- Nenhum objeto não-`padoka_`, credencial Google, Edge Function ou projeto InfoTech.io foi alterado.
