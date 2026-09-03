# Checkout volta a carregar o runtime de acessibilidade

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io fora do escopo.
- O `PADOKA Static Audit #1285` revelou que `pagamento.html` carregava `assets/accessibility.css`, mas não carregava `assets/accessibility.js`.
- Restaurado `assets/accessibility.js?v=2` no checkout, preservando o skip-link e a região de feedback acessível já padronizados no restante da aplicação.
- Nenhuma lógica de checkout, catálogo, autenticação, idempotência, pedido, Pix ou Supabase foi alterada.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta execução.
