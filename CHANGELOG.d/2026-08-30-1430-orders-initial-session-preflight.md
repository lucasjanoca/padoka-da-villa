# 2026-08-30 14:30 — Fila interna reconfirma sessão antes de consultar staff

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificada uma pequena janela no carregamento inicial de `pedidos.html`: a sessão era lida, o listener Auth era instalado e só então `padoka_staff_users` era consultada. Embora já existisse uma revalidação depois da consulta, faltava uma confirmação imediatamente antes dela.
- `assets/orders-auth-lifecycle.js` agora executa um segundo `safeSession()` logo antes da leitura inicial de `padoka_staff_users` e exige que `user_id` e `activeUserId` ainda coincidam com a identidade originalmente capturada.
- A revalidação posterior à consulta foi preservada, deixando a autorização inicial protegida antes e depois da leitura do cadastro interno.
- `tests/staff-navigation-audit.mjs` passou a exigir explicitamente esse preflight e a ordem correta antes da consulta de staff, evitando regressão futura.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem necessidade de alterar objetos não-`padoka_`.
- A fila continua fail-closed durante revalidação e Caixa, Estoque, Produção e Administração permanecem fora da área pública.
