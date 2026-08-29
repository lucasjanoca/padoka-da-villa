# 2026-08-29 13:30 — Estorno do PDV falha fechado em erros de sessão/rede

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/pdv-sale-void.js` e `tests/pdv-sale-void-audit.mjs` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- `assets/pdv-sale-void.js` agora captura rejeições de transporte em todas as confirmações sensíveis de `auth.getSession()` usadas pelo histórico/estorno.
- `identityStillCurrent()` retorna `false` quando a sessão não pode ser confirmada, impedindo renderização ou continuação de respostas associadas a uma identidade não confirmada.
- A espera pelo guard global de staff também encerra em modo fail-closed quando a sessão do funcionário não pode ser validada por rede.
- A ativação do módulo passou a envolver o probe de `padoka_sales` e a reconfirmação da sessão em `try/catch`; se qualquer uma dessas etapas rejeitar, o runtime é desmontado e a identidade ativa é invalidada.
- A RPC autoritativa `padoka_void_sale` continua sendo o único caminho de estorno; não foi adicionado `UPDATE` direto em vendas/estoque e nenhuma permissão foi ampliada.
- `tests/pdv-sale-void-audit.mjs` passou a exigir captura explícita dessas falhas de transporte e retorno ao estado fail-closed.
- Nenhuma migration, RLS, grant, secret ou Edge Function foi alterada nesta execução; nenhum objeto não-`padoka_` foi tocado.
