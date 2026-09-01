# 2026-09-01 18:27 — Gestão de catálogo fixa o backend PADOKA

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- `assets/product-management.js` agora valida explicitamente `client.supabaseUrl` contra `https://yncspxfsvlqdnodlsosb.supabase.co` antes de registrar lifecycle de Auth, consultar sessão, chamar RPCs ou abrir Realtime.
- Uma instância Supabase apontando para outro projeto passa a falhar fechado e não monta a gestão de catálogo.
- Permanecem preservadas as restrições a `owner`/`manager`, as RPCs server-authoritative `padoka_list_products_admin` e `padoka_save_product`, o Realtime limitado a `padoka_products` e a marcação `is_demo` para dados ainda provisórios.
- Criado `tests/product-management-backend-isolation-audit.mjs` para impedir regressão do project pinning, das permissões e da ausência de credenciais administrativas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta rodada; nenhum objeto não-`padoka_` e nenhum recurso do projeto InfoTech.io foi modificado.
