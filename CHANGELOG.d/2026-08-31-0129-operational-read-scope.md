# 2026-08-31 01:29 — Leituras operacionais passam a respeitar o módulo ativo

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io permanece fora do escopo da PADOKA.
- `assets/operational-sync.js` deixou de consultar `padoka_inventory`, `padoka_production_plans` e `padoka_losses` em toda aba operacional.
- A aba **Estoque** passa a consultar somente inventário; **Produção**, somente planejamento; **Perdas**, somente perdas; **Relatórios** continua agregando as três fontes porque precisa delas para o resumo operacional.
- A assinatura Realtime segue o mesmo princípio: cada aba assina apenas as tabelas de que realmente depende.
- A reconciliação de ajuste de estoque pendente só roda na aba Estoque, evitando que perfis especializados de produção/perdas acionem uma RPC fora da função que estão exercendo.
- As mutações de metadados/ajuste de estoque e planejamento receberam guard adicional do próprio módulo, além da autenticação e autorização já existentes no servidor.
- Criado `tests/operational-read-scope-audit.mjs` para impedir regressão ao carregamento indiscriminado das três fontes.
- Nenhuma migration, policy RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve ampliação de privilégios nem necessidade de alterar Security Advisors.
- Esta mudança prepara com menor risco o próximo passo de restringir as policies de leitura por papel no banco, sem quebrar perfis especializados no frontend.
