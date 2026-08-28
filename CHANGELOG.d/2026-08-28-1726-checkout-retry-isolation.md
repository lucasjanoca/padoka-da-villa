# 2026-08-28 17:26 — Retry do checkout isolado por cliente

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- Identificado que a tentativa idempotente do checkout ainda usava a chave compartilhada `padoka_pending_order_v1` e era descartada ao trocar diretamente de conta, o que podia eliminar a referência necessária para reconciliar uma resposta de rede ambígua caso o cliente original retornasse depois.
- `assets/order-idempotency.js` passou a persistir retries em `padoka_pending_order_v2:<user_id>`, lendo, gravando e removendo somente a chave da identidade autenticada.
- Logout ou troca de conta continuam bloqueando imediatamente o checkout e invalidando respostas assíncronas antigas pelo `lifecycleEpoch`, mas não apagam nem expõem o retry persistido da identidade anterior.
- Ao retornar, somente o mesmo cliente pode restaurar o `request_id` e reconciliar exatamente a tentativa anterior pela RPC `padoka_create_order_once`.
- A chave legada compartilhada é descartada durante a inicialização para evitar restauração de estado sem identidade explícita.
- `tests/order-idempotency-audit.mjs` foi ampliado para exigir namespace por `user_id`, restauração exclusiva da identidade atual, descarte da chave legada e preservação do retry da conta anterior em troca de usuário.
- `AUTH_STATUS.md` foi atualizado para refletir o novo isolamento por cliente.
- O checkout permanece fail-closed com `AUTOMATIC_PIX_READY=false`; nenhuma integração de pagamento foi simulada ou habilitada.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; portanto não houve mudança de banco a submeter aos Security Advisors.
