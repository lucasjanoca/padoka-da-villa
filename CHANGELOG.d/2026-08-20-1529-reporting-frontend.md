# 2026-08-20 15:29 — Relatórios consolidados preparados no frontend

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `gestao.html`, `assets/operational-sync.js`, `supabase/008_staff_reporting_rpc.sql`, a auditoria de reporting e o workflow antes da alteração.
- Confirmado novamente que o conector Supabase disponível expõe somente **InfoTech.io** (`rgngqumqzylthdiazvfu`). Nenhuma query, migration, advisor ou alteração foi executada nesse projeto. O backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Criado `assets/reporting-sync.js` para ativar relatórios consolidados somente dentro de `gestao.html`, depois da autenticação interna já existente.
- O frontend usa exclusivamente a RPC autoritativa `padoka_report_summary`; não recalcula faturamento nem ranking lendo `padoka_sales`/`padoka_sale_items` diretamente no navegador.
- O relatório permite período de até 31 dias, mostra vendas concluídas, pedidos, perdas, produção, estoque e produtos mais vendidos e sinaliza quando existem dados provisórios/teste.
- Falta de permissão é tratada com mensagem amigável; a RPC continua responsável por limitar os dados financeiros a `owner`/`manager`.
- Se a migration 008 ainda não existir no backend publicado, o módulo se remove silenciosamente e o resumo operacional anterior permanece, evitando quebrar a Gestão atual.
- Quando ativo e consultando o dia corrente, mudanças em vendas, pedidos, perdas, produção e estoque disparam atualização do relatório via Realtime com debounce.
- `assets/internal-nav.js` passou a carregar `reporting-sync.js` somente na Gestão, mantendo páginas públicas sem qualquer acesso a relatórios internos.
- Criado `tests/reporting-frontend-audit.mjs` para exigir uso da RPC, limite de período, sinalização de dados provisórios, tratamento de permissão e impedir retorno a `localStorage` ou cálculo financeiro por leitura direta das tabelas.
- O workflow `.github/workflows/padoka-audit.yml` agora inclui a nova auditoria.
- A tentativa de validar os arquivos baixando o repositório no ambiente local falhou por DNS ao resolver `raw.githubusercontent.com`; o status combinado do commit mais recente também ainda não apresentou checks, portanto esta execução não afirma CI verde sem evidência.
- Nenhuma migration/RLS foi aplicada nesta execução; por isso não havia advisor de segurança PADOKA novo para executar.
