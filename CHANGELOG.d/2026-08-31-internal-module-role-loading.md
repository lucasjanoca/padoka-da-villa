# 2026-08-31 — Scripts internos passam a respeitar o módulo e o papel validados

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- A navegação interna já escondia módulos por papel, porém `gestao.html` ainda injetava todos os scripts de Produtos, Estoque, Produção, Perdas, Relatórios, Configurações e Equipe independentemente do módulo aberto.
- `assets/internal-nav.js` agora carrega scripts internos somente depois da sessão e do registro ativo em `padoka_staff_users` serem revalidados e o papel atual ser confirmado.
- Em `gestao.html`, apenas o conjunto necessário para o `tab` atual é carregado: Produtos recebe gestão de catálogo; Estoque/Produção/Perdas/Relatórios recebem a sincronização operacional somente quando necessário; finalização de produção, registro de perdas, relatórios, configurações e equipe ficam restritos aos respectivos módulos.
- O loader falha fechado se o módulo atual não estiver permitido para o papel validado; `owner`/`manager` continuam sujeitos ao MFA/AAL2 antes da carga dos módulos privilegiados.
- `internal.html`, `pedidos.html` e `pdv.html` também passam a carregar seus scripts dedicados dentro do mesmo fluxo já validado de staff, em vez de injeção antecipada.
- Criado `tests/internal-module-loading-audit.mjs` para impedir regressão para carregamento indiscriminado de módulos internos.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; por isso não houve ampliação de privilégios nem mudança no banco que exigisse novo advisor.
