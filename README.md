# PADOKA DA VILLA — Sistema completo v0.2

Pacote criado para evoluir de um site de pedidos para um sistema operacional completo de padaria.

## Estado atual

O repositório já possui uma base pública funcional em `index.html`, responsiva e executável diretamente no navegador. Ela contém banner de destaque, informações públicas, busca de cardápio, categorias e carrinho demonstrativo.

## Separação correta

### Site do cliente — `index.html`
O cliente vê somente:
- início / identidade PADOKA DA VILLA
- banner de campanhas e destaques
- cardápio e categorias
- pesquisa
- carrinho
- pedido antecipado para retirada
- Pix como forma inicial de pagamento
- acompanhamento por código
- conta do cliente
- favoritos
- histórico e repetição de pedido
- fidelidade preparada
- endereço e informações públicas

**Não existe link de Caixa, Estoque, Produção ou Administração no site público.**

### Dados públicos confirmados
- Endereço: Av. 1º de Maio, 959 - Vila Pedroso, Cerquilho - SP, 18528-344.
- Horário provisório informado: 05:00 às 18:00.
- Campanha prevista: **Padoca Noturna**, com pedidos feitos antecipadamente e entrega especial por volta das 02:00 em frente à empresa. Os detalhes finais da campanha continuam editáveis.

### Sistema interno — `internal.html`
Planejado/protegido por login e cargos:
- Dono/Admin
- Gerente
- Caixa
- Atendente
- Produção
- Estoque

Módulos planejados:
- dashboard
- pedidos por etapa
- Caixa / PDV
- leitor de código de barras
- abertura e fechamento de caixa
- estoque automático
- ajustes de inventário
- produção / fornadas
- perdas e desperdícios
- produtos / preços / códigos
- relatórios
- usuários e permissões
- auditoria
- configurações

### Programa desktop
`desktop-pdv/` está previsto para conter o projeto Electron para empacotar o Caixa/PDV como aplicativo Windows. Também poderá haver um launcher para abrir o PDV em modo aplicativo no Microsoft Edge.

## Banco Supabase

A estrutura prevista usará prefixo `padoka_` para poder ficar temporariamente dentro de um projeto Supabase compartilhado de clientes sem colidir com outros sistemas.

Estrutura prevista:
- catálogo
- pedidos
- clientes
- favoritos
- fidelidade
- estoque / ledger
- vendas
- itens de venda
- pagamentos
- sessões de caixa
- produção
- perdas
- usuários internos
- auditoria
- configurações públicas/privadas
- RLS por cargo
- RPCs transacionais
- bucket de imagens

## Modo atual

O site público funciona em modo demonstrativo local, sem depender de backend. Produtos e preços são exemplos claramente marcados como demonstrativos.

## Rodar a demonstração

Abra `index.html` diretamente no navegador ou execute:

```bash
python -m http.server 8000
```

Cliente: `http://localhost:8000/index.html`

## O que ainda depende da padaria

Os seguintes dados não devem ser inventados:
- cardápio real
- preços reais
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
