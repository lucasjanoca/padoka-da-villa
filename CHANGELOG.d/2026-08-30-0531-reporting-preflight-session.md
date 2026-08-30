## 2026-08-30 05:31 — Relatórios confirmam sessão antes da RPC
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/reporting-sync.js` e `tests/reporting-frontend-audit.mjs` no HEAD anterior antes da alteração.
- Mantido o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- `assets/reporting-sync.js` agora reconfirma `user_id + lifecycleEpoch` imediatamente antes de chamar a RPC server-authoritative `padoka_report_summary`.
- Se a sessão não puder ser confirmada por erro do Auth, falha de transporte, logout ou troca de conta, o relatório entra em fail-closed: remove a UI/dados financeiros, encerra o canal Realtime e só tenta reativar depois de nova validação do mesmo usuário e papel permitido.
- A validação posterior à RPC foi preservada, impedindo que resposta atrasada de outra identidade seja renderizada.
- `tests/reporting-frontend-audit.mjs` agora exige que o preflight de sessão apareça antes da chamada à RPC e que a recuperação fail-closed limpe o estado anterior.
- Relatórios continuam restritos a `owner`/`manager`, usando somente `padoka_report_summary`; não foram adicionadas leituras financeiras diretas de `padoka_sales`/`padoka_sale_items` no navegador.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve ampliação de privilégios nem mudança de banco que exigisse Security Advisors.
