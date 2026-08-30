# 2026-08-30 12:29 — Perdas exigem sessão confirmada antes de operações sensíveis

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser alterado.
- `assets/loss-registration.js` agora reconfirma `lifecycleEpoch + user_id + sessão real` imediatamente antes de persistir uma nova tentativa e antes de chamar `padoka_register_loss_once`.
- A revalidação posterior à RPC foi preservada; logout, troca de funcionário, erro do Supabase Auth ou falha de transporte mantêm o fluxo fail-closed.
- A detecção de capability em `padoka_losses` também passou a exigir uma sessão confirmada imediatamente antes da leitura, além da validação posterior já existente.
- O retry idempotente continua isolado por funcionário em `sessionStorage` e reutiliza exatamente o mesmo `request_id` quando a resposta é ambígua.
- `tests/loss-transaction-audit.mjs` passou a verificar pela ordem do código que os preflights ocorrem antes da RPC e antes do probe de capability.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de privilégios e nenhum objeto não-`padoka_` foi tocado.
