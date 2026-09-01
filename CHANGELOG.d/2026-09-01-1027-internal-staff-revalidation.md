# 2026-09-01 10:27 — Permissões internas passam a ser revalidadas durante a sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que a navegação interna já reagia a login, logout e troca de conta, porém uma desativação ou mudança de papel feita no servidor durante uma sessão já aberta podia permanecer visualmente antiga até recarregar a página.
- `assets/internal-nav.js` agora revalida `padoka_staff_users` a cada cinco minutos enquanto a aba está ativa e imediatamente quando a página volta ao foco.
- A consulta continua limitada ao `user_id` da sessão autenticada e mantém `role,active` como autoridade do servidor; nenhuma permissão é inferida apenas no navegador.
- Se um funcionário que já estava validado deixar de possuir acesso, a área interna falha fechada e navega para `internal.html`, removendo a tela operacional anterior em vez de mantê-la visível.
- Mudanças válidas de papel passam novamente por `applyStaffRole`, atualizam allowlists visuais e continuam exigindo MFA/AAL2 para `owner` e `manager`.
- O timer de revalidação é encerrado em `pagehide` para evitar trabalho residual após sair da página.
- Criado `tests/internal-staff-revalidation-audit.mjs` para impedir regressão do polling seguro, revalidação ao voltar à aba, pinning do projeto PADOKA, MFA e ausência de segredos administrativos no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta rodada.
