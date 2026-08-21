# 2026-08-20 21:30 — Histórico e estorno seguro no PDV

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), o isolamento `padoka_*` e a regra de nunca alterar **InfoTech.io**.
- Revisado o estado deixado pela migration `supabase/012_pdv_sale_void_transaction.sql`: a RPC `padoka_void_sale` já devolve estoque, registra movimentação e auditoria na mesma transação, mas ainda não existia interface no PDV para usá-la.
- Criado `assets/pdv-sale-void.js`, carregado somente no `pdv.html` pela navegação interna.
- O módulo só aparece para `owner` e `manager` e somente quando detecta a coluna `void_reason`, evitando expor um botão que falharia antes da migration 012 existir no backend correto.
- A tela mostra as 20 vendas mais recentes, forma de pagamento, total, status e indicação de teste quando `is_test = true`; itens são carregados sob demanda por `padoka_sale_items`.
- Venda concluída pode abrir um formulário de estorno com motivo obrigatório entre 3 e 160 caracteres. A operação usa exclusivamente `padoka_void_sale`; o frontend não atualiza `padoka_sales` nem `padoka_inventory` diretamente.
- Vendas estornadas exibem data e motivo registrados pelo servidor e não oferecem novo botão de estorno.
- O histórico recebe atualização por Supabase Realtime em mudanças de `padoka_sales`.
- `tests/pdv-sale-void-audit.mjs` foi ampliado para auditar também o frontend: restrição `owner/manager`, detecção condicional da migration, uso da RPC, ausência de `localStorage` e proibição de escrita direta em vendas/estoque.
- `node --check` passou para o novo `assets/pdv-sale-void.js`.
- O GitHub ainda não apresentou status remoto associado ao último commit no momento da revisão; por isso a CI remota não foi marcada como aprovada sem evidência.
- O conector Supabase continua expondo somente **InfoTech.io**. Nenhuma query, migration, advisor ou alteração de banco foi executada nele. Como nenhuma mudança de banco/RLS foi aplicada nesta execução, não havia advisor PADOKA a executar.
