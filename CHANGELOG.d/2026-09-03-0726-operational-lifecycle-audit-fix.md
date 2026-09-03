## 2026-09-03 07:26 — Auditoria de lifecycle operacional corrigida sem afrouxar o guard

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `b1e37ab1499331cb72aa14b8e56c4bfc04bb4cdd`.
- Confirmado novamente que o backend correto da PADOKA é **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io.
- O `PADOKA CodeQL #476` concluiu com sucesso no HEAD anterior, mas o `PADOKA Static Audit #1318` falhou em `tests/operational-role-lifecycle-audit.mjs`.
- A falha era um falso negativo do teste: o matcher usava o primeiro `if(!allowed(current,role))` do arquivo, localizado dentro da definição de `loadValidatedModuleScripts`, antes da rotina `applyStaffRole` que efetivamente consulta `padoka_staff_users`.
- A auditoria agora procura a autorização e a chamada `loadValidatedModuleScripts(role)` somente a partir da posição da consulta a `padoka_staff_users`, exigindo a ordem real: validação do staff → autorização do módulo → carregamento do script.
- O runtime `assets/internal-nav.js` não foi alterado e continua fail-closed, com staff ativo, papel permitido e MFA quando aplicável antes de revelar/carregar módulos internos.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth, credencial ou objeto não-`padoka_` foi alterado nesta execução.
