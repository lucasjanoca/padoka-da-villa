## 2026-08-20 18:30 — Visão geral do ADM passa a refletir o dia atual em tempo real

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisado o estado atual do repositório antes da alteração.
- Identificado que os cards do `internal.html` eram preenchidos a partir dos últimos 30 pedidos, embora o rótulo exibisse **PEDIDOS HOJE**; em dias com pedidos anteriores isso podia deixar os números incorretos.
- Criado `assets/admin-dashboard-live.js`, carregado somente em `internal.html` pela navegação interna.
- A nova camada consulta apenas `padoka_orders` sob a sessão/RLS já existente, filtra o dia no fuso `America/Sao_Paulo` e atualiza **Pedidos hoje**, **Em andamento**, **Prontos** e **Valor em pedidos**.
- Pedidos cancelados não entram no valor agregado. O rótulo foi mantido como **VALOR EM PEDIDOS** para não apresentar pedidos como faturamento/pagamento confirmado.
- A lista de pedidos recentes do painel agora representa somente o dia atual, continua sanitizando conteúdo e usa rótulos de status em português.
- Adicionada atualização por Supabase Realtime em mudanças de `padoka_orders`, com debounce, além de refresh periódico para atravessar a virada do dia sem recarregar a página.
- Criado `tests/admin-dashboard-audit.mjs` e incluído no workflow `.github/workflows/padoka-audit.yml` para proteger fuso, Realtime, leitura apenas e ausência de armazenamento local.
- `node --check` de `assets/admin-dashboard-live.js` passou localmente. A clonagem completa do repositório para executar a suíte inteira continuou bloqueada neste ambiente por falha de DNS ao resolver `github.com`.
- Confirmado novamente pelo conector Supabase que a conexão disponível expõe somente **InfoTech.io**. Nenhuma query, migration, advisor ou alteração foi executada nesse projeto; o backend correto da PADOKA continua sendo `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`).
- Nenhuma alteração de banco/RLS foi feita nesta execução, portanto não havia advisor da PADOKA a executar.
