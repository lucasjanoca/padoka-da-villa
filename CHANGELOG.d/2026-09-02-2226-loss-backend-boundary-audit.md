## 2026-09-02 22:26 — Fronteira de backend de perdas protegida

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisados `assets/loss-registration.js`, `assets/internal-nav.js`, `gestao.html` e `tests/loss-transaction-audit.mjs` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o runtime interno fixa esse origin, sem participação do projeto InfoTech.io.
- Criado `tests/loss-backend-boundary-audit.mjs` para impedir regressões na fronteira do módulo de perdas.
- A nova auditoria exige CSP sem wildcard Supabase, pinning do origin PADOKA no guard interno e carregamento de `loss-registration.js` somente depois da validação de acesso interno.
- A auditoria também preserva os papéis mínimos `owner`, `manager`, `stock` e `production`, exige sessão confirmada antes de `padoka_register_loss_once`, bloqueia objetos não-`padoka_`, proíbe escrita direta em estoque e protege o retry idempotente por identidade do funcionário.
- O comportamento fail-closed do módulo de perdas continua obrigatório quando sessão/capability não podem ser confirmadas.
- Nenhuma credencial `service_role`/`sb_secret_` pode aparecer no frontend e o runtime auditado não pode depender de InfoTech.io.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google OAuth foi alterada nesta execução; por isso não houve mudança de banco que exigisse nova consulta aos Security Advisors.
