# PADOKA DA VILLA — Pix e segurança de pagamento

## Estado atual

O checkout público está em modo **Pix automático obrigatório / fail-closed**.

- O fluxo manual não deve ser usado para novos pedidos públicos.
- Enquanto não houver um banco/provedor Pix real integrado, o botão de envio do pedido permanece bloqueado.
- O cliente recebe uma mensagem amigável informando que o pagamento automático está em configuração.
- Comprovante, imagem, PDF, texto ou confirmação manual **não libera pedido**.
- O endpoint `padoka-pix-checkout` continua fechado por padrão enquanto não houver um provedor oficial configurado.
- O código implantado da Edge Function está versionado no repositório e sincronizado com a produção.
- A função prefere `SUPABASE_SECRET_KEYS`/`sb_secret_...` no servidor e mantém `SUPABASE_SERVICE_ROLE_KEY` apenas como fallback legado; nenhuma dessas chaves é enviada ao navegador.
- Valores e itens continuam autoritativos no servidor; o navegador não define total pago, txid nem status `paid`.
- Clientes não podem alterar diretamente `padoka_orders`, equipe ou eventos de pagamento.

A estrutura de confirmação manual existente no banco pode permanecer preservada para histórico/auditoria e eventual contingência interna futura, mas **não é o fluxo público escolhido para produção** e não deve ser reativada apenas para contornar a ausência do provedor automático.

## Pix automático

A confirmação automática continua desativada até a integração real do provedor/banco. Para ativá-la com segurança ainda precisamos:

1. Definir o banco/provedor que receberá o Pix.
2. Confirmar suporte a API Pix/cobrança imediata, QR Code dinâmico, consulta por txid/ID e webhook.
3. Guardar Client ID, Client Secret, certificado ou segredo de webhook somente em Secrets do backend.
4. Implementar o adapter do provedor em Edge Function sensível, mantendo JWT onde aplicável e CORS restrito ao host necessário.
5. Implementar endpoint de webhook autenticado conforme a documentação oficial do provedor, sem confiar em campos enviados pelo navegador.
6. Conferir no backend o valor pago contra o total calculado pelo servidor e vincular a cobrança ao pedido correto.
7. Deduplicar eventos, cobranças e pagamentos por identificador confiável do provedor.
8. Testar pagamento aprovado, expirado, valor incorreto, evento duplicado, pagamento tardio e devolução.
9. Consultar os Security Advisors quando houver mudança em banco/RLS e revisar `auth.uid()`, ACL e `search_path` de qualquer `SECURITY DEFINER` envolvida.
10. Só então marcar a integração como configurada e liberar o checkout público.

## Regra antifraude

A regra operacional atual é:

> **Sem confirmação automática autenticada do banco/provedor, o checkout não cria um novo pedido público e nenhum comprovante enviado pelo cliente é aceito como autorização.**

## Privacidade e secrets

- Nunca colocar Client Secret, certificado privado, segredo de webhook, `service_role` ou outra chave administrativa em HTML/JavaScript público.
- Secrets financeiros devem existir somente no backend do projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) enquanto esse for o backend ativo. Se a PADOKA migrar para um projeto Supabase exclusivo, os secrets devem ser recriados/rotacionados no novo projeto, nunca copiados para o frontend.
- O projeto InfoTech.io não deve ser usado ou alterado para a integração PADOKA.
- Objetos exclusivos continuam isolados por prefixo `padoka_`.
