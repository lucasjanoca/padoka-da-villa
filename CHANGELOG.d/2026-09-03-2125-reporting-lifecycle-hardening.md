# 2026-09-03 21:25 — Relatórios internos ganham proteção adicional de lifecycle no CI

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo o backend exclusivamente em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Revisado `assets/reporting-sync.js`: o módulo já permanece restrito a `owner`/`manager`, usa exclusivamente `padoka_report_summary`, revalida sessão/identidade antes e depois da RPC e descarta respostas atrasadas por `lifecycleEpoch + activeUserId`.
- `tests/reporting-lifecycle-audit.mjs` foi endurecido para exigir que logout/troca de funcionário removam imediatamente o canal Realtime anterior e a UI privilegiada de relatórios antes de reautorizar outra identidade.
- A auditoria também passa a exigir revalidação pós-RPC antes de `render()`/`subscribe()`, descarte de resultados assíncronos obsoletos e teardown de recursos de autenticação/Realtime ao sair da página.
- Permanecem bloqueados no frontend `service_role`, `sb_secret_` e acessos diretos a objetos de banco que não usem prefixo `padoka_`.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, OAuth Google, dado comercial ou objeto não-`padoka_` foi alterado nesta execução.
