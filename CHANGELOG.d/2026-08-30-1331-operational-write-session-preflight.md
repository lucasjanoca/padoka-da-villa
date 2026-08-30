# 2026-08-30 13:31 — Escritas operacionais reconfirmam a sessão antes da RPC

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual do repositório antes da alteração.
- Confirmado que o backend documentado da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado.
- Identificado em `assets/operational-sync.js` que três caminhos de escrita da Gestão — metadados de estoque, ajuste manual de saldo e planejamento de produção — reconfirmavam `lifecycleEpoch + user_id + sessão` apenas depois da RPC.
- `saveMeta()` agora chama `sessionStillMatches(userId, epoch)` antes de `padoka_update_inventory_metadata`.
- `adjustQty()` agora reconfirma a mesma identidade antes de persistir uma nova tentativa idempotente em `sessionStorage` e antes de `padoka_adjust_inventory_once`; a validação posterior e o mesmo `request_id` em respostas ambíguas foram preservados.
- `savePlan()` agora reconfirma a sessão antes de bloquear o campo e antes de `padoka_upsert_production_plan`, mantendo a validação posterior existente.
- `tests/operational-inventory-audit.mjs` passou a exigir explicitamente esses preflights antes das operações sensíveis.
- Nenhum HTML/CSS, migration, RLS, grant, RPC, secret ou Edge Function foi alterado. Não houve ampliação de privilégios nem mudança em objetos não-`padoka_`.
