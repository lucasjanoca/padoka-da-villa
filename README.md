# PADOKA DA VILLA — Sistema completo v0.3

Projeto em evolução de site de pedidos para sistema operacional completo de padaria.

## Estado atual

A base pública é funcional, responsiva e mobile-first. Autenticação de clientes, catálogo, checkout, acompanhamento, fila interna e partes da operação usam o projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`). O projeto **InfoTech.io não é usado pela PADOKA**.

O login Google está ativo e já possui identidades reais no Supabase Auth. O frontend mantém `prompt=select_account`, portanto o cliente recebe o seletor de conta Google em vez de reutilizar silenciosamente uma sessão anterior.

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
- e-mail/senha e link por e-mail como alternativas
- onboarding exclusivo PADOKA em `padoka_profiles`
- nome editável e pré-preenchido quando disponível
- WhatsApp e consentimento de privacidade obrigatórios
- aniversário e marketing opcionais
- endereço somente quando houver fluxo de entrega
- CPF não é obrigatório por padrão
- nenhum trigger global transforma usuários de outros sistemas em clientes PADOKA
- navegação mobile persistente para Início, Cardápio, Pedidos e Conta

### Checkout, catálogo e pedidos
- `pagamento.html` cria pedidos reais via RPC `padoka_create_order`
- pedidos ficam vinculados ao `auth.uid()` do cliente
- pedidos continuam marcados como `is_test = true` enquanto catálogo/preços/Pix oficiais não forem aprovados
- `padoka_products` é a fonte autoritativa de produtos ativos, nomes, categorias e preços
- `assets/catalog.js` mantém somente metadados visuais
- se o catálogo do servidor estiver indisponível, o site não reutiliza preço estático como se fosse atual
- nome, preço e total enviados pelo navegador não são tratados como autoritativos
- `acompanhamento.html` lista automaticamente apenas pedidos do cliente autenticado, mais recentes primeiro, com progresso e Realtime

### Sistema interno — `internal.html` / `pedidos.html`
- login real
- acesso somente para usuários ativos em `padoka_staff_users`
- fila de pedidos real
- transições de status passam exclusivamente pela RPC `padoka_update_order_status`
- `authenticated` não possui mais `UPDATE` direto em `padoka_orders`
- a RPC valida sessão de staff, sequência de etapas e bloqueia reabertura de pedidos concluídos/cancelados
- cliente comum não recebe permissão interna

## Camada operacional ativa no backend correto

As migrations preparadas anteriormente já estão presentes no projeto **Sites De Clientes!** e mantêm todos os objetos sob prefixo `padoka_`.

### Estoque / produção / perdas
Objetos ativos incluem:
- `padoka_inventory`
- `padoka_inventory_movements`
- `padoka_production_plans`
- `padoka_losses`
- RPC `padoka_adjust_inventory`
- RPC `padoka_register_loss`
- RPC `padoka_record_production`
- RPC `padoka_register_loss_once`

A conclusão de produção e o registro idempotente de perdas usam `request_id` para reduzir risco de duplicação em retry de rede.

### PDV
Objetos ativos incluem:
- `padoka_sales`
- `padoka_sale_items`
- RPC `padoka_create_sale`

A venda de balcão é server-authoritative: o navegador envia identificadores/quantidades e forma de pagamento; o servidor valida produto ativo, preço, estoque, autorização e registra a baixa de estoque na mesma transação. Enquanto qualquer item continuar demonstrativo, a venda permanece identificada como teste.

## Banco Supabase

Todos os objetos exclusivos do projeto usam prefixo `padoka_` para não colidir com outros clientes existentes no mesmo projeto compartilhado.

Principais objetos:
- `padoka_profiles`
- `padoka_staff_users`
- `padoka_products`
- `padoka_orders`
- `padoka_order_items`
- `padoka_order_events`
- `padoka_inventory`
- `padoka_inventory_movements`
- `padoka_production_plans`
- `padoka_losses`
- `padoka_sales`
- `padoka_sale_items`

Não criar trigger global em `auth.users`. Cliente PADOKA só ganha `padoka_profiles` ao entrar na aplicação e concluir onboarding; equipe interna continua separada em `padoka_staff_users`.

## Dados públicos confirmados

- Endereço: Av. 1º de Maio, 959 - Vila Pedroso, Cerquilho - SP, 18528-344.
- Horário provisório informado: 05:00 às 18:00.
- Campanha prevista: **Padoca Noturna**, com detalhes finais ainda editáveis.

## Dados que continuam demonstrativos

Não considerar como dados oficiais até confirmação da padaria:
- cardápio
- preços
- fotos de produtos
- códigos de produto / EAN
- chave Pix
- regras definitivas de retirada / Padoca Noturna
- funcionários e permissões finais

As bebidas devem continuar com imagens distintas e coerentes entre si: expresso, cappuccino, suco e água não devem reutilizar uma única foto de café.

## Próximas prioridades

1. Revisar a ativação real do PDV ponta a ponta com usuário interno autorizado e dados de teste.
2. Remover compatibilidades locais restantes de Gestão somente quando a camada correspondente estiver validada no Supabase.
3. Validar produção e perdas idempotentes em cenários de retry.
4. Evoluir relatórios operacionais sem expor dados internos ao site público.
5. Manter auditoria contínua de RLS, ACLs e funções `SECURITY DEFINER`.

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

A emissão fiscal não foi ativada. O PDV pode ser validado operacionalmente em modo de teste, mas não deve substituir o emissor fiscal atual até a definição da integração NFC-e adequada.
