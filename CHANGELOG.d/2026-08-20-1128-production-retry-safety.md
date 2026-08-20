# 2026-08-20 11:28 — Retry de produção endurecido

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/production-completion.js`, a migration 006 e as auditorias específicas antes da alteração.
- Identificado um caso de borda na idempotência: um `request_id` já processado poderia ser reutilizado com plano ou quantidade diferentes e a RPC devolveria silenciosamente o lote antigo.
- `padoka_record_production` agora exige que uma repetição do mesmo `request_id` tenha exatamente o mesmo `plan_id` e a mesma quantidade; caso contrário retorna `production request id conflict`.
- A validação de conflito acontece tanto antes quanto depois do lock do plano, preservando a proteção contra concorrência já existente.
- No frontend, a primeira tentativa passa a guardar a quantidade junto do `request_id`. Se a resposta for ambígua/der erro, o botão permite somente repetir exatamente a mesma operação; o campo de quantidade permanece bloqueado para evitar que um retry idempotente se transforme acidentalmente em outra produção.
- Depois de confirmação de sucesso, `request_id` e quantidade guardada são descartados e a tela é atualizada normalmente.
- Mensagens técnicas não são expostas ao funcionário; conflito e falha ambígua recebem orientação curta e segura.
- `tests/production-transaction-audit.mjs` passou a exigir validação de conflito por plano/quantidade antes e depois do lock.
- `tests/production-frontend-audit.mjs` passou a exigir preservação da quantidade no retry, bloqueio de edição ambígua e tratamento do conflito.
- Nenhuma migration foi aplicada em banco nesta execução; a alteração da migration 006 permanece apenas preparada para o backend correto `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`).
- O projeto InfoTech.io não foi alterado. Como não houve mudança aplicada em banco/RLS, não havia advisor PADOKA a executar nesta rodada.
