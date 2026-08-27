# 2026-08-27 — Onboarding do cliente passa a ser exclusivamente server-authoritative

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `conta.html` e a auditoria de onboarding antes da alteração.
- Confirmado diretamente no backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que `padoka_save_profile(text,text,date,boolean,boolean)` está ativa, é `SECURITY DEFINER`, mantém `search_path=public`, permite `EXECUTE` a `authenticated` e não permite `EXECUTE` a `anon`.
- Confirmado que `authenticated` possui somente `SELECT` direto em `padoka_profiles`; `INSERT`/`UPDATE` diretos continuam revogados.
- Removido de `conta.html` o fallback temporário que tentava gravar `padoka_profiles` diretamente caso a RPC estivesse ausente. O cadastro agora falha fechado e usa exclusivamente `padoka_save_profile`.
- A experiência visual e os campos do onboarding foram preservados: nome editável, e-mail somente leitura, WhatsApp obrigatório, privacidade obrigatória, aniversário e marketing opcionais; nenhum endereço ou CPF foi adicionado.
- `tests/profile-onboarding-audit.mjs` agora impede regressão para `INSERT`/`UPDATE` direto em `padoka_profiles` e também protege o fluxo Google: pré-verificação do provider, tratamento amigável quando desativado, PKCE e `prompt='select_account'`.
- Nenhum Client ID/Secret foi inventado e nenhum segredo administrativo foi adicionado ao frontend.
- Consultados os Security Advisors do projeto correto. Avisos de tabelas privadas `padoka_payment_*` sem policy permanecem informativos por design porque não precisam de acesso direto do navegador; os avisos genéricos sobre RPCs `SECURITY DEFINER` foram revisados no contexto desta mudança e `padoka_save_profile` mantém autenticação/autorização explícitas. Objetos não-`padoka_*` não foram alterados.
- Nenhuma DDL, migration, grant ou RLS foi alterada nesta execução.
