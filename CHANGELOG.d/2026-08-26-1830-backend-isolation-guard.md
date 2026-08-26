# 2026-08-26 18:30 — Auditoria automática protege o backend correto

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend oficial documentado continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Adicionado `tests/backend-isolation-audit.mjs` para verificar automaticamente HTML, JavaScript e migrations SQL da PADOKA.
- A auditoria falha se código/runtime contiver `service_role`, referência ao projeto InfoTech.io ou URL de outro project ref Supabase.
- A verificação também exige que `AUTH_STATUS.md` continue documentando o project ref correto e o isolamento do InfoTech.io.
- O novo teste foi integrado ao workflow `PADOKA Static Audit`, incluindo validação de sintaxe antes da execução.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado nesta execução; portanto não houve mudança de banco a submeter aos advisors.
- Nenhum objeto não-`padoka_` foi alterado.
