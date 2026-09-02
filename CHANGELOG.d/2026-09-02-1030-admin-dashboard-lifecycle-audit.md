## 2026-09-02 10:30 — Auditoria dedicada do lifecycle do dashboard interno
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual do repositório antes da alteração.
- Confirmado que a PADOKA continua vinculada exclusivamente ao projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem qualquer alteração no projeto InfoTech.io.
- Revisado `assets/admin-dashboard-live.js`: o dashboard continua preso ao origin exato da PADOKA, falha fechado enquanto a autorização de staff está pendente, revalida sessão/`user_id` antes de aplicar respostas assíncronas e invalida trabalho obsoleto por `lifecycleEpoch` em logout/troca de conta.
- Estoque e produção continuam expostos no dashboard somente para papéis explicitamente permitidos (`owner`/`manager`/`stock` e `owner`/`manager`/`production`, respectivamente).
- Leituras e subscriptions Realtime continuam restritas a objetos `padoka_orders`, `padoka_inventory` e `padoka_production_plans`; nenhuma credencial privilegiada é exposta no frontend.
- Criado `tests/admin-dashboard-lifecycle-audit.mjs` para impedir regressões no project pinning, lifecycle de staff, allowlists de papéis, isolamento de objetos `padoka_*` e ausência de `service_role`/`sb_secret_` no runtime público.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução; por isso não houve mudança de banco a submeter aos Security Advisors.
