# PADOKA Club — isolamento da identidade do cliente

- Fortalece `tests/club-runtime-config-audit.mjs` para exigir que leituras de saldo, resgates e extrato permaneçam vinculadas ao `user_id` autenticado.
- Protege a revalidação de sessão/identidade antes de aplicar dados carregados e a limpeza imediata do estado anterior durante troca de conta.
- Bloqueia regressões que tentem mutar diretamente saldo, extrato ou resgates do navegador; resgate e cancelamento continuam server-authoritative pelas RPCs PADOKA existentes.
- Nenhum runtime, migration, RLS, policy, grant, trigger, Edge Function, configuração OAuth ou objeto não-`padoka_` foi alterado nesta rodada.
