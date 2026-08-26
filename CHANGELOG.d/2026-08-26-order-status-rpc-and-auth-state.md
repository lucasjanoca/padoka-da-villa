# Pedidos e autenticação alinhados ao backend real

- Confirmado no projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que `padoka_update_order_status` está ativa e que `authenticated` não possui mais `UPDATE` direto em `padoka_orders`.
- `pedidos.html` deixou de ter fallback para escrita direta: avanço e cancelamento passam exclusivamente pela RPC server-authoritative, preservando validação de staff e sequência de status no servidor.
- A fila interna agora traduz o bloqueio `payment confirmation required` para uma mensagem operacional clara, sem contornar o gate de pagamento do servidor.
- A auditoria estática foi atualizada para impedir a volta de `UPDATE` direto em `padoka_orders` e exigir que a mudança de status continue exclusivamente pela RPC.
- Confirmada a presença das RPCs operacionais `padoka_create_sale`, `padoka_record_production` e `padoka_register_loss_once`, alinhando a documentação com o backend publicado.
- Confirmadas identidades Google reais no Supabase Auth; `AUTH_STATUS.md` não trata mais o provider como desativado e continua exigindo `prompt=select_account` no frontend.
- `README.md` foi atualizado para refletir PDV, estoque, produção e perdas já presentes no backend correto, mantendo dados demonstrativos claramente identificados e sem tocar no projeto InfoTech.io.
- Revisão pós-commit corrigiu o escape de aspas da fila interna antes de seguir para novas mudanças.