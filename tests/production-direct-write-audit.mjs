import fs from 'node:fs';

const migration=fs.readFileSync('supabase/058_remove_direct_production_writes.sql','utf8');
const files=['gestao.html','assets/operational-sync.js','assets/production-completion.js'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

if(!/revoke insert\(product_id,plan_date,planned_quantity,produced_quantity,status,note\)[\s\S]*padoka_production_plans from authenticated/i.test(migration))
  fail('Produção: INSERT direto não foi revogado');
if(!/revoke update\(planned_quantity,produced_quantity,status,note\)[\s\S]*padoka_production_plans from authenticated/i.test(migration))
  fail('Produção: UPDATE direto não foi revogado');
if(!/drop policy if exists "padoka production insert plans"/i.test(migration))
  fail('Produção: policy de INSERT direto ainda existe na cadeia');
if(!/drop policy if exists "padoka production update plans"/i.test(migration))
  fail('Produção: policy de UPDATE direto ainda existe na cadeia');

for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  if(/\.from\(['"]padoka_production_plans['"]\)[\s\S]{0,500}?\.(?:insert|update|upsert|delete)\(/i.test(source))
    fail(file+': escrita direta em padoka_production_plans detectada');
}

const ops=fs.readFileSync('assets/operational-sync.js','utf8');
const completion=fs.readFileSync('assets/production-completion.js','utf8');
if(!ops.includes("rpc('padoka_upsert_production_plan'"))fail('Produção: planejamento não usa RPC');
if(!completion.includes("rpc('padoka_record_production'"))fail('Produção: registro não usa RPC');

if(!process.exitCode)console.log('Production direct-write removal audit: OK');
