# Segurança operacional — lifecycle de sessão

- Fortalecida a auditoria `tests/operational-role-lifecycle-audit.mjs` para exigir revalidação da mesma sessão antes e depois de leituras operacionais antes de aplicar dados na interface.
- A reconciliação idempotente de estoque agora fica protegida por teste contra regressão que remova a confirmação de identidade antes/depois de `padoka_adjust_inventory_once`.
- Alterações de metadados e saldo de estoque ficam protegidas por teste contra respostas assíncronas de uma sessão anterior após troca de funcionário/logout.
- Nenhum runtime, migration, RLS, grant, trigger, Edge Function, credencial ou objeto não-`padoka_` foi alterado nesta rodada.
- Backend preservado: Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
