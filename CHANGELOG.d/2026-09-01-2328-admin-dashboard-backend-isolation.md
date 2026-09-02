# 2026-09-01 23:28 — Dashboard interno fixa backend PADOKA

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e `assets/admin-dashboard-live.js` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Identificado que o dashboard interno já revalidava sessão, lifecycle e papéis, mas ainda aceitava `window.padokaSupabase` sem confirmar localmente a origem da instância.
- `assets/admin-dashboard-live.js` agora exige exatamente `https://yncspxfsvlqdnodlsosb.supabase.co` e centraliza a obtenção do cliente em uma função que falha fechada para qualquer outra origem.
- Leituras de Auth, pedidos, estoque e produção, além dos canais Realtime, só são executadas após o project pinning.
- As permissões existentes foram preservadas: estoque continua restrito a `owner`/`manager`/`stock`, produção a `owner`/`manager`/`production`, e todas as tabelas consultadas continuam sob prefixo `padoka_`.
- Criada `tests/admin-dashboard-backend-isolation-audit.mjs` para impedir regressão do project pinning e proibir credenciais administrativas ou dependência do backend InfoTech no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução.
