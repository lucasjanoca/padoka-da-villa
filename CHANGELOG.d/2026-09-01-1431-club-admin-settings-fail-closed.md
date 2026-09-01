## 2026-09-01 14:31 — Admin do Club deixa de inventar regras locais
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- O backend permanece exclusivamente no projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); InfoTech.io não foi alterado.
- `assets/club-admin.js` deixou de preencher taxa de pontos, bônus inicial, multiplicador de aniversário, validade e teto de pontos com números locais quando `padoka_loyalty_settings` não retorna um registro.
- Os controles de configuração agora iniciam bloqueados e só são habilitados após uma configuração real ser carregada do Supabase.
- Se a configuração estiver ausente, o painel mostra erro amigável e o salvamento falha fechado; nenhuma regra demonstrativa é enviada como se fosse configuração real.
- A atualização continua exclusivamente pela RPC `padoka_admin_update_loyalty_settings`, preservando autenticação, autorização e MFA existentes.
- Criado `tests/club-admin-settings-fail-closed-audit.mjs` para impedir regressões de defaults locais, backend incorreto ou exposição de credenciais administrativas.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
