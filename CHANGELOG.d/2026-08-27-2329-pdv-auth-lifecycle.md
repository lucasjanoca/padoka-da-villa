# 2026-08-27 23:29 — Retry do PDV isolado por funcionário

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/pdv-idempotency.js` e `tests/pdv-idempotency-audit.mjs` antes da alteração.
- Mantido o backend alvo exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io, em migrations, RLS, grants ou objetos não-`padoka_`.
- Identificado que a tentativa ambígua do PDV persistida em `sessionStorage` ainda não estava vinculada ao funcionário que iniciou a venda; após logout/login na mesma aba, um novo operador poderia herdar um retry antigo.
- A tentativa pendente agora grava `user_id` e só é restaurada quando pertence exatamente à sessão autenticada atual.
- Logout ou troca de identidade apagam a tentativa pendente, limpam carrinho/estado de venda e deixam a finalização bloqueada enquanto o acesso interno é revalidado.
- A reativação espera `padoka-staff-pending` terminar e confirma novamente papel `owner`, `manager`, `cashier` ou `attendant` e `window.padokaCanAccess('pdv')`.
- Respostas assíncronas da RPC `padoka_create_sale_once` são ignoradas se a sessão mudar durante a operação; o mesmo `request_id` continua sendo reutilizado somente pela identidade que iniciou a tentativa.
- O callback de `onAuthStateChange` permanece síncrono e agenda a reativação fora do callback, evitando chamadas Supabase assíncronas diretamente dentro do handler.
- `tests/pdv-idempotency-audit.mjs` foi ampliado para exigir vínculo ao operador, limpeza na troca de sessão, espera pelo guard interno e descarte de respostas da sessão anterior.
- Nenhum HTML/CSS foi alterado; visual, responsividade e scanner do Caixa foram preservados.
