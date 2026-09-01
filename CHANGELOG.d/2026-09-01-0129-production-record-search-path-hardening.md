## 2026-09-01 01:29 — Registro transacional de produção endurece `search_path`
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `supabase/006_production_completion_transaction.sql`, `supabase/040_private_rpc_implementations.sql` e o estado atual das migrations antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) em estado `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- O Security Advisor foi consultado antes da DDL e não apresentou aviso relacionado à PADOKA; permaneceram apenas dois avisos `rass_*` e a proteção global contra senhas vazadas.
- Revisada `padoka_private.padoka_record_production(uuid,numeric,uuid)`: a implementação já valida os papéis `owner`/`manager`/`production`, mantém `request_id` idempotente e schema-qualifica tabelas PADOKA e `auth.uid()`, mas ainda usava `search_path=public`.
- Aplicada a migration `079_production_record_search_path_hardening.sql`, alterando somente o `search_path` da implementação privilegiada para `''`, sem mudar ACL, RLS, regras de estoque, quantidades produzidas ou papéis permitidos.
- Após a DDL foi confirmado que a função continua `SECURITY DEFINER`, `anon` continua sem `EXECUTE`, `authenticated` mantém o acesso necessário ao wrapper autorizado e `search_path=''` está ativo.
- Confirmado que `padoka_production_plans`, `padoka_production_batches`, `padoka_inventory` e `padoka_inventory_movements` continuam com RLS ativa e sem `INSERT`, `UPDATE` ou `DELETE` direto para `anon` e `authenticated`.
- Adicionado `tests/production-record-search-path-audit.mjs` para impedir regressão do `search_path`, do wrapper público `SECURITY INVOKER`, da autorização de produção e da idempotência por `request_id`.
- Security Advisor reexecutado depois da migration sem novo aviso PADOKA; objetos não-`padoka_`, `auth.users`, credenciais Google e Edge Functions permaneceram intocados.
