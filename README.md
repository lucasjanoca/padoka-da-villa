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
- PADOKA Club com pontos, recompensas, campanhas e resgates;
- experiência otimizada para celular.

### Operação interna
- fila e acompanhamento de pedidos;
- controle de status;
- gestão de produtos;
- estoque e movimentações;
- produção e perdas;
- base de PDV integrada ao estoque;
- perfis e permissões para equipe;
- gestão segura do PADOKA Club, com auditoria e validação de resgates.

## 🛠️ Tecnologias

`HTML5` · `CSS3` · `JavaScript` · `Supabase` · `GitHub Pages`

## 🔐 Segurança e arquitetura

O projeto segue uma separação entre interface pública e funções administrativas. Autenticação, Row Level Security (RLS), permissões por perfil e validações no banco são usadas para evitar que regras críticas dependam apenas do navegador.

Princípios adotados:
- nenhuma chave administrativa deve ficar no frontend;
- operações sensíveis validam identidade e permissão no backend;
- preços, estoque e totais não confiam apenas em valores enviados pelo navegador;
- saldo de pontos não pode ser gravado pelo cliente: ganhos, resgates, estornos e ajustes são transacionais no banco;
- RPCs públicas sensíveis usam wrappers `SECURITY INVOKER`, com implementação privilegiada fora do schema público;
- `owner` e `manager` usam MFA/AAL2 para mutações administrativas sensíveis;
- o GitHub Pages publica somente a aplicação web, excluindo migrations, testes e documentação técnica;
- auditorias automáticas executam todos os `tests/*.mjs` em cada alteração do `main` e em pull requests.

## 🚧 Estado atual

O projeto continua em validação e possui dados demonstrativos. Antes do uso comercial definitivo ainda precisam ser confirmados dados como catálogo, preços, códigos de barras, regras operacionais, meios de pagamento, equipamentos e configuração fiscal.

O PDV pode ser evoluído e testado operacionalmente, mas não deve substituir um emissor fiscal oficial sem a integração adequada para o cenário real da empresa.

## 📁 Estrutura

- `index.html` — experiência pública do cliente;
- `conta.html` — conta e autenticação;
- `club.html` — fidelidade, recompensas e resgates do cliente;
- `club-admin.html` — validação e gestão interna do PADOKA Club;
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

A camada de hardening técnico foi aplicada e o Security Advisor da PADOKA está sem avisos pendentes. O que falta para operação comercial depende de dados/serviços reais:

1. Substituir catálogo, preços e códigos demonstrativos pelos dados aprovados pela padaria.
2. Fazer teste físico de ponta a ponta no caixa, celular/tablet e leitor/câmera.
3. Escolher e integrar um banco/provedor Pix real com cobrança dinâmica e webhook autenticado.
4. Definir a integração fiscal adequada antes de tratar o PDV web como emissor fiscal.
5. Avaliar a migração futura para um projeto Supabase exclusivo da PADOKA para reduzir ainda mais o raio de impacto do backend compartilhado.

---

**Projeto desenvolvido e mantido como solução web da InfoTech.io.**
