# 2026-08-26 20:55 — Auditoria de isolamento corrigida sem enfraquecer o backend

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisado o estado atual do repositório antes da alteração.
- O `PADOKA Static Audit` falhava no teste novo de isolamento porque tratava comentários de migrations como `NÃO aplicar no projeto InfoTech.io` como referência runtime proibida e tratava o nome do papel PostgreSQL `service_role` como se fosse uma chave administrativa exposta.
- `tests/backend-isolation-audit.mjs` agora separa navegador/runtime de migrations: HTML/JavaScript continuam proibidos de conter `service_role` e continuam obrigados a apontar somente para `yncspxfsvlqdnodlsosb`.
- Migrations continuam auditadas contra URLs de qualquer outro projeto Supabase, mas podem documentar destinos proibidos e usar o papel PostgreSQL `service_role` em `REVOKE`/`GRANT` e verificações server-side sem que isso seja confundido com exposição de segredo.
- Nenhuma credencial, chave administrativa ou `service_role` secret foi adicionada ao frontend.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado foi alterado no backend nesta execução; portanto não houve advisor de banco a executar.
- O projeto InfoTech.io não foi acessado nem alterado.
