# 2026-09-02 07:29 — Checkout idempotente valida o backend PADOKA localmente

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/order-idempotency.js` agora fixa `https://yncspxfsvlqdnodlsosb.supabase.co` e valida o `supabaseUrl` da instância ativa antes de ler sessão, vincular lifecycle ou disparar RPC de criação de pedido.
- Se a instância global `sb` apontar para outro projeto, o checkout falha fechado e mantém o envio bloqueado em vez de reutilizar Auth/RPC de um backend diferente.
- A validação é repetida imediatamente antes da chamada server-authoritative para reduzir risco de troca indevida da instância global entre a validação inicial e o envio.
- Foram preservadas as RPCs idempotentes `padoka_create_order_once` e `padoka_create_order_once_v2`; o fluxo legado `padoka_create_order` continua ausente do runtime.
- O Pix automático continua propositalmente bloqueado até existir provedor real e webhook autenticado; nenhum comprovante ou Pix estático passa a liberar pedido.
- Criado `tests/order-backend-isolation-audit.mjs` para impedir regressão do project pinning, fail-closed, RPC idempotente e ausência de credenciais privilegiadas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução; portanto não houve mudança de banco que exigisse consulta aos Security Advisors.
