# 2026-09-04 05:29 — Auditoria de segurança do GitHub Actions endurecida

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- `tests/github-actions-security-audit.mjs` agora exige `permissions` explícito em todos os workflows e bloqueia `pull_request_target`, evitando ampliar inadvertidamente o contexto de confiança de contribuições externas.
- A auditoria continua exigindo SHA completo para actions externas e passou a bloquear referências literais a `service_role`/`sb_secret_` dentro dos workflows.
- As verificações existentes de CodeQL `security-extended` e Dependabot para GitHub Actions foram preservadas.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, OAuth Google, runtime de negócio ou objeto não-`padoka_` foi alterado nesta execução.
