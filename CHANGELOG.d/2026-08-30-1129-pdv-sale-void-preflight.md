# 2026-08-30 11:29 — Histórico e estorno do PDV com preflight de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- `assets/pdv-sale-void.js` agora reconfirma `lifecycleEpoch + user_id + sessão real` antes de consultar `padoka_sale_items`, carregar `padoka_sales`, reconciliar um estorno e imediatamente antes de chamar `padoka_void_sale`.
- A ativação do histórico também confirma a sessão antes da leitura de capability em `padoka_sales`, mantendo o módulo fail-closed em logout, troca de funcionário, erro retornado pelo Auth ou falha de transporte.
- As verificações posteriores às consultas/RPC foram preservadas como defesa em profundidade; respostas atrasadas da identidade anterior continuam descartadas.
- `tests/pdv-sale-void-audit.mjs` passou a exigir explicitamente a ordem desses preflights para impedir regressão.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; o projeto InfoTech.io permaneceu intocado.
