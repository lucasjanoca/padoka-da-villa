import fs from 'node:fs';

const sql=fs.readFileSync('supabase/056_enterprise_admin_rpc_hardening.sql','utf8');
const html=fs.readFileSync('enterprise.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

for(const fn of ['admin_resolve_incident','admin_set_feature_flag','admin_update_privacy_request']){
  need(new RegExp('padoka_rpc_private\\.'+fn,'i').test(sql),'RPC privada ausente: '+fn);
}
need(/security definer/i.test(sql),'Funções privadas devem elevar privilégio somente internamente');
need(/create or replace function public\.padoka_admin_resolve_incident[\s\S]*security invoker/i.test(sql),'Wrapper público de incidente deve ser SECURITY INVOKER');
need(/create or replace function public\.padoka_admin_set_feature_flag[\s\S]*security invoker/i.test(sql),'Wrapper público de feature flag deve ser SECURITY INVOKER');
need(/create or replace function public\.padoka_admin_update_privacy_request[\s\S]*security invoker/i.test(sql),'Wrapper público de privacidade deve ser SECURITY INVOKER');
need(/revoke update\(enabled,description,config\).*padoka_feature_flags/i.test(sql),'UPDATE direto de feature flags não foi revogado');
need(/revoke update\(status\).*padoka_incidents/i.test(sql),'UPDATE direto de incidentes não foi revogado');
need(/revoke update\(status,resolution_note\).*padoka_privacy_requests/i.test(sql),'UPDATE direto de privacidade não foi revogado');
need(/auth\.jwt\(\)->>'aal'[\s\S]*aal2/i.test(sql),'RPCs privadas devem exigir AAL2');
need(/staff_has_role\(array\['owner','manager'\]\)/i.test(sql),'RPCs administrativas devem validar papel');
need(/staff_has_role\(array\['owner'\]\)/i.test(sql),'Privacidade deve ficar restrita ao owner');

need(html.includes("sb.rpc('padoka_admin_resolve_incident'"),'Enterprise deve resolver incidente via RPC');
need(html.includes("sb.rpc('padoka_admin_set_feature_flag'"),'Enterprise deve alterar flag via RPC');
need(html.includes("sb.rpc('padoka_admin_update_privacy_request'"),'Enterprise deve tratar privacidade via RPC');
need(!/from\('padoka_incidents'\)\.update/.test(html),'Enterprise não deve atualizar incidentes diretamente');
need(!/from\('padoka_feature_flags'\)\.update/.test(html),'Enterprise não deve atualizar flags diretamente');
need(!/from\('padoka_privacy_requests'\)\.update/.test(html),'Enterprise não deve atualizar privacidade diretamente');

if(!process.exitCode)console.log('Enterprise admin RPC hardening audit: OK');
