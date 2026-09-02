# 2026-09-02 12:30 — Recuperação do checkout valida isolamento do backend

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD anterior antes da alteração.
- Confirmado que o backend correto da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Identificado que `assets/checkout-recovery.js` já dependia de `PADOKA_RUNTIME.getPublicConfig()`, mas ainda aceitava a configuração retornada sem validar localmente `scope`, origin e tipo da chave pública antes de abrir catálogo e sessão.
- O recovery agora fixa `https://yncspxfsvlqdnodlsosb.supabase.co`, exige `scope = padoka`, aceita somente `sb_publishable_*` ou JWT legado com `role = anon` e valida o `supabaseUrl` do cliente criado antes de consultar `padoka_products`, Auth ou `padoka_profiles`.
- O comportamento continua fail-closed: configuração inválida ou cliente apontando para outro backend mantém a finalização bloqueada e exibe somente a mensagem amigável de recuperação.
- Criado `tests/checkout-recovery-isolation-audit.mjs` para impedir regressões no project pinning, runtime central, escopo, chave pública, objetos `padoka_*` e ausência de credenciais privilegiadas no frontend.
- `node --check` passou para o conteúdo atualizado e o teste específico `checkout-recovery-isolation-audit.mjs` passou localmente com o arquivo novo.
- Não houve migration, alteração de RLS, policy, grant, trigger, Edge Function ou configuração Google nesta execução; portanto não houve mudança de banco a submeter aos Security Advisors.
