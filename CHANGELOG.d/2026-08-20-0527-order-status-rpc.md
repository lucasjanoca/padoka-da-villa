## 2026-08-20 05:27 — Transições de status preparadas para controle exclusivo no servidor

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pedidos.html` e a auditoria estática antes da alteração.
- Criada `supabase/005_order_status_transition_rpc.sql`, destinada exclusivamente ao backend PADOKA **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- A nova RPC `padoka_update_order_status` exige sessão autenticada e staff ativo via `padoka_is_staff()`.
- A RPC bloqueia saltos e retrocessos: `received → seen → confirmed → preparing → ready → completed`, permitindo `cancelled` somente enquanto o pedido ainda está ativo.
- Pedidos `completed` ou `cancelled` não podem ser reabertos pela RPC.
- A alteração usa `FOR UPDATE` na linha do pedido para reduzir conflito entre duas atualizações simultâneas.
- Depois que a migration 005 for aplicada, `UPDATE` direto em `padoka_orders` é revogado de `authenticated`; a RPC passa a ser o caminho autorizado para mudança de status.
- `pedidos.html` agora tenta `padoka_update_order_status` primeiro. Enquanto a migration 005 ainda não existir no backend publicado, mantém fallback temporário para o `UPDATE` direto somente quando o erro indica função ausente/schema cache.
- Erros de transição inválida ou pedido já finalizado fazem a fila recarregar, evitando que a interface mantenha um estado desatualizado.
- `tests/static-audit.mjs` ganhou verificações para exigir a RPC, a validação de staff, as transições principais e a revogação do `UPDATE` direto após ativação.
- O clone local para executar a auditoria completa continuou indisponível por falha de DNS do ambiente; os arquivos alterados foram relidos diretamente do GitHub e as invariantes novas foram verificadas no conteúdo publicado.
- O conector Supabase desta execução continua expondo somente **InfoTech.io**. Nenhuma query, migration, advisor ou alteração foi executada nele.
- A migration 005 permanece apenas preparada no repositório; nenhum banco/RLS foi alterado nesta execução e, portanto, não havia advisor da PADOKA a executar.
