# 2026-09-01 03:29 — PADOKA Club interno isolado por lifecycle de staff

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `club-admin.html`, `assets/club-admin.js` e a navegação interna antes da alteração.
- O backend permanece fixado no projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do InfoTech.io ou de outro cliente foi alterado.
- `assets/club-admin.js` agora valida explicitamente que a configuração pública pertence a `https://yncspxfsvlqdnodlsosb.supabase.co` e cria o cliente somente nessa origem.
- O módulo passou a acompanhar `onAuthStateChange` com `lifecycleEpoch` e `activeStaffUserId`, ocultando e limpando imediatamente os dados administrativos quando há logout ou troca de conta.
- Consultas e mutações do PADOKA Club revalidam a sessão atual e descartam respostas assíncronas antigas quando a identidade muda.
- A validação de resgates, ajustes de pontos, configurações, recompensas e campanhas continua server-authoritative pelas RPCs `padoka_admin_*`; nenhum saldo é escrito diretamente pelo navegador.
- Owner/manager continuam exigindo AAL2/MFA antes de acessar as funções administrativas privilegiadas.
- Criada `tests/club-admin-session-lifecycle-audit.mjs` para impedir regressão de pinning do backend, lifecycle de autenticação e mutações diretas de saldo.
- Nenhuma migration, RLS, policy, grant ou Edge Function foi alterada nesta rodada; portanto não houve mudança de banco que exigisse ampliação de privilégios.
