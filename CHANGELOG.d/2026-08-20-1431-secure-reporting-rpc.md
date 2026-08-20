## 2026-08-20 14:31 — Relatórios internos ganham fonte autoritativa preparada

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e preservado o backend exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Criada `supabase/008_staff_reporting_rpc.sql`, sem aplicar a migration em nenhum ambiente nesta execução.
- A nova RPC `padoka_report_summary` consolida vendas concluídas, pedidos, perdas, produção, estoque e produtos mais vendidos diretamente das tabelas `padoka_*`, evitando depender de totais calculados pelo navegador quando a camada for ativada.
- Relatórios financeiros ficam restritos a funções internas `owner` e `manager`; `anon`/`public` não recebem permissão de execução.
- Consultas são limitadas a no máximo 31 dias e agrupam timestamps usando `America/Sao_Paulo`, evitando que operações próximas da meia-noite caiam no dia errado por UTC.
- Vendas anuladas não entram no faturamento e a resposta separa/sinaliza pedidos e vendas ainda marcados como teste, preservando a identificação de dados provisórios enquanto preços/cardápio não forem oficiais.
- A migration não cria triggers, não toca `auth.users` e mantém isolamento por prefixo `padoka_`.
- Criado `tests/reporting-rpc-audit.mjs` para proteger permissões, intervalo, timezone, exclusão de vendas anuladas, identificação de dados provisórios e ausência de triggers globais.
- O workflow `.github/workflows/padoka-audit.yml` agora executa também a auditoria da RPC de relatórios.
- A migration 008 permanece apenas preparada e depende das camadas operacionais 003/004 no backend correto. O frontend de Relatórios ainda não foi ligado a essa RPC para não quebrar o publicado antes da aplicação e revisão do banco.
- Nenhuma query, migration ou advisor foi executado no projeto **InfoTech.io**.
