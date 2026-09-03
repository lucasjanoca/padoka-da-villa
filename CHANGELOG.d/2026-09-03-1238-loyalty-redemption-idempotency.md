## 03/09/2026 — PADOKA Club: resgate idempotente

- O resgate de recompensas agora usa `request_id` UUID persistido no `sessionStorage`, por cliente e recompensa, para que retry após resposta de rede ambígua reutilize a mesma intenção.
- A nova RPC pública `padoka_redeem_reward_once` permanece `SECURITY INVOKER` e delega para `padoka_rpc_private.redeem_reward_once`, que valida onboarding PADOKA via `auth.uid()`, mantém `search_path=''`, serializa a movimentação com locks e devolve o mesmo resgate quando o `request_id` já foi processado.
- `padoka_loyalty_redemptions` ganhou `request_id` e índice único parcial `(user_id, request_id)`, preservando os registros históricos existentes.
- O caminho legado `padoka_redeem_reward` foi fechado para `authenticated`, evitando que um cliente contorne a idempotência pelo RPC antigo.
- Adicionada auditoria `tests/loyalty-redemption-idempotency-audit.mjs` para impedir regressões no backend correto, ACL, sessão, request id e chamada da RPC.
- A migration foi aplicada somente ao projeto `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`). Nenhum objeto não-`padoka_` foi alterado.
