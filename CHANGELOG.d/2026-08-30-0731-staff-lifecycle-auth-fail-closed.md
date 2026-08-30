## 2026-08-30 07:31 — Lifecycle da Equipe falha fechado em erro do Auth
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/staff-management-lifecycle.js`, `assets/staff-management.js` e `tests/staff-management-frontend-audit.mjs` antes da alteração.
- Mantido o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificado que `assets/staff-management-lifecycle.js` ainda desestruturava `getSession()` ignorando o campo `error` retornado pelo Supabase Auth.
- O guard agora usa `safeSession(client)`, tratando tanto `error` do Auth quanto rejeições de transporte; se a sessão não puder ser confirmada, remove a UI da Equipe e mantém os guards `padoka-staff-pending`/`padoka-role-pending` ativos.
- O listener de `onAuthStateChange` continua invalidando a UI e os canais da identidade anterior antes de redirecionar/recarregar a Gestão.
- `tests/staff-management-frontend-audit.mjs` passou a exigir a leitura segura da sessão e o comportamento fail-closed do lifecycle, evitando regressão para leitura ambígua de Auth.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de privilégios nem mudança de banco que exigisse consulta aos Security Advisors.
