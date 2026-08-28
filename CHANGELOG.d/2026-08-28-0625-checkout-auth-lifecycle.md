## 2026-08-28 06:25 — Checkout isola tentativas por ciclo de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- `assets/order-idempotency.js` agora acompanha `onAuthStateChange` depois que o checkout é inicializado.
- Logout ou troca de conta desabilita imediatamente a continuação do checkout e substitui a apresentação da conta anterior por um estado fail-closed.
- Respostas assíncronas de `padoka_create_order_once` passam a ser vinculadas ao `activeUserId` e ao `lifecycleEpoch`; se a identidade mudar enquanto a RPC está em andamento, a resposta antiga é ignorada.
- Troca direta para outro usuário remove a tentativa pendente pertencente à identidade anterior; a nova identidade recarrega perfil, onboarding e catálogo server-authoritative antes de continuar.
- O Pix automático continua bloqueado até existir provedor real com confirmação autenticada; nenhum comprovante ou confirmação manual volta a autorizar pedido.
- `tests/order-idempotency-audit.mjs` foi ampliado para impedir regressões desse isolamento de autenticação.
- Nenhuma migration, RLS, grant, secret ou Edge Function implantada foi alterada nesta rodada; não houve ampliação de privilégios nem alteração em objetos não-`padoka_`.
