## 2026-08-31 19:28 — Planejamento de produção endurecido contra search_path hijacking

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Revisada no banco a implementação `padoka_private.padoka_upsert_production_plan(date,text,numeric,text)`: ela já valida `auth.uid()`, exige papel `owner`/`manager`/`production` e usa referências qualificadas `public.padoka_*`, mas ainda mantinha `search_path=public`.
- Aplicada a migration `076_production_plan_search_path_hardening.sql`, alterando somente o `search_path` da função privilegiada para vazio, sem ampliar grants, RLS ou permissões e sem tocar em objetos não-`padoka_`.
- Confirmado após a DDL que a função continua `SECURITY DEFINER`, `anon` continua sem `EXECUTE` e o wrapper autenticado continua disponível sob a autorização interna existente.
- Adicionado `tests/production-plan-search-path-audit.mjs` para impedir regressão do `search_path` e garantir que a interface continue usando `padoka_upsert_production_plan`, sem mutação direta de `padoka_production_plans`.
- Nenhum HTML/CSS, credencial Google, trigger em `auth.users`, Edge Function ou objeto InfoTech.io foi alterado.
