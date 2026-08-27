# 2026-08-27 20:26 — Produção passa a revalidar a sessão em troca de conta

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/production-completion.js`, `assets/reporting-sync.js`, `assets/internal-nav.js`, `tests/production-frontend-audit.mjs` e `tests/operational-fail-closed-audit.mjs` antes da alteração.
- O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io, no banco, em RLS, grants ou objetos não-`padoka_`.
- Identificado que `production-completion.js` validava o acesso somente na carga inicial e mantinha observer, canal Realtime e respostas assíncronas ativos se a identidade Supabase mudasse na mesma aba.
- O módulo agora observa `onAuthStateChange`, limpa imediatamente controles adicionais de registro de produção, desconecta `MutationObserver` e canal Realtime, invalida respostas assíncronas da sessão anterior e só reativa após o guard interno confirmar a identidade atual e um papel permitido (`owner`, `manager` ou `production`).
- `padoka_record_production` continua sendo a única escrita do registro de produção e mantém `request_id` idempotente; nenhuma escrita direta em estoque foi adicionada.
- A tentativa idempotente em `sessionStorage` continua existindo apenas para reconciliar resposta de rede ambígua, sem virar armazenamento de produção/estoque local.
- `tests/production-frontend-audit.mjs` foi ampliado para impedir regressões no lifecycle de Auth, limpeza de Realtime/observer, invalidação por epoch, confirmação de identidade e papéis permitidos.
- Nenhum HTML/CSS foi alterado; o visual e a experiência mobile-first foram preservados.
