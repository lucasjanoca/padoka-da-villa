# 2026-08-21 01:31 — Onboarding de cliente preparado para escrita controlada pelo servidor

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `conta.html`, a cadeia de migrations e o workflow de auditoria antes da alteração.
- Mantido como backend correto exclusivamente **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io.
- Criada `supabase/013_customer_profile_rpc.sql` com a RPC `padoka_save_profile`, sem trigger em `auth.users` e usando somente objetos `padoka_*`.
- A migration reforça o contrato de `padoka_profiles` com `app_scope = 'padoka'`, `privacy_accepted_at`, `avatar_url` e `auth_provider` quando essas colunas ainda não existirem.
- `padoka_save_profile` exige usuário autenticado, nome válido, WhatsApp, consentimento de privacidade e valida aniversário opcional; marketing continua opcional.
- Avatar e provider são derivados do JWT autenticado no servidor em vez de serem confiados como valores enviados pelo navegador.
- Depois da aplicação da 013, `INSERT/UPDATE` direto em `padoka_profiles` é revogado para `authenticated`; leitura continua protegida pela RLS existente.
- `conta.html` agora tenta `padoka_save_profile` primeiro. Enquanto a migration 013 ainda não estiver publicada, mantém um fallback temporário de escrita direta somente quando a RPC realmente estiver ausente, evitando quebrar a versão atual.
- Criado `tests/profile-onboarding-audit.mjs` para verificar autenticação, consentimento, isolamento `app_scope`, origem server-side de avatar/provider, grants da RPC e ausência de trigger global.
- `tests/migration-chain-audit.mjs` agora exige cadeia contínua `001→013` e inclui a migration 013 no contrato esperado.
- O GitHub Actions foi atualizado para executar a nova auditoria.
- `DEPLOYMENT.md` passou a incluir a migration 013 e o gate de validação do onboarding antes da remoção do fallback temporário.
- A tentativa de clonar o repositório para executar a suíte local completa continuou bloqueada por DNS (`Could not resolve host: github.com`). As mudanças foram revisadas no repositório, mas a CI remota ainda precisa fornecer evidência antes de ser considerada aprovada.
- Nenhuma migration foi aplicada no Supabase nesta execução; portanto não houve advisor de Security/Performance da PADOKA a executar nesta rodada.
