# Relatórios — isolamento do backend PADOKA

- `assets/reporting-sync.js` agora valida explicitamente a origem da instância Supabase antes de registrar listeners de Auth, consultar sessão, chamar a RPC financeira ou assinar Realtime.
- A origem aceita permanece exclusivamente `https://yncspxfsvlqdnodlsosb.supabase.co` (projeto **Sites De Clientes!**). Uma instância apontando para outro projeto falha fechada e não inicializa o módulo financeiro.
- Permanecem inalterados os limites existentes: relatórios apenas para `owner`/`manager`, uso server-authoritative de `padoka_report_summary`, lifecycle por identidade, revalidação de sessão antes/depois da RPC e Realtime somente em tabelas `padoka_*`.
- Adicionada a auditoria `tests/reporting-backend-isolation-audit.mjs` para proteger o pinning do backend, a ordem do guard antes de Auth, a restrição de papel e a ausência de credenciais administrativas no frontend.
- Nenhuma migration, policy, RLS, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
