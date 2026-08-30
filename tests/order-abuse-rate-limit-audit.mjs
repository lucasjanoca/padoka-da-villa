import fs from 'node:fs';

const sql=fs.readFileSync('supabase/055_order_abuse_rate_limit.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(/padoka_private\.padoka_order_abuse_guard/i.test(sql),'Rate limit: guard privado ausente');
need(/before insert on public\.padoka_orders/i.test(sql),'Rate limit: trigger before insert ausente');
need(/request_id[\s\S]*return new/i.test(sql),'Rate limit: retry idempotente não é preservado');
need(/10 minutes/i.test(sql)&&/>= 10/.test(sql),'Rate limit: limite curto ausente');
need(/1 hour/i.test(sql)&&/>= 30/.test(sql),'Rate limit: limite horário ausente');
need(/status['"]?,?\s*429|status',429/i.test(sql),'Rate limit: resposta 429 ausente');
need(/revoke all on function padoka_private\.padoka_order_abuse_guard\(\) from public,anon,authenticated/i.test(sql),'Rate limit: função de trigger exposta');

if(!process.exitCode)console.log('Order abuse rate-limit audit: OK');
