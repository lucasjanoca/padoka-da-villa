## 2026-09-02 13:28 — Relatórios internos ganham auditoria de lifecycle
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual do repositório antes da alteração.
- Confirmado que a PADOKA continua presa ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem qualquer alteração no projeto InfoTech.io.
- Revisado `assets/reporting-sync.js`: os relatórios financeiros continuam restritos a `owner`/`manager`, carregados pela RPC server-authoritative `padoka_report_summary` e ligados apenas a tabelas `padoka_*`.
- Confirmado que o módulo revalida sessão/`user_id`, invalida trabalho assíncrono por `lifecycleEpoch`, fecha a UI ao trocar de conta e remove o canal Realtime da identidade anterior.
- Criado `tests/reporting-lifecycle-audit.mjs` para impedir regressões no project pinning, isolamento por papel, lifecycle de autenticação, escopo Realtime e ausência de `service_role`/`sb_secret_` no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google ou objeto não-`padoka_` foi alterado nesta execução; portanto não houve mudança de banco que exigisse consulta aos Security Advisors.
