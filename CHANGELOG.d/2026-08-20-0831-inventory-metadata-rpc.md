## 2026-08-20 08:31 — Metadados de estoque passam para RPC segura

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `supabase/003_operational_inventory_production_losses.sql`, `assets/operational-sync.js` e a auditoria existente antes da mudança.
- Confirmado novamente pelo conector Supabase que a conexão disponível expõe somente **InfoTech.io** (`rgngqumqzylthdiazvfu`). Nenhuma query, migration, advisor ou alteração foi executada nesse projeto. O backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificado um caso de falha silenciosa para produtos cadastrados depois da futura aplicação da migration 003: a Gestão fazia `UPDATE` direto em `padoka_inventory` para código/EAN e estoque mínimo; se a linha de estoque ainda não existisse, o banco poderia atualizar zero linhas sem criar o registro necessário.
- A migration 003 ganhou a RPC `padoka_update_inventory_metadata`, restrita aos perfis `owner`, `manager` e `stock`, validando produto ativo, estoque mínimo não negativo e tamanho do código de barras.
- A RPC usa `INSERT ... ON CONFLICT (product_id) DO UPDATE`, portanto cria de forma segura a linha de estoque para produtos novos e atualiza somente os metadados permitidos.
- O `UPDATE` direto de `barcode`/`min_quantity` deixou de ser concedido a `authenticated`; a escrita desses campos passa a depender exclusivamente da RPC quando a migration 003 for aplicada.
- `assets/operational-sync.js` foi alterado para chamar `padoka_update_inventory_metadata` e sempre preservar o outro metadado ao editar apenas EAN ou estoque mínimo.
- Criado `tests/operational-inventory-audit.mjs` para verificar a existência e restrição da RPC, ausência de `UPDATE` direto e uso correto no frontend.
- O workflow `.github/workflows/padoka-audit.yml` agora valida e executa também a auditoria operacional.
- O conector GitHub não retornou um workflow run associado ao commit nesta sessão, então não foi registrado falso sucesso de CI. A alteração foi revisada estaticamente e não foi aplicada ao banco publicado.
- Nenhum trigger em `auth.users` foi criado; todos os objetos permanecem isolados por prefixo `padoka_`.
