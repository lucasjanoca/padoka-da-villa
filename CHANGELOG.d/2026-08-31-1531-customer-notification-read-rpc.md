## 2026-08-31 15:31 — Leitura de notificações passa por RPC autoritativa

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) em estado `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Identificado que a central de notificações ainda marcava `read_at` por `UPDATE` direto, embora limitado à coluna e ao próprio `user_id` por RLS.
- Criada e aplicada a migration `073_customer_notification_read_rpc.sql`: a escrita de leitura agora passa por `padoka_mark_customer_notifications_read(uuid)`, wrapper público `SECURITY INVOKER`, com implementação `SECURITY DEFINER` em `padoka_rpc_private`, `search_path=''`, `auth.uid()` obrigatório e atualização restrita às notificações não lidas do próprio cliente.
- Removidos o grant direto `UPDATE(read_at)` e a policy `padoka_customer_notifications_own_update`; a tabela continua com RLS ativa e somente a policy de leitura do próprio cliente.
- `assets/customer-notifications.js` deixou de executar `.update()` direto e usa a nova RPC tanto para uma notificação quanto para “Marcar lidas”, preservando revalidação de sessão, lifecycle por identidade e Realtime.
- `tests/customer-notifications-audit.mjs` foi atualizado para impedir regressão para escrita direta e exigir o boundary RPC privado/público seguro.
- Verificação pós-migration: `rls_enabled=true`, `anon_select=false`, `anon_update=false`, `authenticated_select=true`, `authenticated_update=false`, `authenticated UPDATE(read_at)=false`, uma policy `SELECT` e nenhuma policy `UPDATE`.
- A ACL das funções foi conferida: `anon` não executa nenhuma das duas; `authenticated` executa o wrapper e a implementação privada necessária ao wrapper; a função privada é `SECURITY DEFINER` com `search_path` vazio e o endpoint público é `SECURITY INVOKER`.
- Security Advisor reexecutado após a alteração: nenhum novo alerta PADOKA. Permanecem apenas avisos já existentes de funções `rass_*` e da proteção global contra senhas vazadas, que não foram alterados.
- Nenhum trigger em `auth.users`, objeto não-`padoka_`, credencial Google, secret ou Edge Function foi alterado.
