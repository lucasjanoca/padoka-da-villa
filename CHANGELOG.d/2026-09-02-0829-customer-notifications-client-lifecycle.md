# 2026-09-02 08:29 — Notificações isolam rebind de cliente Supabase

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- O backend permanece exclusivamente no projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/customer-notifications.js` continua aceitando somente clientes Supabase cujo origin é `https://yncspxfsvlqdnodlsosb.supabase.co`.
- Ao receber uma nova instância Supabase válida, o módulo agora encerra explicitamente a subscription Auth e o canal Realtime pertencentes à instância anterior antes de associar a nova identidade.
- O rebind limpa imediatamente `activeUserId`, sessão, canal e subscription em memória, escondendo a central enquanto a nova sessão é confirmada.
- Respostas assíncronas e callbacks de Auth de uma instância supersedida são descartados com validação `client === nextClient`, evitando que um cliente anterior volte a alterar o estado da conta atual.
- Leituras continuam filtradas por `user_id`, o Realtime continua usando filtro por cliente autenticado e marcações de leitura permanecem server-authoritative via `padoka_mark_customer_notifications_read`.
- Criado `tests/customer-notifications-client-lifecycle-audit.mjs` para impedir regressões no origin da PADOKA, cleanup do lifecycle, escopo por usuário e ausência de credenciais privilegiadas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução.
