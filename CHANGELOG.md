# CHANGELOG — PADOKA DA VILLA

## 2026-08-19 21:xx — PDV protegido por permissão interna
- `pdv.html` deixou de abrir diretamente para qualquer visitante que conheça a URL.
- Antes de exibir Caixa/PDV, a página agora valida sessão real do Supabase e exige registro ativo do usuário em `padoka_staff_users`.
- Usuário sem sessão ou sem permissão interna vê somente uma tela de acesso restrito e retorno ao painel administrativo.
- O catálogo visual e a leitura por código interno continuam disponíveis apenas depois da autorização.
- Removida a finalização de venda demonstrativa que simulava sucesso sem persistência; a tela agora informa claramente que a finalização real depende da função transacional de vendas/estoque no Supabase correto.
- Nenhuma mudança de banco foi feita nesta etapa porque o conector Supabase disponível na sessão expôs somente o projeto InfoTech.io; ele não foi alterado.

## 2026-08-19 14:30 — Catálogo autoritativo e checkout endurecido
- Criada e aplicada no projeto **Sites De Clientes!** a tabela `padoka_products`, isolada por prefixo e com RLS.
- Os 16 produtos atuais foram registrados como `is_demo = true`; continuam demonstrativos até aprovação da PADOKA.
- A RPC `padoka_create_order` deixou de confiar em nome e preço enviados pelo navegador. O servidor agora resolve produto e preço pelo `product_id` ativo em `padoka_products` e calcula o total no banco.
- Adicionadas validações de quantidade, itens desconhecidos/inativos, dados de retirada e limite de linhas antes de criar o pedido.
- O checkout `pagamento.html` passou a carregar o catálogo ativo do Supabase, detectar carrinho desatualizado e enviar ao RPC somente `product_id` + quantidade.
- `pagamento.html` informa explicitamente que os valores exibidos foram conferidos no servidor, mantendo Pix/cobrança desativados.
- Registrada a migration em `supabase/002_server_authoritative_test_catalog.sql`.
- `README.md` atualizado para refletir o estado real: Auth/pedidos/Realtime no Supabase e módulos ainda pendentes.
- Advisor de segurança executado após a migration; nenhum novo alerta de segurança da PADOKA foi criado. Os avisos restantes são preexistentes de outros sistemas do projeto compartilhado e não foram alterados.

## 2026-08-19 13:35 — Contas, onboarding e andamento de pedidos
- `conta.html` agora tem fluxo mobile-first de entrada com opções de Google, e-mail/senha e código/link, mantendo essas integrações claramente em modo de preparação até o Auth real ser configurado.
- Primeiro acesso passa por onboarding: nome editável, e-mail, telefone/WhatsApp obrigatório, aniversário opcional, consentimento de privacidade obrigatório e marketing opcional.
- Endereço não é exigido sem modalidade de entrega e CPF não é solicitado por padrão.
- A conta do cliente passou a listar somente pedidos vinculados ao seu `customerId` local e permite abrir o acompanhamento de cada pedido.
- `pagamento.html` exige um perfil de cliente para a demonstração e cria pedidos vinculados à conta, com cliente, retirada, total, histórico e estado inicial `received`.
- Criada `pedidos.html`, prévia interna que mostra a fila e permite evoluir o pedido por **Recebido → Visto → Confirmado → Em preparo → Pronto → Concluído**, além de cancelamento.
- Abrir um pedido novo no painel interno marca a visualização, preenchendo `seenAt` e permitindo ao cliente saber se a padaria já viu o pedido.
- `acompanhamento.html` foi conectado aos pedidos locais e ganhou linha do tempo completa com recebido, visto, confirmado, preparo, pronto e concluído.
- `internal.html` agora aponta para a prévia de Pedidos sem liberar os demais módulos internos e mantém o login operacional real bloqueado.
- `index.html` passou a usar a identidade visual da PADOKA no cabeçalho e manteve o cardápio em grade de 2 produtos por linha no celular.
- Adicionado `assets/logo-padoka.svg`, reconstruído fielmente a partir da referência de logo enviada, para substituir o símbolo genérico no protótipo.
- Adicionado `supabase/001_customer_accounts_orders.sql` com estrutura futura de perfis, funcionários, pedidos, itens, eventos de status, RLS e políticas para clientes/staff. O arquivo está preparado, mas **não foi aplicado ao projeto InfoTech.io**.
- O fluxo conectado nesta etapa continua local ao navegador para demonstração. A sincronização real entre celular do cliente e painel da padaria depende da conexão do projeto Supabase correto da PADOKA e da configuração do Google OAuth.

## 2026-08-19 13:29 — Pedido demonstrativo conectado à conta e acompanhamento
- `pagamento.html` passou a revisar os dados de retirada salvos pelo carrinho antes de continuar.
- Adicionado botão seguro para criar **pedido de demonstração local**, sem Pix, cobrança, QR Code ou transação real.
- Cada pedido demonstrativo recebe código `PDK-...`, inicia em **Recebido** e é salvo em `padoka_orders_v1`.
- O pedido é associado ao perfil local da conta quando houver um cliente demonstrativo cadastrado.
- O novo pedido fica disponível em **Minha Conta** e pode ser aberto diretamente em `acompanhamento.html?code=...`.
- Estrutura do pedido já inclui histórico e campos para evoluir pelos estados: Recebido, Visto, Confirmado, Em preparo, Pronto e Concluído.
- O carrinho local é limpo após criar a simulação, evitando duplicação acidental ao testar novamente.
- A página continua deixando explícito que o Pix real ainda depende da chave/configuração oficial e que nenhum pagamento verdadeiro é efetuado.
- Logo PADOKA usada no cabeçalho; nenhum módulo interno foi exposto ao cliente público.

## 2026-08-19 13:07 — Redesign mobile-first do site público
- `index.html` redesenhado com foco principal em celular e navegação semelhante a aplicativo.
- Cardápio agora usa grade de **2 produtos lado a lado no celular**, evitando uma lista de um item por linha.
- Adicionados 16 produtos demonstrativos distribuídos entre Pães, Salgados, Lanches, Doces e Bebidas.
- Incluídos valores demonstrativos em reais e carrinho com cálculo de subtotal/total.
- Adicionadas fotografias reais ilustrativas de alimentos e padaria, substituindo os antigos blocos/emoji de produto.
- Criados cards de destaque para Padoca Noturna e café da manhã, busca, filtros horizontais por categoria e navegação inferior mobile.
- Carrinho foi redesenhado como bottom sheet no celular e painel lateral em telas maiores.
- Fluxo de retirada continua funcional e agora encaminha a simulação validada para `pagamento.html`.
- Mantido aviso explícito de que fotos e preços são apenas de demonstração até a PADOKA fornecer catálogo, preços e imagens oficiais.
- Área pública continua sem qualquer navegação para Caixa, Estoque, Produção ou Administração.

## 2026-08-19 12:31 — Base protegida do painel interno
- Criada `internal.html` como primeira base responsiva da área operacional.
- O painel interno continua fora da navegação pública do cliente e recebeu `noindex,nofollow`.
- Preparada interface de login, sem criar usuário, senha padrão ou credencial demonstrativa.
- O envio do formulário permanece bloqueado até existir autenticação real e permissões por cargo.
- Adicionada visão somente informativa dos módulos planejados: Pedidos, Caixa/PDV, Estoque, Produção, Perdas e Relatórios.
- Nenhum módulo operacional, dado interno, venda, estoque ou permissão foi liberado nesta etapa.
- Revisão feita após a criação: página autônoma, responsiva e sem dependências externas; o único retorno disponível leva ao site público.

## 2026-08-19 11:31 — Área do cliente demonstrativa
- Criada `conta.html` como primeira base responsiva da futura área do cliente.
- Adicionadas seções de perfil local, favoritos, histórico e repetição de pedido, sem criar autenticação ou dados reais.
- O perfil aceita somente um apelido demonstrativo e o mantém no `localStorage` deste navegador.
- Favoritos, histórico e repetição permanecem explicitamente bloqueados até existir catálogo/backend reais, evitando simular pedidos inexistentes.
- A página não contém links ou acesso a Caixa, Estoque, Produção ou Administração.
- Revisão feita após a criação: página autônoma, responsiva, sem dependências externas e com retorno explícito ao cardápio público.

## 2026-08-19 10:26 — Acompanhamento demonstrativo
- Criada `acompanhamento.html` com consulta de pedido por código em modo totalmente demonstrativo.
- Adicionado código fictício claramente identificado como **DEMO-0001** apenas para testar a interface.
- Fluxo visual mostra as etapas previstas: pedido recebido, em preparação, pronto para retirada e concluído.
- Códigos diferentes do demonstrativo exibem mensagem de não encontrado, sem consultar qualquer backend.
- `pagamento.html` agora oferece acesso explícito ao acompanhamento demonstrativo sem indicar pagamento real.
- O botão de gerar Pix continua bloqueado até existir configuração oficial.
- Nenhum pedido, pagamento ou status real é criado, e nenhum módulo interno foi exposto ao cliente público.
- Revisão feita após o commit: página criada e links entre `index.html`, `pagamento.html` e `acompanhamento.html` confirmados no código.

## 2026-08-19 09:29 — Pix demonstrativo seguro
- Criada `pagamento.html` como etapa isolada e responsiva de preparação do pagamento.
- Pix mantido como forma inicial prevista, sem inventar chave, QR Code ou código copia e cola.
- Botão de geração permanece bloqueado até existir configuração oficial.
- Tela explica as etapas futuras: revisão, geração do Pix, confirmação e liberação do acompanhamento.
- Nenhuma cobrança, transação ou confirmação falsa de pagamento é realizada.
- A página permite retornar ao cardápio e não expõe nenhum módulo interno.
- Integração direta do agendamento para esta tela fica para uma rodada posterior, evitando alterar de forma arriscada o fluxo atual antes de validar a base.

## 2026-08-19 08:31 — Retirada agendada demonstrativa
- O botão **Continuar pedido** do carrinho agora abre uma etapa real de agendamento, sem criar compra ou cobrança.
- Adicionadas duas modalidades demonstrativas: **Retirar na padaria** e **Padoca Noturna**.
- Retirada na loja respeita a janela provisória de **05:00 às 18:00**.
- Padoca Noturna usa uma janela demonstrativa em torno das **02:00**, mantendo os detalhes finais claramente pendentes de confirmação.
- Adicionados campos de data, horário e nome para retirada, com validação antes de salvar.
- A escolha fica salva localmente no navegador apenas como simulação.
- Fluxo responsivo em modal, com retorno ao carrinho, fechamento por `Esc` e clique fora.
- Nenhum pedido é enviado e nenhum pagamento é iniciado; o site continua seguro para demonstração pública.
- Nenhum módulo interno foi exposto na navegação pública.

## 2026-08-19 07:27 — Carrinho funcional
- O botão **Carrinho** agora abre um painel lateral responsivo no site público.
- O carrinho passou a armazenar itens por produto, e não apenas uma contagem total.
- Adicionados controles para aumentar, diminuir e remover itens.
- A quantidade total permanece persistida localmente no navegador.
- O total do pedido é calculado automaticamente quando houver preços reais; enquanto os produtos estiverem sem preço confirmado, o sistema mostra **Preço a confirmar**.
- O botão **Continuar pedido** fica desativado com carrinho vazio e, no modo demonstrativo atual, ainda não inicia pagamento nem pedido real.
- Adicionados fechamento por botão, clique fora e tecla `Esc`, além de rótulos de acessibilidade nos controles.
- Nenhum módulo interno foi exposto ao cliente público.

## 2026-08-19 06:26 — Base pública funcional
- Criado `index.html` executável para substituir o estado de documentação apenas.
- Adicionado layout responsivo para desktop e celular.
- Adicionado banner principal da campanha **Padoca Noturna**, com texto de pedido antecipado e entrega especial por volta das 02:00.
- Horário público configurado provisoriamente como **05:00 às 18:00**.
- Endereço público da unidade incluído.
- Cardápio demonstrativo com categorias, pesquisa e filtro.
- Carrinho demonstrativo persistido localmente no navegador.
- Produtos e preços permanecem marcados como demonstrativos até os dados reais serem informados.
- Nenhum módulo interno (Caixa, Estoque, Produção ou Administração) foi exposto na navegação pública.

## v0.2
- Base inicial do sistema criada.
- Site público separado do sistema interno.
- PDV, estoque, produção, perdas e Supabase preparados.
