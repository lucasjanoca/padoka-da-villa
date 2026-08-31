# 2026-08-31 06:30 — Leitura direta de estoque limitada à equipe de estoque

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/pdv-scanner-fix.js`, `supabase/063_inventory_read_role_boundary.sql` e a auditoria de leitura de estoque antes da alteração.
- Confirmado o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- Antes do DDL, `padoka_inventory` estava com RLS ativa, `anon` sem `SELECT`, `authenticated` sem privilégios de escrita e policy direta ainda permitindo `owner`, `manager`, `stock`, `cashier` e `attendant`.
- Confirmado que o bootstrap legado do PDV ignora de forma segura a negação de leitura direta de `padoka_inventory`, enquanto `assets/pdv-scanner-fix.js` carrega os códigos pela RPC server-authoritative `padoka_list_product_barcodes` após a autorização interna.
- Aplicada a migration `064_inventory_read_stock_roles_only.sql`: a leitura direta de `padoka_inventory` agora exige `padoka_staff_has_role(array['owner','manager','stock'])`; `cashier` e `attendant` continuam acessando somente o catálogo de códigos necessário ao Caixa pela RPC dedicada.
- Após a migration, RLS permaneceu ativa, `anon` permaneceu sem leitura e `authenticated` continuou sem `INSERT`, `UPDATE` ou `DELETE` na tabela.
- `tests/inventory-read-role-boundary-audit.mjs` agora exige a policy stock-only, impede regressão para `cashier`/`attendant`/`production` e confirma que o scanner continua usando `padoka_list_product_barcodes`.
- Security Advisor consultado após o DDL: nenhum novo alerta relacionado à PADOKA. Avisos de objetos `rass_*` e da configuração global de proteção contra senhas vazadas foram preservados sem alteração.
- Nenhum trigger em `auth.users`, objeto não-`padoka_`, secret ou Edge Function foi alterado.
