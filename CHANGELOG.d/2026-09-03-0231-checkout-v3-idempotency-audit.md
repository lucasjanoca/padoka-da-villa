# Checkout v3 — auditoria de idempotência alinhada

- Atualiza `tests/order-idempotency-audit.mjs` para auditar a arquitetura atual do checkout sem alterar o runtime.
- Mantém a base transacional/idempotente de `request_id` e passa a exigir explicitamente o caminho ativo `padoka_create_order_once_v3`, rejeitando chamadas às RPCs legadas v1/v2.
- Protege o pinning do backend correto da PADOKA (`https://yncspxfsvlqdnodlsosb.supabase.co`) e bloqueia regressões com `service_role`, `sb_secret_` ou dependência do InfoTech.io no checkout.
- Preserva o comportamento fail-closed do Pix automático: `AUTOMATIC_PIX_READY=false`, botão desabilitado para Pix não configurado e bloqueio antes da RPC; pagamento na retirada continua identificado separadamente.
- Reforça que itens, cupom e forma de pagamento seguem para validação server-authoritative na RPC v3, sem cálculo financeiro confiado ao navegador.
- Passa a auditar também `supabase/086_order_v3_private_acl.sql`, garantindo revogação de EXECUTE da implementação privada para `PUBLIC`/`anon` e disponibilidade apenas ao papel `authenticated` necessária ao wrapper público.
- Mantém as garantias de retry por identidade, confirmação de sessão antes/depois da RPC, invalidação de respostas obsoletas após troca de conta e descarte do namespace legado compartilhado.

Nenhuma migration, policy RLS, grant, trigger, Edge Function, credencial OAuth ou objeto não-`padoka_` foi modificado nesta alteração; a migration 086 é somente lida pela auditoria.
