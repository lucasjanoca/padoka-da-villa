# 2026-08-21 04:27 — Checkout idempotente endurecido antes da aplicação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento por prefixo `padoka_`.
- Revisada a migration `supabase/011_checkout_order_idempotency.sql`, que continua apenas preparada para o backend PADOKA e não foi aplicada em nenhum projeto nesta execução.
- A RPC `padoka_create_order_once` agora limita o nome de retirada a 80 caracteres, alinhado ao frontend, evitando payloads excessivos enviados diretamente à RPC.
- Datas de retirada anteriores ao dia atual são rejeitadas no servidor usando explicitamente o fuso `America/Sao_Paulo`; nenhuma regra comercial de horário, janela futura ou Padoca Noturna foi inventada.
- `product_id` recebido no JSON passou a exigir formato curto e previsível (`a-z`, `0-9` e hífen, até 64 caracteres) antes de consultar o catálogo.
- Linhas duplicadas do mesmo produto não conseguem mais contornar o limite de quantidade: depois do agrupamento, soma acima de 50 unidades por produto é recusada.
- Preservadas autenticação real, onboarding PADOKA, preço autoritativo no servidor, idempotência por `request_id`, reconciliação de retries e bloqueio de execução para `anon/public`.
- Nenhum trigger global em `auth.users` foi criado e nenhum objeto fora do namespace `padoka_` foi introduzido.
- `tests/order-idempotency-audit.mjs` foi ampliado para exigir as novas validações e impedir regressão futura.
- Nenhuma credencial Google foi alterada; o tratamento amigável do provider desativado e `prompt=select_account` permanecem intactos.
- Como a migration não foi aplicada ao banco nesta execução, não havia advisor de segurança da PADOKA a executar nesta rodada.
