## 2026-08-20 06:29 — Auditoria estática passa a rodar automaticamente no GitHub

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e `tests/static-audit.mjs` antes da alteração.
- Criado `.github/workflows/padoka-audit.yml` para executar a auditoria estática em pushes e pull requests para `main`.
- O workflow usa somente permissão `contents: read`, Node.js 22, valida a sintaxe do próprio teste com `node --check` e depois executa `node tests/static-audit.mjs`.
- A auditoria existente continua protegendo: ausência de links públicos para módulos internos; validação de `padoka_staff_users`; acompanhamento sem busca e com Realtime; checkout/catalogo server-authoritative; transição de status preparada para RPC; Google com `prompt=select_account` e tratamento amigável quando desabilitado; imagens distintas de bebidas; e ausência de trigger global em `auth.users`.
- A conexão Supabase desta execução foi verificada novamente e continua expondo somente o projeto **InfoTech.io**. Nenhuma query, migration, advisor ou alteração foi executada nele.
- O backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`). Nenhuma mudança de banco/RLS foi aplicada nesta execução.
- O conector GitHub confirmou a criação do workflow, porém não expôs um workflow run de push associado ao commit nesta sessão; portanto o resultado remoto do primeiro run não foi afirmado como concluído.
