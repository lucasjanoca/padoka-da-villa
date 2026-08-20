# 2026-08-20 12:26 — Produção atualiza controles após mudanças em tempo real

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado pelo conector Supabase que a conexão disponível continua expondo somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nele. O backend correto da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificado um bug no frontend de Produção: depois de registrar uma fornada ou receber uma atualização Realtime, `loadPlans()` recarregava os dados, mas as células já existentes eram ignoradas por `enhance()`, podendo manter quantidade restante/status visual desatualizados.
- `assets/production-completion.js` agora calcula uma assinatura por plano (`id`, planejado, produzido e status) e re-renderiza somente a célula cujo estado realmente mudou.
- A correção evita loop do `MutationObserver`, preserva o retry idempotente já existente e atualiza corretamente os estados `Concluído`/`Cancelado` e a quantidade restante após eventos Realtime.
- `tests/production-frontend-audit.mjs` ganhou verificações específicas para impedir regressão desse refresh e confirmar que `refresh()` recarrega os planos antes de redesenhar.
- `node --check` foi executado sobre a lógica JavaScript alterada sem erro de sintaxe. O conector GitHub ainda não retornou status de CI para o commit mais recente, portanto a execução remota não foi marcada como aprovada sem evidência.
- Nenhuma migration/RLS foi modificada nesta execução; não havia advisor da PADOKA a consultar.
