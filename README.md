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

### Checkout e pedidos
- `pagamento.html` cria pedidos reais via RPC `padoka_create_order`
- pedidos ficam vinculados ao `auth.uid()` do cliente
- pedidos de teste permanecem marcados como `is_test = true`
- `padoka_products` mantém o catálogo demonstrativo autoritativo no servidor
- nome e preço enviados pelo navegador não são confiados para calcular o pedido
- `acompanhamento.html` lê o pedido real e recebe atualizações pelo Supabase Realtime

### Sistema interno — `internal.html` / `pedidos.html`
- login real
- acesso somente para usuários presentes em `padoka_staff_users`
- fila de pedidos real
- mudança de status por etapas
- cliente comum não recebe permissão interna

Módulos ainda em evolução:
- Caixa / PDV
- leitor de código de barras
- estoque automático
- produção / fornadas
- perdas
- relatórios
- usuários/permissões avançadas
- auditoria operacional

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
