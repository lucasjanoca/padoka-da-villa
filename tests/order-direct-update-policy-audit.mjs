import fs from 'node:fs';

const migration=fs.readFileSync('supabase/067_remove_stale_order_update_policy.sql','utf8');
const queue=fs.readFileSync('pedidos.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

need(migration,/alter table public\.padoka_orders enable row level security/i,'padoka_orders precisa manter RLS ativa');
need(migration,/revoke update on public\.padoka_orders from authenticated/i,'authenticated não pode recuperar UPDATE direto em pedidos');
need(migration,/revoke update on public\.padoka_orders from anon/i,'anon não pode atualizar pedidos');
need(migration,/drop policy if exists "padoka_staff_update_orders" on public\.padoka_orders/i,'policy legada de UPDATE precisa permanecer removida');
forbid(migration,/create policy[\s\S]*for update/i,'migration não deve recriar UPDATE direto em pedidos');

need(queue,/sb\.rpc\('padoka_update_order_status'/i,'fila interna deve atualizar status exclusivamente pela RPC autorizada');
forbid(queue,/from\('padoka_orders'\)\.update\(/i,'fila interna não pode voltar a UPDATE direto em padoka_orders');

if(!process.exitCode)console.log('Order direct update policy audit: OK');
