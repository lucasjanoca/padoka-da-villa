# 2026-08-29 22:31 — Fila interna trata falhas de sessão como fail-closed

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; backend confirmado como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/orders-auth-lifecycle.js` agora centraliza `auth.getSession()` em `safeSession()`, tratando tanto erros retornados pelo Supabase Auth quanto rejeições reais de transporte.
- A validação inicial, a revalidação depois de consultar `padoka_staff_users` e a troca de funcionário usam a mesma leitura segura; sessão não confirmada mantém a fila escondida/bloqueada em vez de liberar estado antigo.
- O lifecycle continua vinculado a `activeUserId + lifecycleEpoch`; respostas da identidade anterior permanecem descartadas e canais Realtime são removidos durante troca/logout.
- `tests/staff-navigation-audit.mjs` foi ampliado para exigir `safeSession()`, tratamento de `error` e rejeições de transporte, além da revalidação de sessão antes de revelar a fila.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; não houve motivo para ampliar privilégios nem consultar advisors por mudança de banco.
