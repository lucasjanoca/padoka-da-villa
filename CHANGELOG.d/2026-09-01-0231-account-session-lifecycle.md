# 2026-09-01 02:31 — Conta do cliente passa a falhar fechado em troca de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que a PADOKA não deve usar nem alterar o projeto InfoTech.io.
- Identificado em `assets/account.js` que consultas assíncronas de perfil, pedidos, fidelidade, notificações, privacidade e reordenação ainda podiam concluir depois de uma troca de conta/logout e atualizar a interface com dados pertencentes à identidade anterior.
- A conta agora mantém `lifecycleEpoch` + `activeUserId`; qualquer evento relevante de `onAuthStateChange` invalida sincronicamente o lifecycle anterior, limpa dados específicos do cliente e oculta as views até que a nova sessão seja confirmada.
- Respostas assíncronas de perfil, pedidos recentes, PADOKA Club, notificações, solicitações de privacidade e reordenação são descartadas quando `epoch + user_id` deixam de coincidir com a sessão ativa.
- Ações de marcar notificações como lidas, exportar dados, solicitar exclusão e salvar onboarding também revalidam o lifecycle antes de aplicar respostas no navegador.
- A configuração pública da conta passou a validar explicitamente a origem `https://yncspxfsvlqdnodlsosb.supabase.co`; `createClient` não aceita uma origem retornada dinamicamente fora do backend PADOKA.
- O login Google preserva o tratamento amigável quando o provider está desativado e mantém `prompt=select_account` quando habilitado; nenhuma credencial foi inventada ou adicionada ao repositório.
- O onboarding continua salvando exclusivamente pela RPC `padoka_save_profile`; não foi reintroduzida escrita direta em `padoka_profiles` e nenhum trigger em `auth.users` foi criado.
- Criado `tests/account-session-lifecycle-audit.mjs` para impedir regressões de isolamento de sessão, pinning do backend e do fluxo server-authoritative de perfil.
- Nenhuma migration, RLS, policy, grant ou Edge Function foi alterada nesta rodada; portanto não houve ampliação de privilégios de banco.
