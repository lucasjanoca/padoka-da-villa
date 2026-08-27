# 2026-08-27 14:31 — Estorno do PDV reconcilia resposta de rede ambígua

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/pdv-sale-void.js`, `supabase/012_pdv_sale_void_transaction.sql` e `tests/pdv-sale-void-audit.mjs` antes da alteração.
- Confirmado no backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que o projeto está `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Confirmado que `padoka_void_sale(uuid,text)` já é transacional, restrito a `owner/manager`, trava a venda e o estoque, devolve o saldo uma única vez e retorna imediatamente quando a venda já está `voided`.
- O frontend do PDV agora trata falha de transporte como resultado incerto e consulta novamente `padoka_sales` pelo `sale_id` antes de mostrar erro.
- Se o servidor confirmar `status = 'voided'`, a interface assume o sucesso já efetivado e atualiza o histórico sem pedir novo estorno.
- Se não for possível confirmar o estado após uma falha de rede, a mensagem informa que o resultado é incerto, evitando afirmar falsamente que o estorno falhou.
- A reconciliação é somente leitura; nenhuma escrita direta em `padoka_sales` ou `padoka_inventory` foi adicionada e nenhum estado operacional foi persistido em `localStorage`/`sessionStorage`.
- `tests/pdv-sale-void-audit.mjs` passou a exigir a reconciliação server-authoritative e a proibir persistência local para esse fluxo.
- Nenhuma migration, RLS ou grant foi alterado nesta rodada. Os Security Advisors foram revisados; avisos PADOKA existentes de funções `SECURITY DEFINER` intencionais e tabelas privadas sem policy foram preservados sem ampliar acesso, e objetos de outros sistemas permaneceram intocados.
- O visual do PDV não foi alterado.
