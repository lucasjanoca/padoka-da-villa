# 2026-09-03 17:27 — Catálogo público ganha auditoria de isolamento do backend

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e mantendo o projeto InfoTech.io fora do escopo.
- Confirmado que o catálogo público já fixa a origem `https://yncspxfsvlqdnodlsosb.supabase.co`, valida `scope = 'padoka'`, exige HTTPS, aceita somente publishable key ou JWT legado com papel `anon` e consulta exclusivamente `padoka_products`.
- Criado `tests/catalog-backend-isolation-audit.mjs` para impedir regressões que apontem o catálogo para outro projeto Supabase compartilhado, removam a validação de escopo/origem, aceitem `service_role`/`sb_secret_`, reutilizem cookies do navegador ou sigam redirecionamentos silenciosos.
- A auditoria também preserva o prefixo `padoka_` no endpoint público e mantém o catálogo preso ao backend PADOKA mesmo se uma configuração de runtime incorreta tentar trocar a origem.
- `PADOKA Static Audit #1348` passou com sucesso no commit funcional da rodada.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, credencial, configuração Google OAuth, HTML/CSS ou objeto não-`padoka_` foi alterado nesta execução.
- Como não houve mudança de banco/RLS, não foi necessário executar Security Advisors nesta rodada.
