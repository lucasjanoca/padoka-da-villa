## 2026-09-01 00:30 — Resumo interno de relatórios com search_path endurecido
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `supabase/008_staff_reporting_rpc.sql`, `supabase/040_private_rpc_implementations.sql` e o estado atual do backend antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), ativo e saudável; o projeto InfoTech.io não foi alterado.
- Antes da DDL, o Security Advisor não apontava avisos relacionados à PADOKA; permaneceram apenas os avisos `rass_*` e a proteção global contra senhas vazadas.
- Revisada `padoka_private.padoka_report_summary(date,date)`: a implementação já restringia o relatório a `owner`/`manager`, usava objetos PADOKA qualificados e ficava atrás do wrapper público `SECURITY INVOKER`, porém ainda mantinha `search_path=public`.
- Aplicada a migration `081_report_summary_search_path_hardening.sql`, alterando somente o `search_path` da implementação privilegiada para `''`, sem ampliar grants, alterar RLS, modificar o formato do relatório ou tocar dados operacionais.
- Após a DDL foi confirmado que a função continua `SECURITY DEFINER`, `anon` permanece sem `EXECUTE` e `authenticated` conserva somente o acesso necessário ao wrapper autorizado.
- Criado `tests/report-summary-search-path-audit.mjs` para impedir regressão do `search_path`, do wrapper `SECURITY INVOKER`, dos papéis permitidos e da qualificação das tabelas consultadas.
- Nenhum objeto não-`padoka_`, trigger em `auth.users`, credencial Google, Edge Function ou módulo público do cliente foi alterado.
