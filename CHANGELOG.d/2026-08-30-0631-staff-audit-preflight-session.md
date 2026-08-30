## 2026-08-30 06:31 — Histórico de equipe confirma sessão antes das RPCs
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/staff-audit.js` e `tests/staff-audit-trail-audit.mjs` no HEAD anterior antes da alteração.
- Mantido o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificado que `load()` e `probe()` ainda podiam chamar `padoka_list_staff_audit` antes da reconfirmação explícita de `user_id + lifecycleEpoch`, embora a RPC já seja restrita a owner no servidor.
- `assets/staff-audit.js` agora executa `confirmSession(epoch,userId)` antes de qualquer chamada a `padoka_list_staff_audit`, mantendo também a reconfirmação posterior para descartar respostas atrasadas após logout ou troca de conta.
- Se a sessão não puder ser confirmada por erro do Auth, falha de transporte, mudança de identidade ou guard global pendente, a área Equipe permanece fail-closed e a UI sensível é removida.
- `tests/staff-audit-trail-audit.mjs` agora exige por posição que o preflight apareça antes das RPCs tanto em `load()` quanto em `probe()`, evitando regressão silenciosa.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem mudança de banco que exigisse consulta aos Security Advisors.