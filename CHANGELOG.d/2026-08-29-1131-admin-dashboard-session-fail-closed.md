## 2026-08-29 11:31 — Dashboard interno falha fechado em erro de sessão
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado em `assets/admin-dashboard-live.js` que `waitForValidatedStaff()` aguardava `auth.getSession()` sem capturar uma rejeição real de transporte.
- A confirmação de sessão do dashboard agora trata tanto o `error` retornado pelo Supabase quanto rejeições de rede; em ambos os casos retorna sem ativar o dashboard, preservando o comportamento fail-closed.
- A validação continua vinculada a `expectedEpoch` e à identidade esperada, impedindo que uma confirmação atrasada de sessão reative dados ou canais Realtime de um funcionário anterior.
- `tests/admin-dashboard-audit.mjs` passou a exigir captura explícita de falhas de transporte e tratamento fail-closed da confirmação de sessão.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; nenhum objeto não-`padoka_` foi tocado.
