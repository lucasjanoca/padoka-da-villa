# 🥐 PADOKA DA VILLA — Plataforma Web

> Projeto em evolução para transformar a presença digital da padaria em uma plataforma integrada de pedidos e operação.

A **PADOKA DA VILLA** reúne uma experiência mobile-first para clientes e uma base operacional preparada para pedidos, administração, estoque, produção e PDV. O objetivo é manter os módulos conectados, com regras importantes validadas no backend e separação clara entre a área pública e a operação interna.

## ✨ Escopo do projeto

### Experiência do cliente
- cardápio responsivo;
- pesquisa e categorias;
- carrinho e checkout;
- retirada agendada;
- autenticação e conta do cliente;
- acompanhamento e histórico de pedidos;
- experiência otimizada para celular.

### Operação interna
- fila e acompanhamento de pedidos;
- controle de status;
- gestão de produtos;
- estoque e movimentações;
- produção e perdas;
- base de PDV integrada ao estoque;
- perfis e permissões para equipe.

## 🛠️ Tecnologias

`HTML5` · `CSS3` · `JavaScript` · `Supabase` · `GitHub Pages`

## 🔐 Segurança e arquitetura

O projeto segue uma separação entre interface pública e funções administrativas. Autenticação, Row Level Security (RLS), permissões por perfil e validações no banco são usadas para evitar que regras críticas dependam apenas do navegador.

Princípios adotados:
- nenhuma chave administrativa deve ficar no frontend;
- operações sensíveis devem validar a identidade e a permissão do usuário no backend;
- preços, estoque e totais não devem confiar apenas em valores enviados pelo navegador;
- alterações devem ser testadas na branch `dev` antes de chegar ao `main`;
- auditorias automáticas verificam estrutura e possíveis segredos antes da publicação.

## 🚧 Estado atual

O projeto continua em validação e possui dados demonstrativos. Antes do uso comercial definitivo ainda precisam ser confirmados dados como catálogo, preços, códigos de barras, regras operacionais, meios de pagamento, equipamentos e configuração fiscal.

O PDV pode ser evoluído e testado operacionalmente, mas não deve substituir um emissor fiscal oficial sem a integração adequada para o cenário real da empresa.

## 📁 Estrutura

- `index.html` — experiência pública do cliente;
- `conta.html` — conta e autenticação;
- `pagamento.html` — checkout;
- `acompanhamento.html` — pedidos do cliente;
- `internal.html` / `pedidos.html` — operação interna;
- `supabase/` — migrations e configuração de banco;
- `.github/workflows/` — validações e automações do repositório;
- `docs/` — documentação complementar.

## 🧪 Desenvolvimento

Para servir o projeto localmente:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000/`.

## 📌 Próximas prioridades

1. Validar o fluxo completo de pedido com dados reais aprovados.
2. Testar PDV, estoque, produção e perdas de ponta a ponta.
3. Finalizar regras de pagamento e operação.
4. Definir integração fiscal e equipamentos antes do uso comercial.
5. Continuar auditorando segurança, permissões e desempenho do banco.

---

**Projeto desenvolvido e mantido como solução web da InfoTech.io.**
