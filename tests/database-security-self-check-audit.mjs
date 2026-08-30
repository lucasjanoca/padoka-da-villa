import fs from 'node:fs';

const sql=fs.readFileSync('supabase/057_security_self_check.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(/padoka_private\.padoka_security_self_check\(\)/i.test(sql),'Self-check privado ausente');
need(/security definer/i.test(sql),'Self-check deve executar com privilégio interno');
need(/revoke all on function padoka_private\.padoka_security_self_check\(\) from public,anon,authenticated/i.test(sql),'Self-check exposto a clientes');
need(/relname like 'padoka_%'[\s\S]*not c\.relrowsecurity/i.test(sql),'Self-check não valida RLS de todas as tabelas Padoka');
need(/public_security_definer_exposure/i.test(sql),'Self-check não detecta SECURITY DEFINER público');
need(/has_schema_privilege\('anon','public','CREATE'\)/i.test(sql),'Self-check não valida CREATE de anon');
need(/has_schema_privilege\('authenticated','public','CREATE'\)/i.test(sql),'Self-check não valida CREATE de authenticated');
need(/vapid_private_key/i.test(sql),'Self-check não detecta chave VAPID privada no schema público');
need(/push_subscriptions_client_read/i.test(sql),'Self-check não valida leitura de Push subscriptions');
need(/push_server_secret_rpc_exposed/i.test(sql),'Self-check não valida RPC de segredos Push');
need(/private_rpc_schema_anon_usage/i.test(sql),'Self-check não valida exposição do schema privado');
need(/enterprise_admin_rpc_anon_execute/i.test(sql),'Self-check não valida RPCs administrativas anônimas');
need(/sensitive_direct_update_restored/i.test(sql),'Self-check não valida UPDATE direto sensível');
need(/PADOKA security self-check failed/i.test(sql),'Self-check não registra incidente crítico');
need(/on conflict \(fingerprint\) do update/i.test(sql),'Incidente do self-check deve ser idempotente');
need(/padoka-security-self-check-hourly/i.test(sql),'Cron horário do self-check ausente');
need(/'7 \* \* \* \*'/i.test(sql),'Cron do self-check deve rodar de hora em hora');

for(const table of ['padoka_orders','padoka_order_items','padoka_profiles','padoka_sales','padoka_staff_audit','padoka_product_audit']){
  if(new RegExp('delete\\s+from\\s+(?:public\\.)?'+table,'i').test(sql))fail('Self-check não deve apagar dados de negócio: '+table);
}

if(!process.exitCode)console.log('Database security self-check audit: OK');
