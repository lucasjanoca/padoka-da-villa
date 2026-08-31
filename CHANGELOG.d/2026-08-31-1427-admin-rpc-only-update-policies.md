## 2026-08-31 14:27 — Mutações administrativas permanecem somente por RPC

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Confirmado antes do DDL que `padoka_feature_flags`, `padoka_incidents` e `padoka_privacy_requests` já não concediam `UPDATE` direto ao papel `authenticated`; as mutações administrativas existentes usam `padoka_admin_set_feature_flag`, `padoka_admin_resolve_incident` e `padoka_admin_update_privacy_request`.
- Aplicada a migration `072_remove_stale_admin_update_policies.sql`, mantendo RLS ativa, reafirmando a revogação de `UPDATE` para `public`, `anon` e `authenticated` e removendo as policies latentes `padoka_feature_flags_admin_update`, `padoka_incidents_admin_update` e `padoka_privacy_owner_update`.
- O fluxo de privacidade do próprio cliente preserva somente o `INSERT` permitido para criar a própria solicitação pendente; a alteração administrativa de status continua exclusiva da RPC autorizada.
- Após a aplicação, confirmado no banco que as três tabelas continuam com RLS ativa e `anon`/`authenticated` sem privilégio de `UPDATE` direto.
- Adicionada `tests/admin-direct-update-policy-audit.mjs` para impedir que essas policies ou grants diretos retornem e para exigir a permanência das RPCs administrativas com wrappers públicos `SECURITY INVOKER`.
- Security Advisor consultado antes da alteração: nenhum aviso relacionado à PADOKA; apenas avisos existentes de objetos `rass_*` e da proteção global contra senhas vazadas, que permaneceram intocados.
