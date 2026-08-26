# 2026-08-26 — Dashboard interno reduz consultas por papel

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes de continuar o projeto.
- Mantido o backend oficial da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma referência do runtime foi alterada e o projeto InfoTech.io não foi tocado.
- Identificado que `assets/admin-dashboard-live.js` carregava alertas de estoque e produção para qualquer funcionário ativo que abrisse `internal.html`, mesmo quando o papel daquele funcionário não tinha o módulo correspondente no menu interno.
- O dashboard agora aguarda `window.padokaStaffRole` validado pela navegação interna antes de iniciar consultas operacionais.
- Consultas e Realtime de estoque passam a iniciar somente para `owner`, `manager` e `stock`; consultas e Realtime de produção somente para `owner`, `manager` e `production`.
- `cashier` e `attendant` continuam podendo usar a visão geral/pedidos conforme o acesso já existente, mas não fazem consultas de estoque ou produção apenas por abrir o dashboard.
- Quando o funcionário possui acesso a apenas um dos módulos operacionais, o painel exibe somente o indicador e o atalho correspondente.
- Essa mudança é uma camada adicional de privilégio mínimo no frontend e não substitui RLS/autorização do servidor.
- `tests/admin-dashboard-audit.mjs` foi ampliado para impedir regressão das allowlists e para exigir que consultas e assinaturas Realtime fiquem atrás das checagens de papel.
- Não houve migration, DDL, alteração de RLS, grant, trigger, Edge Function ou dados do Supabase nesta execução; portanto não foi necessário alterar nem consultar advisors do banco.
