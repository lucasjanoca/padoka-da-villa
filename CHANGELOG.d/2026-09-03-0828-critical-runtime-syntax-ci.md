## 2026-09-03 08:28 — CI passa a validar sintaxe dos runtimes críticos

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Confirmado que o HEAD anterior estava saudável: CodeQL e Production Monitor concluíram com sucesso.
- Identificada uma lacuna no `PADOKA Static Audit`: todos os `tests/*.mjs` recebiam `node --check`, porém alguns runtimes críticos atuais não participavam da checagem sintática dedicada.
- A etapa foi consolidada como **Check critical runtime syntax** e agora inclui explicitamente os controladores de checkout/recovery, lifecycle dos pedidos, navegação interna, sincronização operacional e registro idempotente de perdas, além dos módulos críticos que já eram verificados.
- A mudança é somente de CI e não altera comportamento do frontend, autenticação, catálogo, checkout, acompanhamento, PDV, estoque, produção, perdas ou relatórios.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado; portanto não houve mudança de banco que exigisse Security Advisor nesta execução.
