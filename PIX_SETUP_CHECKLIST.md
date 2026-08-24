# PADOKA DA VILLA — Checklist para ativar Pix automático

A fundação de segurança já está instalada, porém o pagamento permanece **desativado** até o banco/provedor ser definido e testado.

## Informações que precisamos da PADOKA

1. **Banco ou provedor que receberá o Pix** (nome exato).
2. Confirmar se a conta usada para recebimento é **conta PJ**.
3. Confirmar se esse banco/provedor oferece:
   - API Pix/Cobrança imediata (Cob / CobV, conforme o provedor);
   - QR Code Pix dinâmico;
   - Pix Copia e Cola;
   - consulta de cobrança por txid/ID;
   - webhook/notificação de pagamento;
   - API de devolução/estorno, se disponível.
4. Informar qual é o **ambiente de testes/sandbox** oferecido pelo provedor, se houver.
5. Definir a regra para Pix recebido depois dos 5 minutos. Padrão já preparado: **revisão manual**; o pedido não é liberado automaticamente.
6. Definir quais perfis internos poderão revisar pagamento tardio/devolução. Padrão: **owner/manager**.
7. Confirmar o **domínio definitivo** usado pela PADOKA para configurar URLs de retorno/webhook, quando o provedor exigir.

## Credenciais técnicas que serão necessárias depois

O tipo exato depende do banco/provedor. Pode incluir Client ID, Client Secret, token OAuth, certificado mTLS, chave privada/certificado Pix ou segredo de webhook.

**Não colocar essas credenciais no HTML, JavaScript, GitHub ou mensagens públicas.** Elas devem ser cadastradas diretamente como Secrets no backend/Supabase.

Nunca precisamos de senha do internet banking, senha do cartão, PIN ou código de acesso pessoal da conta bancária.

## Regras de segurança já preparadas

- Expiração padrão do Pix: **300 segundos (5 minutos)**.
- Cliente não possui permissão de banco para marcar pedido como pago.
- O fluxo antigo de criação direta de pedido foi bloqueado; checkout usa RPC idempotente e preços do servidor.
- Valor da cobrança será comparado com o total calculado no servidor.
- Cada cobrança terá identificadores exclusivos do provedor/txid.
- Eventos repetidos serão deduplicados para evitar confirmação dupla.
- Pagamento após expiração fica como `paid_late` e exige revisão; não libera produção automaticamente.
- Quando o Pix automático estiver ativo, pedido com pagamento pendente/expirado **não aparece na fila operacional da equipe e não entra nas contagens do painel**.
- Pedido com Pix obrigatório não pode avançar em nenhuma etapa operacional enquanto o status de pagamento não for `paid`.
- Funções que alteram pagamento para `paid` aceitam somente `service_role`, nunca o navegador do cliente.
- Registro de eventos de pagamento preparado para auditoria.
- Endpoint `padoka-pix-checkout` já existe e falha fechado enquanto o provedor não estiver configurado.

## Antes de ativar em produção

1. Integrar o adaptador oficial do banco/provedor.
2. Implementar validação oficial do webhook/assinatura exigida pelo provedor.
3. Consultar a cobrança no provedor antes de confirmar quando a documentação permitir/recomendar.
4. Testar pagamento aprovado, expirado, valor incorreto, webhook duplicado, pagamento tardio e devolução.
5. Só depois mudar `provider_configured=true` e `enabled=true`.
