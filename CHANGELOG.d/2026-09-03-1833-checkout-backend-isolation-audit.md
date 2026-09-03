# 2026-09-03 18:33 — Checkout preso ao backend PADOKA por auditoria de regressão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` a partir do HEAD atual antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Revisados `pagamento.html`, `assets/checkout-page.js` e `assets/order-idempotency.js` sem alterar o runtime funcional.
- Criado `tests/checkout-backend-isolation-audit.mjs` para impedir regressões que apontem o checkout para outro projeto Supabase, removam a validação de `scope = padoka`, aceitem credencial administrativa no navegador ou introduzam referência a `auth.users`.
- A auditoria exige que o carregamento continue usando `padoka_products` e `padoka_profiles`, com configuração pública limitada à origem `https://yncspxfsvlqdnodlsosb.supabase.co` e publishable key/JWT legado de papel `anon`.
- A criação do pedido continua exclusivamente pela RPC idempotente e server-authoritative `padoka_create_order_once_v3`; as RPCs legadas não podem voltar ao runtime e gravação direta em `padoka_orders` pelo navegador é rejeitada pelo teste.
- O contrato também preserva `request_id` UUID, retry vinculado ao `user_id`, revalidação do lifecycle após a chamada e Pix automático em modo fail-closed enquanto não houver integração real.
- `pagamento.html` permanece com CSP conectando somente ao host Supabase da PADOKA; nenhum `service_role` ou `sb_secret_` pode aparecer no checkout público.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado nesta rodada; portanto não houve mudança de banco que exigisse Security Advisors.
