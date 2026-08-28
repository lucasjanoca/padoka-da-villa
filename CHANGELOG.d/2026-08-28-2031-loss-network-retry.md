# 2026-08-28 20:31 — Retry de perdas resiste a rejeição real de transporte

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/loss-registration.js` e `tests/loss-transaction-audit.mjs` antes da alteração.
- Identificado que `padoka_register_loss_once` já preservava `request_id` para respostas de rede ambíguas retornadas como erro, mas uma rejeição real do `fetch` podia escapar do `await sb.rpc(...)` e deixar o formulário travado em `Registrando…`.
- `assets/loss-registration.js` agora captura exceções de transporte da RPC, mantém a tentativa pendente vinculada ao mesmo funcionário e reutiliza exatamente o mesmo `request_id` no retry.
- Em falha de transporte, os campos permanecem bloqueados contra edição acidental e o botão volta para `Tentar novamente`, evitando uma segunda operação com dados/request diferente.
- `tests/loss-transaction-audit.mjs` passou a exigir `try/catch` ao redor da RPC idempotente e a preservação da tentativa em rejeições de transporte.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; portanto não houve mudança de banco que exigisse consulta aos Security Advisors.
- O backend permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), todos os objetos continuam no escopo `padoka_*` e o projeto InfoTech.io não foi alterado.
