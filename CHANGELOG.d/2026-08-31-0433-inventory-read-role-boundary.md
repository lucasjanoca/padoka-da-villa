## 2026-08-31 04:33 — Leitura direta de estoque passa a respeitar papéis

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado no projeto correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que `padoka_inventory` já estava com RLS ativa, `anon` sem `SELECT` e `authenticated` somente com `SELECT` direto; o projeto InfoTech.io não foi alterado.
- A policy ampla `padoka staff read inventory`, baseada em `padoka_is_staff()`, foi substituída por `padoka inventory roles read inventory`, usando `padoka_staff_has_role(...)`.
- Leitura direta de `padoka_inventory` agora fica limitada a `owner`, `manager`, `stock`, `cashier` e `attendant`. O papel `production` e demais perfis internos não recebem mais leitura dessa tabela apenas por serem staff ativos.
- `cashier` e `attendant` permanecem temporariamente na policy porque o bootstrap atual do `pdv.html` ainda lê `product_id,barcode` de `padoka_inventory`; removê-los antes de migrar esse bootstrap para `padoka_list_product_barcodes()` quebraria o Caixa.
- Nenhum privilégio de escrita foi ampliado e nenhuma policy/objeto não-`padoka_` foi alterado.
- Criado `tests/inventory-read-role-boundary-audit.mjs` para impedir regressão para `padoka_is_staff()` genérico ou ampliação de escrita.
