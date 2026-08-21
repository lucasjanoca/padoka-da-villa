# 2026-08-21 05:25 — Checkout rejeita horário de retirada já passado

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `DEPLOYMENT.md`, `supabase/011_checkout_order_idempotency.sql` e `tests/order-idempotency-audit.mjs` antes da alteração.
- Identificado um caso de integridade restante na migration 011: a RPC já rejeitava datas anteriores, mas ainda poderia aceitar uma retirada para o dia atual com horário que já passou.
- `padoka_create_order_once` agora compara a combinação `p_pickup_date + p_pickup_time` com o relógio de `America/Sao_Paulo` e rejeita horários já passados no mesmo dia.
- A mudança não inventa horário comercial, janela máxima de agendamento nem regra definitiva da Padoca Noturna; apenas impede uma retirada temporalmente impossível.
- `tests/order-idempotency-audit.mjs` ganhou verificações específicas para a comparação de data+hora e para a mensagem `pickup time is in the past`.
- A tentativa de executar a auditoria por clone local foi bloqueada porque este ambiente não conseguiu resolver `github.com`; os arquivos alterados foram relidos diretamente pelo conector GitHub após os commits.
- Nenhuma migration foi aplicada em Supabase nesta execução. Portanto não houve alteração de banco/RLS e nenhum advisor foi executado. O projeto **InfoTech.io permanece intocado**; a migration 011 continua preparada somente para `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`).
