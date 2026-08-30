# PADOKA DA VILLA — Backup & Restore Runbook

## Princípio
Backup só é considerado confiável quando existe um procedimento de restauração testado. Este documento não contém senhas, connection strings nem chaves privadas.

## Dados críticos
Prioridade de recuperação:
1. padoka_orders / padoka_order_items / padoka_order_events
2. padoka_payment_* e referências do provedor
3. padoka_sales / padoka_sale_items
4. padoka_inventory / movements / losses / production
5. padoka_profiles / loyalty / notifications / privacy requests
6. padoka_staff_* / settings / feature flags
7. suppliers / purchase orders
8. telemetry / incidents (menos crítico)

## Frequência recomendada
- Produção comercial: backup automático diário no mínimo.
- Quando PITR estiver contratado/configurado, manter janela compatível com a operação.
- Antes de migration de alto risco: confirmar existência de backup recente.
- Exportações manuais nunca devem ser salvas no repositório Git.

## Exportação externa
Usar Supabase/Postgres tooling em máquina segura com credenciais fora do shell history sempre que possível. Exemplo conceitual:
```
pg_dump --format=custom --no-owner --no-acl <DATABASE_URL> > padoka-YYYYMMDD.dump
```
O arquivo deve ser criptografado e armazenado fora do mesmo provedor/conta de produção.

## Teste de restauração
Nunca testar restore destrutivo no banco de produção.
1. Criar ambiente temporário/staging autorizado.
2. Restaurar o backup.
3. Validar contagens e integridade referencial.
4. Validar um pedido completo, itens, eventos e pagamento.
5. Validar estoque e movimentos.
6. Validar login/staff sem expor credenciais.
7. Registrar data, backup usado, duração e resultado.
8. Destruir o ambiente temporário se não for mais necessário.

## Reconciliação financeira
Após restauração:
- consultar o provedor Pix real;
- reconciliar transaction id/txid/end_to_end_id, valor, order_id e status;
- nunca assumir pagamento com base apenas no banco restaurado;
- eventos tardios devem continuar idempotentes.

## RPO/RTO alvo inicial
- RPO alvo: até 24h enquanto só houver backup diário.
- Com PITR: reduzir conforme janela disponível.
- RTO alvo: documentar após primeiro restore cronometrado real; não inventar número antes disso.

## Bloqueios atuais
Um staging Supabase separado ou branch de banco pode ter custo. Só criar após confirmação explícita de custo e plano de migração.
