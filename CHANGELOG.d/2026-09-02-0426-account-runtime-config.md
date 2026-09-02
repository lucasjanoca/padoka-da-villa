# 2026-09-02 04:26 — Conta passa a depender exclusivamente do runtime PADOKA

- Relidos o estado atual do repositório, `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que `conta.html` já carrega `assets/app-runtime.js` antes de `assets/account.js`.
- Removido de `assets/account.js` o fallback próprio que buscava `padoka-public-config`; a conta agora falha fechada se `PADOKA_RUNTIME.getPublicConfig()` não estiver disponível.
- A configuração usada pela conta passou a exigir `scope = 'padoka'`, URL raiz HTTPS exata `https://yncspxfsvlqdnodlsosb.supabase.co` e chave pública no formato `sb_publishable_*` ou JWT legado com `role = 'anon'`.
- Após `createClient`, o módulo também confere o origin de `supabaseUrl` antes de expor `window.padokaSupabase` ou consultar Auth/dados do cliente.
- O login Google continua sem credenciais inventadas, mantém tratamento amigável quando o provider estiver desativado e preserva `prompt=select_account` quando o OAuth estiver disponível.
- O onboarding permanece usando `padoka_save_profile`; nenhuma trigger global em `auth.users`, conta demo, CPF obrigatório ou endereço fora do fluxo de entrega foi introduzido.
- Criada `tests/account-runtime-config-audit.mjs` para impedir regressão do project pinning, runtime central, formato da chave pública, OAuth Google e onboarding server-authoritative.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta execução; portanto não houve mudança de banco que exigisse consulta aos Security Advisors.
