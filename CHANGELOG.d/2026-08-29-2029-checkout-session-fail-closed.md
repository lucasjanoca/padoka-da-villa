# 2026-08-29 20:29 — Checkout confirma sessão antes e depois da RPC

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/order-idempotency.js` agora confirma a sessão real via `auth.getSession()` antes de criar/reconciliar uma tentativa de pedido e falha de forma fechada quando a confirmação sofre erro ou rejeição de transporte.
- A resposta de `padoka_create_order_once` só é aplicada depois de revalidar `user_id + lifecycleEpoch` contra uma nova confirmação da sessão, impedindo resposta atrasada de identidade anterior após logout/troca de conta.
- Rejeições reais de transporte da RPC agora preservam a tentativa existente e o mesmo `request_id` em `sessionStorage`, oferecendo reconciliação idempotente em vez de criar uma nova tentativa.
- O checkout continua bloqueado por `AUTOMATIC_PIX_READY=false` até existir integração Pix automática real e auditada; comprovante/confirmação manual continua sem autorizar pedido.
- `tests/order-idempotency-audit.mjs` passou a exigir confirmação de sessão fail-closed, captura de rejeição de transporte da RPC e revalidação pós-RPC.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; portanto nenhum privilégio foi ampliado e não houve necessidade de alteração nos Security Advisors.
