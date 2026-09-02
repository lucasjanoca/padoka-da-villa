## 2026-09-02 15:32 — Checkout v3 fecha EXECUTE herdado na implementação privada

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `c87f107ce1e07f8d0e418b5727985de76c6fe76d` antes da alteração.
- Confirmado novamente que o backend correto é **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Identificado que `padoka_private.padoka_create_order_once_v3(...)`, embora esteja em schema privado, estava com ACL padrão (`proacl = null`) e portanto herdava `EXECUTE` de `PUBLIC`; o papel `authenticated` também possui `USAGE` no schema privado para que o wrapper público `SECURITY INVOKER` consiga chamar sua implementação.
- Revisada a função antes da mudança: ela é `SECURITY DEFINER`, usa `search_path=''`, exige `auth.uid()`, exige `padoka_profiles` com `app_scope='padoka'` e `onboarding_completed`, valida itens/pagamento e continua calculando preços e total no servidor.
- A correção foi testada primeiro dentro de uma transação com `ROLLBACK`: `PUBLIC/anon` ficaram sem `EXECUTE` e `authenticated` manteve somente o privilégio mínimo necessário ao wrapper.
- Aplicada no Supabase a migration `padoka_order_v3_private_acl`: revoga `EXECUTE` da implementação privada para `PUBLIC` e `anon`, e concede explicitamente somente a `authenticated`.
- Após a aplicação, confirmado no banco: implementação privada `anon_exec=false`, `public_exec=false`, `authenticated_exec=true`; wrapper `public.padoka_create_order_once_v3(...)` continua `anon_exec=false` e `authenticated_exec=true`.
- Adicionado `supabase/086_order_v3_private_acl.sql` para manter o estado do repositório alinhado com o banco.
- `tests/order-backend-isolation-audit.mjs` passou a auditar a ACL da implementação privada e impedir regressão para `EXECUTE` de `PUBLIC/anon`.
- Security Advisor executado depois da DDL: nenhum novo aviso relacionado a `padoka_*`; avisos de `rass_*` e a configuração global de leaked-password protection foram preservados sem alterações fora do escopo.
- A tentativa de clonar o repositório para executar o teste local falhou por resolução DNS do ambiente; o GitHub Actions foi deixado como validação automática do commit.
- Nenhuma policy RLS, trigger em `auth.users`, credencial Google, Edge Function, objeto não-`padoka_` ou dado comercial foi alterado.
