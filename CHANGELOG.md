# CHANGELOG — PADOKA DA VILLA

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
- Nenhum módulo interno foi exposto ao cliente público.

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
