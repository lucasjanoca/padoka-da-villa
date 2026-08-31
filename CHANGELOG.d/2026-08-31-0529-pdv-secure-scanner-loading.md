# 2026-08-31 05:29 — Scanner seguro do PDV passa pelo loader autenticado

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/internal-nav.js` e `assets/pdv-scanner-fix.js` antes da alteração.
- Confirmado o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- Identificado que `assets/pdv-scanner-fix.js` já usa a RPC server-authoritative `padoka_list_product_barcodes`, revalida sessão/identidade e falha fechado, mas não estava sendo carregado pelo loader de módulos internos.
- `assets/internal-nav.js` agora carrega `assets/pdv-scanner-fix.js` somente no módulo PDV e somente depois da validação de sessão, `padoka_staff_users`, papel permitido e MFA para perfis privilegiados.
- `tests/internal-module-loading-audit.mjs` passou a exigir esse limite, prevenindo regressão para carregamento do scanner antes da autorização interna.
- A leitura direta legada de `padoka_inventory` no bootstrap de `pdv.html` ainda não foi removida nesta mudança; ela permanece explicitamente como próximo passo antes de retirar `cashier`/`attendant` da policy de leitura do estoque. Não foi apertada RLS de forma que pudesse quebrar o Caixa.
- Nenhuma migration, policy, grant, RPC, secret ou Edge Function foi alterada nesta etapa.
