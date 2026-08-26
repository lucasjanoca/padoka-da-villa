# 2026-08-26 — PDV passa a confiar somente nos códigos de barras do servidor

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no InfoTech.io.
- Revisado o estado real do backend: `padoka_link_product_barcode` e `padoka_update_inventory_metadata` continuam disponíveis para usuários autenticados, com autorização interna validada pelas próprias RPCs; `authenticated` não possui `UPDATE` direto em `padoka_inventory`.
- Confirmado que os 16 códigos atualmente cadastrados em `padoka_inventory` continuam sendo os códigos demonstrativos da PADOKA.
- Corrigido `assets/pdv-scanner-fix.js`: após consultar `padoka_list_product_barcodes`, o PDV não reaproveita mais eventual `product.barcode` já presente no objeto do navegador quando o servidor não retorna um código para aquele produto.
- Com isso, a fonte de verdade do leitor físico fica exclusivamente no catálogo de códigos retornado pelo backend; produto sem barcode no servidor permanece sem barcode no PDV.
- Mantidos Enter, Tab, leitura em rajada, autoenvio sem sufixo, bloqueio durante venda pendente/câmera, limite de 64 caracteres e indicação de códigos demonstrativos.
- Atualizado o cache-buster do leitor para evitar que o GitHub Pages reutilize a versão anterior do JavaScript.
- `tests/pdv-hardware-scanner-audit.mjs` ganhou uma verificação explícita contra regressão para fallback local de barcode.
- Nenhuma migration, RLS, grant ou dado real da padaria foi alterado nesta execução.
