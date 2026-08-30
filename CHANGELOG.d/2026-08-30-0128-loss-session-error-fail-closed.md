# 2026-08-30 01:28 — Perdas falham fechadas em erro retornado pelo Auth

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, confirmando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Identificado que `assets/loss-registration.js` já capturava rejeições reais de rede em `auth.getSession()`, mas ignorava o campo `error` retornado pelo próprio Supabase Auth.
- `getSessionSafe()` agora trata `result.error` como falha de confirmação de identidade e mantém o registro de perdas em modo fail-closed, sem liberar capability quando a sessão não pode ser validada.
- O retry idempotente de `padoka_register_loss_once` continua preservado por `request_id` e por `user_id` em `sessionStorage`; nenhuma escrita direta em estoque foi adicionada.
- `tests/loss-transaction-audit.mjs` agora exige que o helper rejeite explicitamente erros retornados pelo Supabase Auth, além de manter as verificações de lifecycle, isolamento de retry, RPC idempotente e neutralização do caminho legado.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve motivo para ampliar privilégios nem para alterar objetos não-PADOKA.
- O projeto InfoTech.io não foi alterado.
