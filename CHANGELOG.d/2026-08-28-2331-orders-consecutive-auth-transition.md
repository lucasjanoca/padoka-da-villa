# 2026-08-28 23:31 — Fila interna aceita trocas consecutivas de identidade

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificado no guard de `pedidos.html` que o estado `transitioning` ignorava qualquer segundo evento de autenticação enquanto a primeira troca de funcionário ainda removia canais/revalidava a sessão.
- Embora a interface permanecesse fail-closed e oculta, uma sequência rápida A→B→C ou troca seguida de logout podia deixar a página presa sem processar a identidade mais recente.
- `assets/orders-auth-lifecycle.js` deixou de descartar eventos Auth por existir uma transição anterior: toda troca real de `user_id` incrementa `lifecycleEpoch`, mantém a interface bloqueada, encerra canais e invalida revalidações antigas.
- Logout redireciona para `internal.html` somente se ainda corresponder ao epoch mais recente; uma troca posterior não pode ser sobrescrita por callback atrasado.
- `tests/staff-navigation-audit.mjs` agora proíbe a regressão para o gate `transitioning` e exige invalidação por epoch em trocas consecutivas.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve necessidade de consultar advisors de banco nesta rodada.
- Nenhum objeto não-`padoka_` foi alterado e o projeto InfoTech.io permaneceu intocado.
