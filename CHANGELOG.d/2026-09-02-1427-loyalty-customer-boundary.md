# 2026-09-02 14:27 — PADOKA Club: isolamento de clientes no Supabase compartilhado

## Segurança
- Adicionada `supabase/085_padoka_loyalty_customer_boundary.sql` no backend correto da PADOKA (`yncspxfsvlqdnodlsosb`).
- Clientes do PADOKA Club agora precisam existir em `padoka_profiles`, preservando a regra de que o perfil só nasce após entrada na PADOKA e conclusão do onboarding.
- As policies de leitura de conta, extrato, configurações, recompensas, campanhas e resgates passaram a exigir vínculo com `padoka_profiles` para clientes; os acessos internos continuam separados por `padoka_staff_users`/papéis já existentes.
- `padoka_rpc_private.redeem_reward` e `padoka_rpc_private.cancel_redemption` passaram a usar um helper privado `SECURITY DEFINER`, com `search_path=''`, `auth.uid()` obrigatório, vínculo em `padoka_profiles` e sem `EXECUTE` direto para `anon`/`authenticated`.
- `padoka_rpc_private.admin_loyalty_customers` agora parte de `padoka_profiles` e apenas então associa `auth.users`, evitando listar usuários de outros clientes do projeto Supabase compartilhado.
- `padoka_rpc_private.admin_adjust_loyalty` agora rejeita alvos sem `padoka_profiles`, impedindo criar saldo/notificação do Club para usuários externos à PADOKA.

## Validação
- A mudança SQL foi testada primeiro dentro de transação com `ROLLBACK`, antes da aplicação definitiva.
- Após a aplicação, foram conferidos o corpo das RPCs, ACL do helper e as seis policies RLS; todas mantiveram fail-closed para usuários fora da PADOKA.
- Security Advisors foram consultados novamente após a mudança. Não apareceu novo aviso relacionado a objetos `padoka_*`; avisos de objetos de outros clientes e configuração global do projeto compartilhado foram deixados intactos.
- Adicionado `tests/loyalty-customer-boundary-audit.mjs` para proteger essa fronteira contra regressão.

Nenhuma credencial Google, `service_role`, objeto da InfoTech.io, trigger global em `auth.users` ou objeto não-`padoka_` foi alterado.