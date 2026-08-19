# PADOKA DA VILLA — Sistema completo v0.2

Pacote criado para evoluir de um site de pedidos para um sistema operacional completo de padaria.

## Separação correta

### Site do cliente — `index.html`
O cliente vê somente:
- início / identidade PADOKA DA VILLA
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

### Sistema interno — `internal.html`
Protegido por login e cargos:
- Dono/Admin
- Gerente
- Caixa
- Atendente
- Produção
- Estoque

Módulos:
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
`desktop-pdv/` contém o projeto Electron para empacotar o Caixa/PDV como aplicativo Windows. Também há um launcher PowerShell para abrir o PDV em modo aplicativo no Microsoft Edge.

## Banco Supabase

A pasta `supabase/migrations/` contém a estrutura completa com prefixo `padoka_`, criada justamente para poder ficar temporariamente dentro de um projeto Supabase compartilhado de clientes sem colidir com outros sistemas.

Inclui:
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

`js/config.js` está em `mode: 'demo'`, então o sistema funciona localmente com dados demonstrativos usando o navegador.

Para ligar ao Supabase, copie os valores de `js/config.supabase.example.js` para `js/config.js`, troque para `mode: 'supabase'`, informe URL e chave pública do projeto e aplique as migrations na ordem.

## Rodar a demonstração

Windows: execute `START_DEMO.bat`.

Ou:

```bash
python -m http.server 8000
```

- Cliente: `http://localhost:8000/index.html`
- Interno: `http://localhost:8000/internal.html`

### Login demo interno

E-mail: `demo@padoka.local`
Senha: `demo123`

No modo demo é possível escolher o cargo para validar permissões e telas.

## Código de barras de teste

`7890000000011` → Pão francês demonstrativo.

## O que ainda depende da padaria

O código está preparado, mas os seguintes dados não devem ser inventados:
- cardápio real
- preços reais
- códigos reais
- chave Pix
- horário de funcionamento
- funcionários reais
- CNPJ / IE e dados fiscais
- sistema fiscal atual
- modelo de impressora
- modelo de balança
- modelo do leitor
- regras definitivas de retirada

## Fiscal

A emissão fiscal não foi ativada. O PDV pode ser testado operacionalmente, mas não deve substituir o emissor fiscal atual até a definição da integração NFC-e adequada.
