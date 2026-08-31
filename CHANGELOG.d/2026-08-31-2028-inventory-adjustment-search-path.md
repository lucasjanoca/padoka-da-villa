## 2026-08-31 20:28 — Ajuste idempotente de estoque endurecido

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) como `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Revisada a implementação `padoka_private.padoka_adjust_inventory_once(text,numeric,text,uuid)`: ela já validava `auth.uid()`, restringia papéis a `owner/manager/stock`, exigia `request_id` idempotente e usava referências qualificadas para tabelas e helpers PADOKA.
- Antes da DDL, confirmado que `padoka_inventory`, `padoka_inventory_movements` e `padoka_products` estão com RLS ativa e sem `INSERT/UPDATE/DELETE` direto para `anon` ou `authenticated`.
- Aplicada a migration `077_inventory_adjustment_search_path_hardening.sql`, alterando apenas o `search_path` da implementação privilegiada para `''`, sem ampliar ACL, grants ou policies.
- `assets/operational-sync.js` continua usando exclusivamente `padoka_adjust_inventory_once` para ajustes de saldo, preservando retry seguro pelo mesmo `request_id` e sem fallback para `padoka_adjust_inventory`.
- Adicionado `tests/inventory-adjustment-search-path-audit.mjs` para impedir regressão do `search_path` e do caminho server-authoritative idempotente.
- Security Advisors consultados antes da mudança; nenhum aviso PADOKA estava presente. Objetos não-`padoka_`, `auth.users`, credenciais Google e Edge Functions permaneceram intocados.
