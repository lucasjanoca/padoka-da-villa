# 2026-08-29 10:31 — Perdas ficam fail-closed em falhas de sessão/capability

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento por prefixo `padoka_`.
- Identificado em `assets/loss-registration.js` que a RPC idempotente `padoka_register_loss_once` já capturava rejeições de transporte, mas releituras de `auth.getSession()` e o probe de `padoka_losses` ainda podiam rejeitar fora de tratamento.
- Criado helper de sessão fail-closed: falha de rede ao confirmar a sessão bloqueia o registro de perdas e não permite que uma identidade antiga continue aplicando respostas na interface.
- O probe de capability de `padoka_losses` agora captura rejeições de transporte e mantém o formulário bloqueado até que o acesso possa ser confirmado novamente.
- `submit`, `waitForStaffGuard`, ativação por identidade e inicialização passaram a usar a mesma confirmação segura de sessão vinculada a `lifecycleEpoch` e `user_id`.
- O retry idempotente continua preservado por funcionário em `sessionStorage`; nenhuma falha de rede apaga o `request_id` ambíguo nem mistura tentativas entre contas.
- `tests/loss-transaction-audit.mjs` foi ampliado para exigir captura explícita de falhas de sessão/capability e inicialização fail-closed.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de acesso nem alteração em objetos não-`padoka_`.
- O projeto InfoTech.io não foi alterado.
