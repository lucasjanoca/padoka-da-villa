# Segurança — leitura de configurações restrita à gestão

- A leitura direta de `padoka_settings` deixa de aceitar qualquer funcionário ativo e passa a exigir exclusivamente `owner` ou `manager` via `padoka_staff_has_role(...)`.
- `padoka_private.padoka_get_settings()` agora valida `auth.uid()` explicitamente, exige `owner/manager` e usa `search_path` vazio antes de ler a configuração interna.
- A UI já carregava Configurações somente para `owner/manager`; a fronteira do banco agora corresponde à permissão real do módulo e mantém o Realtime funcional para esses papéis.
- Nenhum grant foi ampliado: `anon` segue sem `SELECT`; `authenticated` segue sem `INSERT`, `UPDATE` ou `DELETE` direto em `padoka_settings`.
- Adicionada a auditoria `tests/settings-read-role-boundary-audit.mjs` para impedir regressão para `padoka_is_staff()` genérico ou ampliação de grants.
- Migration aplicada exclusivamente em `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`). Nenhum objeto não-`padoka_` foi alterado.
