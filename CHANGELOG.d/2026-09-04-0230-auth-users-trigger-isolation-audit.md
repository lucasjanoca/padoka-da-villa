# 2026-09-04 02:30 — Auditoria global contra trigger em auth.users

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisado o HEAD atual antes da alteração.
- Confirmado novamente que o backend correto da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificada uma lacuna de defesa em profundidade: a ausência de trigger global em `auth.users` já era verificada na migration específica de perfil, mas não havia uma regra global cobrindo toda migration futura do projeto.
- `tests/backend-isolation-audit.mjs` agora remove comentários SQL antes da inspeção e rejeita qualquer `CREATE TRIGGER ... ON auth.users` executável encontrado em qualquer arquivo `supabase/*.sql`, evitando falso positivo em documentação e protegendo o isolamento do projeto compartilhado.
- A auditoria também exige que `AUTH_STATUS.md` continue documentando explicitamente que não existe trigger global em `auth.users`; o onboarding do cliente permanece um ato explícito dentro da PADOKA e `padoka_staff_users` continua separado de perfis de cliente.
- O `PADOKA Static Audit #1368` passou no commit funcional com a nova proteção.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração de Auth/OAuth ou runtime de negócio foi alterado; portanto não houve mudança de banco nem necessidade de consultar Security Advisors nesta rodada.
- A tentativa de executar a suíte a partir de um clone local ficou indisponível por falha de resolução DNS do ambiente; a validação efetiva foi feita pelo GitHub Actions do repositório.
