# PADOKA DA VILLA — Sistema completo v0.2

Projeto em evolução de site de pedidos para sistema operacional completo de padaria.

## Estado atual

O repositório já possui uma base pública funcional, responsiva e mobile-first. A autenticação de clientes, pedidos, acompanhamento e fila interna já usam o projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`). O projeto **InfoTech.io não é usado pela PADOKA**.

O login Google já está implementado no site, mas depende da configuração externa do Google OAuth Client ID/Secret e redirects no Google Cloud antes de abrir a seleção real de conta.

## Separação correta

### Site do cliente — `index.html`
O cliente vê somente:
- identidade e informações públicas
- cardápio e categorias
- pesquisa
- carrinho
- retirada agendada
- checkout
- acompanhamento do pedido
- conta do cliente
- histórico

**Não existe link público de Caixa, Estoque, Produção ou Administração.**

### Conta do cliente — `conta.html`
- Supabase Auth real
- Google como opção principal
- e-mail/senha e link por e-mail
- onboarding exclusivo PADOKA em `padoka_profiles`
- nome editável, WhatsApp obrigatório, aniversário e marketing opcionais
- nenhum trigger global transforma usuários de outros sistemas em clientes PADOKA

### Checkout, catálogo e pedidos
- `pagamento.html` cria pedidos reais via RPC `padoka_create_order`
- pedidos ficam vinculados ao `auth.uid()` do cliente
- pedidos de teste permanecem marcados como `is_test = true`
- `padoka_products` mantém o catálogo demonstrativo autoritativo no servidor
- o cardápio público também consulta `padoka_products`: produtos ativos, nomes, categorias e preços vêm do servidor; `assets/catalog.js` mantém somente metadados visuais como foto, descrição, unidade e tag
- se o catálogo do servidor estiver indisponível, o site não reaproveita preço estático como se fosse atual; o cardápio informa indisponibilidade temporária
- enquanto houver `is_demo = true`, o cardápio identifica de forma discreta que catálogo e valores ainda são provisórios
- nome e preço enviados pelo navegador não são confiados para calcular o pedido
- `acompanhamento.html` lê o pedido real e recebe atualizações pelo Supabase Realtime

### Sistema interno — `internal.html` / `pedidos.html`
- login real
- acesso somente para usuários presentes em `padoka_staff_users`
- fila de pedidos real
- mudança de status por etapas
- cliente comum não recebe permissão interna

A migration `supabase/005_order_status_transition_rpc.sql` prepara a próxima proteção do fluxo interno: a RPC `padoka_update_order_status` valida a sessão de staff, bloqueia saltos de etapa e impede reabertura de pedidos concluídos/cancelados. Depois que essa migration for aplicada no backend correto, o `UPDATE` direto em `padoka_orders` é revogado para `authenticated` e as mudanças passam exclusivamente pela RPC. O frontend `pedidos.html` já tenta essa RPC primeiro e usa o `UPDATE` direto somente como fallback temporário quando a função ainda não existe no schema publicado. Esse fallback deve ser removido depois da aplicação e revisão da migration 005.

Módulos ainda em evolução:
- Caixa / PDV
- leitor de código de barras
- estoque automático
- produção / fornadas
- perdas
- relatórios
- usuários/permissões avançadas
- auditoria operacional

### Próxima camada operacional preparada

A migration `supabase/003_operational_inventory_production_losses.sql` prepara, **sem ainda alterar o ambiente publicado**, a substituição dos estados locais de Gestão por objetos reais e isolados no Supabase correto:
- `padoka_inventory`
- `padoka_inventory_movements`
- `padoka_production_plans`
- `padoka_losses`
- RPC `padoka_adjust_inventory`
- RPC `padoka_register_loss`

A migration inclui RLS, permissões por perfil interno, histórico de movimentação e proteção contra estoque negativo. Ela **não deve ser aplicada no InfoTech.io**.

O frontend da Gestão já possui uma camada de sincronização condicional em `assets/operational-sync.js`: depois que a migration 003 existir no backend correto, usuários internos autorizados passam a ler estoque, produção e perdas do Supabase, ajustes de saldo usam `padoka_adjust_inventory`, perdas usam `padoka_register_loss` e as telas recebem atualizações por Realtime. Enquanto os objetos ainda não existirem no backend publicado, a página preserva o comportamento local anterior sem quebrar a interface. Essa compatibilidade temporária deve ser removida somente depois da migration 003 ser aplicada, validada e os dados locais necessários serem migrados de forma explícita.

A migration seguinte, `supabase/004_pdv_sales_transaction.sql`, prepara a venda de balcão real do PDV sem ativá-la antes da camada de estoque existir. Ela cria `padoka_sales`, `padoka_sale_items` e a RPC `padoka_create_sale`, que valida função interna, aceita somente produtos ativos, recalcula preços no servidor, bloqueia venda sem estoque suficiente e registra a baixa de estoque e o histórico de movimentações na mesma transação. A venda continua marcada como teste quando qualquer item do catálogo ainda tiver `is_demo = true`.

O frontend `pdv.html` detecta de forma segura se a camada 004 existe: enquanto `padoka_sales` ainda não estiver disponível, **Finalizar venda** permanece desativado e nenhuma venda local é simulada. Depois de 003/004 serem aplicadas e revisadas no backend correto, o mesmo PDV habilita a finalização via `padoka_create_sale`, envia apenas `product_id`, quantidade e forma de pagamento, recebe o código da venda do servidor e deixa a própria RPC responsável pela baixa transacional do estoque. Erros de estoque insuficiente, estoque não inicializado e permissão são tratados sem simular sucesso. Enquanto houver itens `is_demo = true`, a interface deixa claro que a venda registrada continua sendo de teste.

A migration `supabase/006_production_completion_transaction.sql` prepara o registro real de produção. A RPC `padoka_record_production` atualiza o plano, adiciona a quantidade produzida ao estoque, registra o lote e cria o movimento de estoque na mesma transação. Cada tentativa usa `request_id` idempotente: um retry com o mesmo plano e quantidade devolve o lote já criado, enquanto reutilizar o mesmo identificador com dados diferentes é rejeitado. O frontend `assets/production-completion.js` só assume o controle quando essa camada existe e preserva a mesma tentativa em respostas ambíguas para evitar dupla entrada de estoque.

A migration `supabase/007_loss_idempotency.sql` aplica a mesma proteção ao registro de perdas. Ela adiciona `request_id` opcional/único em `padoka_losses` e a RPC `padoka_register_loss_once`, que faz lock do estoque, valida saldo, baixa a quantidade e grava perda + movimentação na mesma transação. `assets/loss-registration.js` é ativado somente quando a coluna `request_id` existe; em falha de rede ele guarda a operação pendente em `sessionStorage` e força o retry com os mesmos dados, reduzindo risco de descontar o estoque duas vezes. Enquanto 007 não estiver aplicada, o comportamento anterior da migration 003 permanece como fallback.

## Banco Supabase

Todos os objetos exclusivos do projeto usam prefixo `padoka_` para não colidir com outros clientes existentes no mesmo Supabase.

Principais objetos já ativos:
- `padoka_profiles`
- `padoka_staff_users`
- `padoka_products`
- `padoka_orders`
- `padoka_order_items`
- `padoka_order_events`

Todas essas tabelas usam Row Level Security.

## Dados públicos confirmados

- Endereço: Av. 1º de Maio, 959 - Vila Pedroso, Cerquilho - SP, 18528-344.
- Horário provisório informado: 05:00 às 18:00.
- Campanha prevista: **Padoca Noturna**, com detalhes finais ainda editáveis.

## Dados que continuam demonstrativos

Não considerar como dados oficiais até confirmação da padaria:
- cardápio
- preços
- códigos de produto
- chave Pix
- regras definitivas de retirada / Padoca Noturna

## Rodar localmente

```bash
python -m http.server 8000
```

Cliente: `http://localhost:8000/index.html`

## Ainda depende da padaria

Os seguintes dados não devem ser inventados:
- cardápio e preços reais
- códigos reais
- chave Pix
- funcionários reais
- CNPJ / IE e dados fiscais
- sistema fiscal atual
- modelo de impressora
- modelo de balança
- modelo do leitor
- regras definitivas de retirada e da Padoca Noturna

## Fiscal

A emissão fiscal não foi ativada. O futuro PDV poderá ser testado operacionalmente, mas não deve substituir o emissor fiscal atual até a definição da integração NFC-e adequada.
