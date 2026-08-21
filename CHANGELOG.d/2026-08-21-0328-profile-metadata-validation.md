# 2026-08-21 03:28 — Metadados do perfil validados também no servidor

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Revisada a migration ainda não aplicada `013_customer_profile_rpc.sql` após o endurecimento recente de `conta.html`.
- O avatar derivado da sessão autenticada agora só é persistido pela RPC `padoka_save_profile` quando for URL `https://` e tiver no máximo 500 caracteres; metadado inválido é descartado no servidor, além da validação já existente no frontend.
- O provedor de autenticação derivado de `app_metadata` agora é normalizado e limitado a `google`, `email` ou `other`, evitando persistir valores inesperados no perfil PADOKA.
- Nenhum avatar ou provider passou a ser recebido como argumento do navegador; esses campos continuam derivados exclusivamente da sessão autenticada.
- `tests/profile-onboarding-audit.mjs` foi ampliado para impedir regressão dessas validações de servidor, além das verificações já existentes de consentimento, `app_scope='padoka'`, ausência de trigger global em `auth.users` e revogação da escrita direta após a migration 013.
- A migration 013 continua apenas preparada no repositório. A conexão Supabase disponível nesta execução expõe somente **InfoTech.io**, portanto nenhuma migration, query, advisor ou alteração foi executada nele.
- A tentativa de executar a suíte local por clone continuou bloqueada por falha de DNS para `github.com`; as mudanças foram revisadas diretamente no repositório e a CI configurada permanece responsável pela execução remota.
