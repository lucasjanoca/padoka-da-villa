# 2026-09-03 23:31 — Lifecycle das ações sensíveis da conta protegido pelo CI

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD `af709d205700e12765c1805c41465d59579b4575` antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não faz parte da PADOKA.
- Criada `tests/account-sensitive-actions-lifecycle-audit.mjs` para transformar em contrato permanente do CI o lifecycle de ações sensíveis da conta pública.
- A auditoria exige que marcar notificações como lidas, exportar dados e solicitar exclusão capturem e validem `lifecycleEpoch + activeUserId` antes da operação e revalidem a identidade após a resposta assíncrona, impedindo que uma resposta da conta anterior seja aplicada depois de logout ou troca de usuário.
- Leituras de `padoka_customer_notifications` e `padoka_privacy_requests` continuam explicitamente filtradas por `user_id` do cliente ativo.
- Mutações sensíveis continuam server-authoritative pelas RPCs `padoka_mark_customer_notifications_read`, `padoka_export_my_data` e `padoka_request_privacy_action`; o teste bloqueia regressão para `UPDATE`/`INSERT` direto dessas tabelas no navegador.
- A auditoria também bloqueia `service_role`, `sb_secret_` e dependência do runtime público em `auth.users`.
- O `PADOKA Static Audit #1360` passou no commit funcional, incluindo sintaxe dos audits/runtimes e execução de todas as auditorias PADOKA.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, OAuth Google, credencial, HTML/CSS, dado comercial ou objeto não-`padoka_` foi alterado nesta execução.
- Como não houve mudança de banco/RLS, não foi necessário consultar Security Advisors nesta rodada.
