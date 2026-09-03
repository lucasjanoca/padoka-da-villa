## 2026-09-03 05:26 — Allowlist explícita de RPCs operacionais
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o HEAD anterior `2a4bc7c52ac335be69170926355535a8f5d49239`.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Confirmado que o `PADOKA Static Audit #1314` e o `PADOKA CodeQL #472` do HEAD anterior concluíram com sucesso.
- `tests/operational-backend-boundary-audit.mjs` passou a exigir uma allowlist exata para as RPCs usadas pelo runtime operacional compartilhado: `padoka_adjust_inventory_once`, `padoka_update_inventory_metadata` e `padoka_upsert_production_plan`.
- A auditoria agora falha se uma nova RPC for adicionada silenciosamente ao `assets/operational-sync.js`, mesmo que ela use o prefixo `padoka_`, reduzindo o risco de um módulo operacional ganhar capacidade além do necessário.
- Adicionados bloqueios explícitos para impedir o retorno das RPCs legadas `padoka_adjust_inventory` e `padoka_register_loss` ao runtime compartilhado.
- Permanecem protegidos o origin exato `yncspxfsvlqdnodlsosb.supabase.co`, CSP sem wildcard Supabase, validação de `padoka_staff_users`, papéis mínimos, revalidação de sessão, tabelas operacionais aprovadas e proibição de DML direto no navegador.
- Nenhum runtime de produção, migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado nesta execução.
