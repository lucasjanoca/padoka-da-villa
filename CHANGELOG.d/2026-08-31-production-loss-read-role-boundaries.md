# 2026-08-31 — leituras operacionais por papel

- Restrita a leitura direta de `padoka_production_plans` aos papéis `owner`, `manager` e `production`.
- Restrita a leitura direta de `padoka_losses` aos papéis `owner`, `manager`, `stock` e `production`.
- Mantido `authenticated` com somente `SELECT` nessas duas tabelas; `anon` segue sem privilégios.
- Preservadas as mutações server-authoritative por RPC e o RLS ativo.
- `padoka_inventory` foi deliberadamente deixada fora desta mudança: o PDV ainda consulta códigos de barras diretamente durante o carregamento inicial para perfis `cashier/attendant`; apertar essa policy agora poderia quebrar o Caixa. O endurecimento do estoque fica condicionado à remoção segura dessa dependência em favor do RPC dedicado `padoka_list_product_barcodes`.
- Security Advisor consultado antes e depois da migration no projeto correto `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`); nenhum alerta novo relacionado à PADOKA foi introduzido.
- Adicionado `tests/operational-read-role-boundary-audit.mjs` para impedir regressão para `padoka_is_staff()` genérico nas leituras de produção/perdas e para garantir que a policy de estoque não seja alterada prematuramente.
