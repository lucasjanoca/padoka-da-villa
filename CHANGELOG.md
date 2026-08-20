# CHANGELOG — PADOKA DA VILLA

## 2026-08-19 22:28 — Gestão preparada para sincronização real sem quebrar o publicado
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- O conector Supabase disponível continua expondo somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- Criado `assets/operational-sync.js`, carregado somente em `gestao.html`, para detectar de forma segura a existência da camada operacional preparada pela migration 003.
- Quando `padoka_inventory`, `padoka_production_plans` e `padoka_losses` existirem no backend correto, a Gestão passa a carregar os dados reais do Supabase em vez de depender dos estados locais.
- Ajustes de saldo usam a RPC `padoka_adjust_inventory`, registrando delta e histórico no servidor; alterações de código/EAN e estoque mínimo respeitam as permissões/RLS da migration 003.
- Registro de perdas usa `padoka_register_loss`, garantindo baixa de estoque e histórico na mesma operação; mensagens de erro tratam falta de permissão e estoque insuficiente sem simular sucesso.
- Planejamento do dia usa `padoka_production_plans` com `upsert` pela chave `plan_date, product_id`, preservando os campos de auditoria controlados pelo trigger do banco.
- Adicionada atualização Realtime para estoque, produção e perdas quando a camada operacional estiver ativa.
- Se as tabelas da migration 003 ainda não existirem, a sincronização simplesmente não assume controle e o comportamento local anterior permanece funcionando; isso evita quebrar a versão publicada antes da aplicação segura da migration.
- Nenhum acesso de Caixa, Estoque, Produção ou Administração foi exposto ao cliente; a sincronização só inicia depois da validação de sessão e `padoka_staff_users` já feita pela Gestão.
- `README.md` atualizado para documentar a ativação condicional e a futura remoção do fallback local após aplicação, revisão e migração explícita dos dados necessários.

## 2026-08-19 21:26 — Auditoria operacional endurecida antes da aplicação
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisadas as migrations 003/004 antes de qualquer nova integração.
- Confirmado novamente pelo conector Supabase que a sessão disponível expõe somente **InfoTech.io**; nenhuma migration, query, advisor ou alteração foi executada nesse projeto.
- `supabase/003_operational_inventory_production_losses.sql` foi endurecida antes da futura aplicação no backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- A RPC `padoka_adjust_inventory` agora aceita apenas origens manuais (`manual`/`adjustment`) e rejeita `reference_id` fornecido pelo navegador, impedindo que um ajuste manual seja falsamente registrado como venda, perda ou produção.
- Ajustes de estoque agora exigem produto ativo e motivo entre 2 e 120 caracteres; o registro de perda também limita observação e exige produto ativo.
- Planos de produção ganharam trigger próprio para carimbar `created_by`, `updated_by`, `created_at` e `updated_at` pelo banco, preservando os campos originais de auditoria em atualizações.
- As permissões da tabela `padoka_production_plans` foram reduzidas para colunas operacionais específicas; usuários autenticados não recebem permissão direta para adulterar campos de auditoria.
- Foram removidas concessões amplas anteriores antes de reaplicar privilégios mínimos em estoque, movimentações, produção e perdas.
- Nenhum trigger global em `auth.users` foi criado; todos os objetos continuam isolados por prefixo `padoka_`.
- Como a migration 003 continua apenas preparada no repositório e não aplicada, os advisors do backend PADOKA não puderam ser executados nesta rodada.

## 2026-08-19 20:26 — Fila interna de pedidos reforçada
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes de continuar, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem qualquer alteração no projeto InfoTech.io.
- `pedidos.html` continua exigindo sessão real e registro ativo em `padoka_staff_users`; nenhum link ou acesso interno foi exposto ao cliente público.
- A renderização da fila agora sanitiza código, nome, telefone, status e demais textos vindos do banco antes de inseri-los no HTML, reduzindo risco de conteúdo inesperado na interface interna.
- O botão **Ver detalhes** passou a carregar os itens reais do pedido sob demanda a partir de `padoka_order_items`, exibindo quantidade e valor por item sem carregar toda a base antecipadamente.
- Pedidos concluídos ou cancelados deixam de oferecer a ação de cancelamento; cancelamentos ativos agora pedem confirmação explícita antes de alterar o status visível ao cliente.
- Atualizações de status bloqueiam temporariamente os botões enquanto a gravação está em andamento e mostram feedback amigável de sucesso/erro, evitando cliques duplicados.
- Adicionado filtro de pedidos cancelados e mantida a ordem mais recente primeiro, com atualização em tempo real da fila.
- Nenhuma migration, RLS ou objeto de banco foi alterado nesta execução; portanto não houve advisor de segurança a executar no backend PADOKA. As migrations 003 e 004 continuam preparadas e ainda não aplicadas.
- Confirmado em `assets/catalog.js` que expresso, cappuccino, suco e água seguem usando imagens distintas e coerentes entre si.

## 2026-08-19 19:27 — Transação segura do PDV preparada
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html` e a migration operacional 003 antes de continuar.
- Confirmado novamente que o conector Supabase disponível nesta execução expõe apenas **InfoTech.io**; nenhum objeto, migration ou advisor foi executado nesse projeto.
- Criada `supabase/004_pdv_sales_transaction.sql`, destinada exclusivamente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e dependente da migration 003.
- A migration prepara `padoka_sales`, `padoka_sale_items` e a RPC `padoka_create_sale`, todos isolados por prefixo `padoka_` e sem trigger global em `auth.users`.
- A RPC restringe criação de venda a `owner`, `manager`, `cashier` e `attendant`, valida itens e forma de pagamento, resolve produtos/preços ativos no servidor e não confia em total enviado pelo navegador.
- A baixa de estoque é preparada dentro da mesma transação da venda, com lock das linhas de `padoka_inventory`, rejeição por estoque insuficiente e registro correspondente em `padoka_inventory_movements` com origem `sale`.
- Vendas permanecem com `is_test = true` quando qualquer produto do catálogo ainda estiver marcado como demonstrativo no catálogo, evitando transformar dados provisórios em operação oficial silenciosamente.
- RLS de leitura foi preparada somente para staff autenticado; `anon` não recebe acesso às tabelas nem à RPC.
- `pdv.html` **não foi conectado ainda** à RPC para não quebrar a versão publicada antes da aplicação/revisão das migrations 003 e 004 no Supabase correto.
- Como nenhuma alteração de banco foi aplicada no backend PADOKA nesta execução, os advisors de segurança do projeto correto não puderam ser executados nesta rodada.
- `README.md` atualizado com a dependência e o plano seguro de ativação do PDV transacional.

## 2026-08-19 18:28 — Camada operacional segura preparada
- Revisados `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual da Gestão antes de alterar o projeto.
- Confirmado que `gestao.html` ainda mantém estoque, produção, perdas e configurações em `localStorage`; esses dados não foram migrados automaticamente para evitar perda ou inconsistência.
- Criada `supabase/003_operational_inventory_production_losses.sql` como próxima migration do backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- A migration prepara `padoka_inventory`, `padoka_inventory_movements`, `padoka_production_plans` e `padoka_losses`, todos isolados pelo prefixo `padoka_`.
- Adicionadas RPCs `padoka_adjust_inventory` e `padoka_register_loss` com validação de perfil interno, histórico de movimentação e bloqueio de estoque negativo.
- Preparadas RLS e permissões separando leitura da equipe e operações de estoque/produção por função; nenhum acesso público/anon foi concedido.
- Nenhum trigger global foi criado em `auth.users`; os únicos triggers novos são restritos às próprias tabelas operacionais PADOKA.
- A migration foi revisada no repositório, mas **não foi aplicada** porque o conector Supabase disponível nesta execução continua expondo somente o projeto InfoTech.io. O InfoTech.io permaneceu intocado.
- Como não houve alteração efetiva de banco/RLS no backend PADOKA nesta execução, não foi possível/necessário rodar advisors de segurança do projeto correto.
- `README.md` atualizado para registrar a migration preparada e impedir que a interface seja conectada a tabelas ainda inexistentes no ambiente publicado.

## 2026-08-19 17:28 — Detalhes reais no acompanhamento do cliente
- `acompanhamento.html` ganhou detalhes expansíveis por pedido, mantendo a página mobile-first e sem campo de pesquisa.
- Os itens agora são lidos de `padoka_order_items` e agrupados pelo `order_id`; a proteção continua dependendo do RLS já existente, que permite ao cliente ler somente itens ligados aos próprios pedidos.
- A linha do tempo deixou de depender de colunas específicas por etapa e passou a usar o histórico real de `padoka_order_events`, reduzindo risco de quebra por divergência de schema e preservando os horários reais de cada mudança de status.
- O estado `ready` ganhou destaque principal **“Pode vir buscar!”**, sem alterar a sequência Recebido → Visto → Confirmado → Preparo → Pronto → Retirado.
- Os detalhes exibem itens, valores calculados a partir dos itens persistidos, modalidade de retirada, data/horário e código do pedido.
- Foi adicionada sanitização de texto antes de inserir nomes/códigos vindos do banco no HTML.
- A atualização em tempo real foi preservada para `padoka_orders` e também passou a observar `padoka_order_events`; uma falha secundária ao carregar itens/histórico não impede o cliente de acompanhar o pedido.
- Nenhuma mudança de banco/RLS foi aplicada nesta etapa. O conector Supabase disponível nesta execução expôs somente o projeto **InfoTech.io**, portanto ele não foi alterado; o backend correto da PADOKA continua sendo `yncspxfsvlqdnodlsosb`.

## 2026-08-19 16:29 — Gestão operacional protegida por staff
- `gestao.html` agora valida sessão real do Supabase antes de exibir Produtos, Estoque, Produção, Perdas, Relatórios e Configurações.
- O acesso exige registro ativo do usuário em `padoka_staff_users`; cliente comum ou visitante direto vê somente uma tela de acesso restrito.
- A validação usa exclusivamente a configuração pública do backend PADOKA (`yncspxfsvlqdnodlsosb`) via `padoka-public-config` e não altera o projeto InfoTech.io.
- A navegação interna e os módulos só são renderizados depois da autorização, mantendo Caixa/Estoque/Produção/Admin fora do alcance público.
- Nenhuma migration foi aplicada nesta etapa; os dados locais já existentes dos módulos em evolução foram preservados para evitar perda ou quebra enquanto a persistência transacional real ainda não foi migrada.

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