import fs from 'node:fs';

const sql=fs.readFileSync('supabase/054_housekeeping_cron.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(/create extension if not exists pg_cron/i.test(sql),'Housekeeping: pg_cron não é habilitado');
need(/padoka_private\.padoka_housekeeping/i.test(sql),'Housekeeping: função privada ausente');
need(/padoka_client_events[\s\S]*90 days/i.test(sql),'Housekeeping: retenção de telemetria ausente');
need(/padoka_incidents[\s\S]*180 days/i.test(sql),'Housekeeping: retenção de incidentes ausente');
need(/padoka_push_subscriptions[\s\S]*180 days/i.test(sql),'Housekeeping: limpeza de push antigo ausente');
need(/cron\.schedule\([\s\S]*padoka-housekeeping-daily/i.test(sql),'Housekeeping: cron diário ausente');
for(const table of ['padoka_orders','padoka_order_items','padoka_profiles','padoka_sales','padoka_staff_audit','padoka_product_audit']){
  if(new RegExp('delete\\s+from\\s+(?:public\\.)?'+table,'i').test(sql))fail('Housekeeping: não deve apagar tabela de negócio '+table);
}

if(!process.exitCode)console.log('Housekeeping audit: OK');
