## 2026-08-31 — Catálogo de códigos do PDV restrito por papel
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Confirmado que o PDV é acessível apenas a `owner`, `manager`, `cashier` e `attendant`, enquanto a implementação de `padoka_list_product_barcodes()` ainda aceitava qualquer staff ativo via `padoka_is_staff()`.
- Aplicada a migration `062_pdv_barcode_role_boundary.sql`: a implementação privada agora exige sessão autenticada e `padoka_staff_has_role(array['owner','manager','cashier','attendant'])` antes de devolver códigos de barras.
- O wrapper público continua executável apenas por `authenticated`; `anon` permanece sem `EXECUTE`.
- A migration não altera tabelas, RLS, catálogo público, checkout, onboarding ou objetos de outros sistemas.
- `tests/pdv-barcode-role-boundary-audit.mjs` impede regressão para autorização genérica de staff.
- A leitura direta de `padoka_inventory` ainda existente no bootstrap legado do `pdv.html` foi identificada e permanece como próximo ponto a remover antes de restringir a policy de leitura do estoque para `cashier/attendant`.
