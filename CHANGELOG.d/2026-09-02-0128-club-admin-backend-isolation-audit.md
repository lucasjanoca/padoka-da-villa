# 2026-09-02 01:28 — Auditoria de isolamento do PADOKA Club

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `club-admin.html`, `assets/club-admin.js` e a auditoria de lifecycle do módulo antes da alteração.
- Confirmado que a gestão do PADOKA Club permanece fixada no backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e não depende do projeto InfoTech.io.
- Adicionada `tests/club-admin-backend-isolation-audit.mjs` para impedir regressão do módulo interno para outro projeto Supabase, configuração pública fora da origem PADOKA ou CSP com acesso de rede ampliado.
- A auditoria também exige autorização por `padoka_staff_users`, allowlist explícita de papéis internos, AAL2 para `owner`/`manager` e manutenção das mutações sensíveis por RPCs server-authoritative.
- O teste bloqueia regressões para `UPDATE`/`INSERT` direto de saldo em `padoka_loyalty_accounts` e a presença de `service_role`/`sb_secret_` no JavaScript público.
- Nenhum HTML/CSS, migration, RLS, policy, grant, trigger, Edge Function, configuração Google ou objeto não-`padoka_` foi alterado nesta execução.
