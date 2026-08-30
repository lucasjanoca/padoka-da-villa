# 2026-08-30 10:30 — Gestão de equipe reconfirma owner antes das RPCs

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificado que `assets/staff-management.js` já tratava erros do Supabase Auth, porém `load()`, o probe de inclusão e a primeira listagem do bootstrap ainda podiam iniciar RPCs sensíveis antes de reconfirmar explicitamente a identidade owner daquele fluxo.
- `load()` agora reconfirma o mesmo `currentUserId`/owner antes de chamar `padoka_list_staff` e continua revalidando após a resposta, mantendo a lista fail-closed durante logout ou troca de conta.
- `probeEnrollment()` agora recebe a identidade esperada e revalida owner antes e depois da chamada inválida/sem efeito usada para detectar `padoka_add_staff_by_email`.
- O bootstrap da aba Equipe também executa preflight de identidade imediatamente antes da primeira `padoka_list_staff`, e repassa o mesmo `user_id` ao probe.
- Inclusão e alteração reais continuam com preflight e pós-validação de identidade, sem escrita direta em `padoka_staff_users`, sem `signUp`, sem criação de `padoka_profiles` e sem trigger global em `auth.users`.
- `tests/staff-management-frontend-audit.mjs` agora verifica pela ordem do código que os preflights acontecem antes das RPCs de listagem/bootstrap/probe.
- Uma correção imediata preservou exatamente o escape HTML `&gt;` no helper `esc`, evitando qualquer regressão de sanitização durante a edição do arquivo.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto nenhum privilégio foi ampliado e não houve mudança de banco que exigisse nova consulta aos Security Advisors.