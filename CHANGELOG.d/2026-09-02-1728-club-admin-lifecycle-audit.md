## 2026-09-02 17:28 — Auditoria de lifecycle do PADOKA Club interno

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/club-admin.js`, `assets/app-runtime.js`, `assets/internal-nav.js` e `club-admin.html` antes da alteração.
- Confirmado que o backend fixado continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io permanece fora do escopo.
- Adicionada `tests/club-admin-lifecycle-audit.mjs` para impedir regressões na área interna do PADOKA Club.
- A auditoria exige autorização por `padoka_staff_users`, papéis internos explícitos, MFA/AAL2 para `owner`/`manager`, invalidação de respostas antigas por lifecycle, revalidação de sessão antes de operações sensíveis e uso das RPCs server-authoritative de fidelidade.
- O teste também bloqueia exposição de `service_role`/`sb_secret_`, exige CSP conectando somente ao backend PADOKA e mantém a página administrativa fora de indexação pública.
- Nenhuma migration, policy RLS, grant, trigger, Edge Function, configuração Google ou objeto não-`padoka_` foi alterado nesta execução.
