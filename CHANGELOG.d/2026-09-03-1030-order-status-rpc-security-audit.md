## 2026-09-03 10:30 — Auditoria dedicada da fronteira de status de pedidos

- Relidos o estado atual do repositório, `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que a PADOKA permanece vinculada exclusivamente ao projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem alteração no InfoTech.io.
- Adicionada `tests/order-status-rpc-security-audit.mjs` para proteger no CI as garantias já existentes de `padoka_update_order_status`: `SECURITY DEFINER`, `search_path = public`, autenticação explícita por `auth.uid()`, autorização por staff PADOKA, transições sequenciais, bloqueio de reabertura e `FOR UPDATE`.
- A auditoria exige privilégios mínimos: `UPDATE` direto em `padoka_orders` revogado de `authenticated`, `EXECUTE` revogado de `PUBLIC`/`anon` e concedido somente a `authenticated`, mantendo a autorização efetiva dentro da RPC.
- O painel interno `pedidos.html` também fica protegido contra regressão para `UPDATE` direto/fallback legado e deve continuar validando `padoka_staff_users` ativo ligado ao usuário autenticado.
- A auditoria bloqueia segredos privilegiados (`service_role`/`sb_secret_`) no runtime interno de pedidos e impede que a migration 005 ganhe referência global a `auth.users`.
- Nenhuma migration foi aplicada, e nenhuma policy, RLS, grant, trigger, Edge Function, configuração OAuth ou objeto não-`padoka_` foi alterado nesta execução.
