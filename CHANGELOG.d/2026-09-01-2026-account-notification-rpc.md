# 2026-09-01 20:26 — Conta deixa de atualizar notificações diretamente

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que a central dedicada de notificações já usava `padoka_mark_customer_notifications_read`, mas o botão equivalente em `assets/account.js` ainda fazia `UPDATE` direto em `padoka_customer_notifications`.
- O botão **Marcar notificações como lidas** da conta agora usa exclusivamente a RPC server-authoritative `padoka_mark_customer_notifications_read` com `p_notification_id = null`, preservando o lifecycle do cliente e a recarga dos dados após sucesso.
- Criada `tests/account-notification-read-rpc-audit.mjs` para impedir regressão ao `UPDATE` direto, fixar o backend PADOKA, preservar o escaping HTML e proibir credenciais administrativas no frontend.
- Uma regressão de escaping percebida na revisão da própria edição foi corrigida imediatamente antes do fechamento da rodada; o teste também cobre esse caso.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada; nenhum privilégio de banco foi ampliado e nenhum objeto não-`padoka_` foi tocado.
