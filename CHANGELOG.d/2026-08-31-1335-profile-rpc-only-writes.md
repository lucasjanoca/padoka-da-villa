# 2026-08-31 13:35 — Perfis de cliente ficam RPC-only para escrita

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Confirmado antes do DDL que `padoka_profiles` já estava com RLS ativa, `anon` sem acesso e `authenticated` sem `INSERT`, `UPDATE` ou `DELETE` direto.
- Identificadas duas policies antigas (`padoka_customer_create_own_profile` e `padoka_customer_update_own_profile`) que já não eram utilizáveis por falta de grants, mas mantinham um caminho latente de escrita direta caso privilégios fossem ampliados no futuro.
- Criada e aplicada a migration `071_remove_stale_profile_write_policies.sql`, removendo essas policies e reafirmando a revogação de `INSERT`, `UPDATE` e `DELETE` para `anon` e `authenticated`.
- O onboarding continua exclusivamente pela RPC `padoka_save_profile`, que valida autenticação, nome, telefone, consentimento de privacidade, aniversário opcional e conclui `onboarding_completed` no servidor.
- `conta.html` continua chamando `padoka_save_profile` e não grava `padoka_profiles` diretamente.
- Adicionado `tests/profile-direct-write-policy-audit.mjs` para impedir regressão de policies/grants de escrita direta e preservar o fluxo RPC-only.
- Após a migration, `padoka_profiles` ficou apenas com a policy de `SELECT`; RLS permanece ativa e os privilégios diretos de escrita continuam revogados.
- Security Advisor consultado antes e depois: nenhum novo alerta relacionado à PADOKA. Permanecem somente avisos de objetos `rass_*` e a configuração global de proteção contra senhas vazadas, que não foram alterados.
- Nenhum trigger em `auth.users`, objeto não-`padoka_`, credencial Google, secret ou Edge Function foi alterado.
