# 2026-08-29 04:29 — Gestão de equipe fecha troca de identidade em fail-closed

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/staff-management.js` e `tests/staff-management-audit.mjs` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que esta rodada não exige nenhuma alteração de banco, RLS, grant, RPC, secret ou Edge Function.
- Identificado que a Gestão de Equipe mantinha estado e canal Realtime próprios, mas não possuía um lifecycle dedicado para limpar a interface quando a identidade Auth mudava durante uma sessão já aberta.
- Criado `assets/staff-management-lifecycle.js`: logout/troca de conta ocultam imediatamente a área interna, removem painel/atalhos de Equipe e encerram o canal `padoka-staff-management-ui` da identidade anterior.
- Logout retorna para `internal.html`; troca entre contas autenticadas força remontagem completa da Gestão, fazendo a nova identidade passar novamente pelo guard central de `padoka_staff_users` e pelo papel exigido antes de qualquer módulo interno ser exposto.
- `assets/internal-nav.js` passou a carregar o guard de lifecycle antes de `assets/staff-management.js`.
- `tests/staff-management-audit.mjs` agora exige o fail-closed, limpeza dos dados anteriores, encerramento do Realtime e remontagem sob nova validação.
- Não foi possível clonar o repositório no ambiente local desta execução por falha de resolução DNS para `github.com`; por isso a validação final fica a cargo do workflow `PADOKA Static Audit` disparado pelos commits no GitHub.
- Nenhum objeto não-`padoka_` foi alterado e o projeto InfoTech.io permaneceu intocado.
