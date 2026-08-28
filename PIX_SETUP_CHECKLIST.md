# PADOKA DA VILLA — Pix e segurança de pagamento

## Estado atual

O site está com **Pix manual protegido** habilitado para testes.

- QR Code Pix estático e Pix Copia e Cola são gerados localmente no navegador.
- O valor do pedido é incluído no BR Code.
- Novos pedidos Pix ficam com pagamento `pending`.
- Pedido Pix não pago não pode avançar de etapa; o bloqueio existe no banco de dados, não apenas na interface.
- Somente perfis internos `owner` ou `manager` podem confirmar o Pix manual.
- A confirmação manual deve ser feita somente depois de conferir o crédito no **próprio aplicativo/extrato do banco**.
- A confirmação exige uma referência/ID/E2E da transação e impede reutilizar a mesma referência em outro pedido.
- Comprovante, imagem, PDF ou texto enviado pelo cliente **não é prova de pagamento** e não deve ser usado para liberar o pedido.
- Clientes não podem alterar diretamente `padoka_orders`, equipe ou eventos de pagamento.
- Eventos de confirmação ficam registrados para auditoria.

## Pix automático

A confirmação **automática** continua desativada. O provedor/banco ainda não foi integrado.

O endpoint `padoka-pix-checkout` permanece fechado por padrão enquanto não houver um provedor oficial configurado. Para ativar Pix automático em produção ainda precisamos:

1. Definir o banco/provedor que receberá o Pix.
2. Confirmar suporte a API Pix/cobrança imediata, QR Code dinâmico, consulta por txid/ID e webhook.
3. Guardar Client ID, Client Secret, certificado ou segredo de webhook somente em Secrets do backend.
4. Validar assinatura/webhook conforme a documentação do provedor.
5. Conferir no backend o valor pago contra o total calculado pelo servidor.
6. Deduplicar eventos e pagamentos.
7. Testar pagamento aprovado, expirado, valor incorreto, evento duplicado, pagamento tardio e devolução.
8. Só então definir `provider_configured=true`.

## Regra antifraude

Enquanto o Pix for manual, a regra operacional é simples:

> **Nunca liberar um pedido por comprovante enviado pelo cliente. Conferir a entrada no próprio banco e usar o ID/E2E exibido pelo banco para confirmar no painel.**

## Privacidade da chave

A chave Pix usada no QR Code precisa ser enviada ao pagador e, portanto, fica visível no frontend. Como a chave de teste atual é um número de telefone, esse número também fica público no site/repositório. Para produção, prefira uma chave aleatória ou uma chave empresarial quando possível.
