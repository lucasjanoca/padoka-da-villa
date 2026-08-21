# 2026-08-21 08:26 — Navegação interna alinhada às funções da equipe

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes de continuar o projeto.
- Confirmado novamente que o backend correto da PADOKA é **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que a conexão Supabase disponível nesta execução continua expondo somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nele.
- `assets/internal-nav.js` agora resolve `role,active` diretamente de `padoka_staff_users` e usa a mesma matriz de funções já prevista pelas migrations operacionais:
  - Caixa/PDV: `owner`, `manager`, `cashier`, `attendant`;
  - Estoque: `owner`, `manager`, `stock`;
  - Produção: `owner`, `manager`, `production`;
  - Perdas: `owner`, `manager`, `stock`, `production`;
  - Relatórios e Configurações: `owner`, `manager`;
  - Visão geral, Pedidos e Produtos permanecem disponíveis a todo staff ativo.
- Links privilegiados ficam ocultos até a função real ser validada. Acesso direto a um módulo incompatível não revela o `#app` durante a checagem e retorna para `internal.html`.
- Atalhos fora do drawer e abas da Gestão também passam pela mesma decisão de acesso, evitando mostrar botão de PDV/Estoque/Produção para quem não possui a função correspondente.
- A autorização real das operações continua pertencendo às RLS/RPCs do servidor; a filtragem no frontend é uma camada adicional de navegação e não substitui as proteções do banco.
- Criado `tests/staff-navigation-audit.mjs` e incluído no workflow `.github/workflows/padoka-audit.yml` para impedir regressão da matriz de funções, do bloqueio de acesso direto e da consulta a `padoka_staff_users`.
- Tentativa de rodar os testes localmente falhou antes do checkout porque o ambiente não conseguiu resolver `github.com` por DNS. O GitHub ainda não retornou status de checks para o commit mais recente, então a CI remota não foi marcada como aprovada sem evidência.
- Nenhuma migration/RLS foi alterada nesta execução; não havia advisor PADOKA novo para executar.
