# 2026-08-27 21:31 — Perdas revalidam sessão antes de reutilizar tentativa

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/loss-registration.js`, `assets/internal-nav.js` e `tests/loss-transaction-audit.mjs` antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) como `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- O registro de perdas agora acompanha `onAuthStateChange` e invalida imediatamente a capability quando a identidade autenticada muda.
- Tentativas idempotentes pendentes em `sessionStorage` são apagadas na troca/logout de funcionário, impedindo que um novo staff reutilize uma operação ambígua iniciada pela conta anterior.
- Antes de reativar o formulário, o módulo espera o guard global terminar a revalidação em `padoka_staff_users` e exige papel `owner`, `manager`, `stock` ou `production`, além de `padokaCanAccess('perdas')`.
- Respostas assíncronas antigas são descartadas por `lifecycleEpoch` e por nova confirmação de `session.user.id` antes de qualquer feedback de sucesso ou desbloqueio do formulário.
- A reativação após evento de Auth é agendada fora do callback de `onAuthStateChange`, evitando chamadas assíncronas do Supabase diretamente dentro do callback.
- `tests/loss-transaction-audit.mjs` passou a exigir lifecycle de Auth, limpeza da tentativa pendente, revalidação de papel e invalidação de respostas antigas.
- Nenhuma migration, RLS, grant, Edge Function, HTML ou CSS foi alterado nesta execução.
