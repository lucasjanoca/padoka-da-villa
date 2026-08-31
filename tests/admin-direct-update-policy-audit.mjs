import fs from 'node:fs';

const migration=fs.readFileSync('supabase/072_remove_stale_admin_update_policies.sql','utf8');
const adminRpc=fs.readFileSync('supabase/056_enterprise_admin_rpc_hardening.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

for(const table of ['padoka_feature_flags','padoka_incidents','padoka_privacy_requests']){
  need(migration,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} precisa manter RLS ativa`);
  need(migration,new RegExp(`revoke update on table public\\.${table} from public, anon, authenticated`,'i'),`${table} não pode recuperar UPDATE direto no navegador`);
}

for(const policy of ['padoka_feature_flags_admin_update','padoka_incidents_admin_update','padoka_privacy_owner_update']){
  need(migration,new RegExp(`drop policy if exists ${policy} on public\\.`,'i'),`policy direta ${policy} precisa permanecer removida`);
}
forbid(migration,/create policy[\s\S]*for update/i,'migration não deve recriar policy de UPDATE direto');

need(adminRpc,/create or replace function public\.padoka_admin_set_feature_flag\(/i,'feature flags devem continuar pela RPC administrativa');
need(adminRpc,/create or replace function public\.padoka_admin_resolve_incident\(/i,'incidentes devem continuar pela RPC administrativa');
need(adminRpc,/create or replace function public\.padoka_admin_update_privacy_request\(/i,'privacidade deve continuar pela RPC administrativa');
need(adminRpc,/security invoker/ig,'wrappers públicos devem continuar SECURITY INVOKER');

if(!process.exitCode)console.log('Admin direct update policy audit: OK');
