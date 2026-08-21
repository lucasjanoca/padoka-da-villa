# 2026-08-21 14:25 — Gestão segura do catálogo preparada

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `gestao.html`, `assets/catalog.js`, a navegação interna e as migrations mais recentes antes da alteração.
- Confirmado que a cadeia preparada chegou à migration 016 e que a tela Produtos ainda não possuía uma RPC administrativa própria para editar o catálogo autoritativo.
- Criada `supabase/017_product_catalog_management.sql`, destinada exclusivamente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- A migration cria `padoka_list_products_admin` e `padoka_save_product`, restritas a `owner/manager`, com validação de ID, nome, categoria, preço, flags e ordem.
- Escrita direta `INSERT/UPDATE/DELETE` em `padoka_products` fica explicitamente revogada para `anon/authenticated`; a leitura pública continua preservada para os itens permitidos pela RLS existente.
- A operação usa `UPSERT` por ID em vez de apagar produtos, preservando referências históricas de pedidos/vendas.
- Criado `assets/product-management.js`, carregado apenas na Gestão interna. O módulo só aparece para `owner/manager` e somente quando as RPCs da migration 017 existirem; antes disso a interface publicada continua como está.
- A interface permite criar/editar nome, categoria, preço, ordem, ativação e marca `is_demo`. A retirada da marca provisória exige confirmação explícita para evitar transformar dados demonstrativos em oficiais por engano.
- Produto novo sem metadados visuais próprios não recebe foto/unidade inventadas; o frontend já possui fallback visual para a logo PADOKA.
- Criado `tests/product-management-audit.mjs` e ampliado `tests/migration-chain-audit.mjs` para a cadeia contínua 001→017.
- O workflow `.github/workflows/padoka-audit.yml` passou a validar sintaxe e executar a auditoria específica de gestão de produtos.
- `DEPLOYMENT.md` atualizado com a migration 017 e o gate de ativação/testes antes de remover qualquer compatibilidade antiga.
- A tentativa de clonar o repositório para executar os testes localmente falhou por DNS (`Could not resolve host: github.com`). O GitHub ainda não expôs status/checks para o commit final durante esta execução, então a CI não foi marcada como aprovada sem evidência.
- Confirmado pelo conector Supabase que a única conexão disponível continua sendo **InfoTech.io** (`rgngqumqzylthdiazvfu`). Nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- Como a migration 017 ficou apenas preparada no GitHub e não foi aplicada no backend PADOKA, não havia advisors do projeto correto para executar nesta rodada.
