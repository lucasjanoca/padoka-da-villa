## 2026-08-31 23:26 — Registro idempotente de perdas com search_path endurecido
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `supabase/007_loss_idempotency.sql`, `supabase/040_private_rpc_implementations.sql` e o estado atual do backend antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Antes da DDL, o Security Advisor não apontava avisos relacionados à PADOKA; permaneceram apenas os avisos `rass_*` e a proteção global contra senhas vazadas.
- Revisada `padoka_private.padoka_register_loss_once(text,numeric,text,text,uuid)`: a função já validava papel interno, mantinha idempotência por `request_id`, bloqueava estoque insuficiente, usava lock `FOR UPDATE` e qualificava tabelas/helpers PADOKA, mas ainda mantinha `search_path=public`.
- Aplicada a migration `080_loss_search_path_hardening.sql`, alterando somente o `search_path` da implementação privilegiada para `''`, sem ampliar grants, alterar RLS ou mudar a lógica transacional de perda/estoque.
- Após a DDL foi confirmado que a função continua `SECURITY DEFINER`, `anon` permanece sem `EXECUTE` e `authenticated` conserva somente o acesso necessário ao wrapper autorizado.
- Criado `tests/loss-search-path-audit.mjs` para impedir regressão do `search_path`, do wrapper público `SECURITY INVOKER`, da autorização por papéis, da idempotência e do lock de estoque.
- Nenhum objeto não-`padoka_`, trigger em `auth.users`, credencial Google, Edge Function ou módulo público do cliente foi alterado.
