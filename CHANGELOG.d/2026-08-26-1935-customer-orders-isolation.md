# 2026-08-26 19:35 — Seus pedidos reduz assinatura e reforça isolamento

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- `acompanhamento.html` continua carregando pedidos do cliente autenticado, mais recentes primeiro, sem campo de pesquisa e com o progresso Recebido → Visto → Confirmado → Preparo → Pronto → Retirado.
- A consulta a `padoka_orders` agora adiciona filtro explícito `customer_id = session.user.id` além da RLS, reduzindo dependência de uma única camada de isolamento.
- A assinatura Realtime de `padoka_orders` passou a usar filtro `customer_id=eq.<uid>` do cliente autenticado.
- Removida a assinatura Realtime direta de `padoka_order_events`: alterações de status já atualizam a linha do pedido e acionam o refresh, evitando uma assinatura mais ampla sem perder atualização do acompanhamento.
- Itens e eventos continuam sendo consultados somente pelos IDs dos pedidos já filtrados do próprio cliente.
- Adicionado `tests/customer-orders-audit.mjs` e integrado ao workflow `PADOKA Static Audit` para impedir regressão do filtro explícito, do filtro Realtime e da ausência de assinatura global de eventos.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado nesta execução; portanto não houve alteração de banco a submeter aos advisors.
- O projeto InfoTech.io não foi acessado nem alterado; nenhum objeto não-`padoka_` foi modificado.
