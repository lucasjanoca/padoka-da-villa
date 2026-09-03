# Checkout — superfície PWA restaurada

- Restaura em `pagamento.html` o `apple-touch-icon` de 192×192 já utilizado pelas demais páginas públicas, sem alterar autenticação, checkout ou Supabase.
- Mantém o cliente PWA atual do checkout (`assets/padoka-pwa.js?v=5`).
- Atualiza `tests/pwa-push-audit.mjs` para exigir um cache-buster numérico do cliente PWA em vez de fixar artificialmente a revisão `v=4`; assim revisões válidas como `v=5` continuam auditadas sem falso positivo.
- A auditoria continua exigindo manifest, Apple touch icon, Web Push protegido, segredo VAPID fora do schema público e demais controles existentes.

Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração OAuth ou objeto não-`padoka_` foi alterado.
