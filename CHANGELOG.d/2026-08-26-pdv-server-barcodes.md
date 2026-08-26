## 2026-08-26 — PDV deixa de manter códigos de barras fixos no frontend

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/pdv-scanner-fix.js`, `assets/pdv-idempotency.js` e a auditoria do leitor físico antes da alteração.
- Confirmado no projeto Supabase correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que `padoka_inventory` possui 16 registros e que os 16 códigos atualmente cadastrados seguem o padrão demonstrativo usado na fase de testes.
- Removida de `assets/pdv-scanner-fix.js` a tabela fixa `TEST_BARCODES`; o leitor não inventa nem mantém mais uma segunda fonte local de códigos.
- A atualização de códigos passa a confiar na RPC `padoka_list_product_barcodes` e nos dados já obtidos do backend PADOKA; se a atualização do servidor falhar, o frontend não cria um fallback demonstrativo silencioso.
- O status do leitor agora informa explicitamente quando os códigos cadastrados no servidor ainda são demonstrativos, evitando que testes de hardware sejam confundidos com cadastro oficial de produtos.
- Mantidos Enter, Tab, leitura por rajada, autoenvio de leitores sem sufixo, limite de 64 caracteres, bloqueio durante câmera/venda pendente e mensagens de código não cadastrado.
- Atualizado o cache-buster do leitor para `2026082603` e ampliada `tests/pdv-hardware-scanner-audit.mjs` para impedir regressão para códigos fixos no frontend.
- A execução **PADOKA Static Audit #237** concluiu com sucesso, incluindo auditoria estática, cadeia de migrations, onboarding, checkout, staff, estoque, produção, perdas, relatórios, PDV idempotente, leitor físico, retirada e estorno.
- Nenhuma migration, RLS, grant ou dado do banco foi alterado nesta execução. O projeto InfoTech.io não foi acessado nem modificado.
