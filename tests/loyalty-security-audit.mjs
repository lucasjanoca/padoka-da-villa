import fs from 'node:fs';

const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const read=p=>fs.readFileSync(p,'utf8');

for(const p of [
  'supabase/082_padoka_loyalty_program_complete.sql',
  'supabase/083_padoka_loyalty_security_tightening.sql',
  'club.html','club-admin.html','assets/club.js','assets/club-admin.js'
]){
  if(!fs.existsSync(p))fail('arquivo obrigatório ausente: '+p);
}

const m82=read('supabase/082_padoka_loyalty_program_complete.sql');
const m83=read('supabase/083_padoka_loyalty_security_tightening.sql');
const customer=read('assets/club.js');
const admin=read('assets/club-admin.js');

for(const token of [
  "new.status <> 'completed'",
  "new.payment_status not in ('paid','paid_late')",
  "new.is_test",
  "for update",
  "padoka_loyalty_order_earn_uidx",
  "padoka_redeem_reward",
  "padoka_cancel_loyalty_redemption",
  "padoka_loyalty_admin_audit",
  "loyalty_require_manager",
  "coalesce(auth.jwt()->>'aal','aal1') <> 'aal2'",
  "padoka-loyalty-expire-redemptions"
]){
  if(!m82.toLowerCase().includes(token.toLowerCase()))fail('migração 082 não contém proteção: '+token);
}

for(const token of [
  'padoka_loyalty_security_check',
  'loyalty_direct_write_exposed',
  'loyalty_rpc_anon_execute',
  'loyalty_private_helper_exposed',
  'loyalty_award_trigger_missing',
  'loyalty_internal_ids_exposed',
  'padoka-loyalty-security-check-hourly'
]){
  if(!m83.includes(token))fail('migração 083 não contém verificação: '+token);
}

for(const table of ['padoka_loyalty_accounts','padoka_loyalty_ledger']){
  const pattern=new RegExp("revoke\\s+insert,\\s*update,\\s*delete[\\s\\S]{0,300}"+table.replace(/[.*+?^$()|[\]{}]/g,'\\$&'), 'i');
  if(!pattern.test(m82))fail('escrita direta não foi revogada para '+table);
}

if(!customer.includes("sb.rpc('padoka_redeem_reward'"))fail('cliente não usa RPC de resgate');
if(!customer.includes("sb.rpc('padoka_cancel_loyalty_redemption'"))fail('cliente não usa RPC de cancelamento');
if(/from\(['"]padoka_loyalty_accounts['"]\)\.(insert|update|delete)/.test(customer))fail('frontend do cliente tenta gravar saldo diretamente');
if(/from\(['"]padoka_loyalty_ledger['"]\)\.(insert|update|delete)/.test(customer))fail('frontend do cliente tenta gravar extrato diretamente');

for(const token of [
  "sb.rpc('padoka_admin_lookup_loyalty_code'",
  "sb.rpc('padoka_admin_process_loyalty_code'",
  "sb.rpc('padoka_admin_adjust_loyalty'",
  "sb.rpc('padoka_admin_upsert_loyalty_reward'",
  "sb.rpc('padoka_admin_upsert_loyalty_campaign'",
  "sb.rpc('padoka_admin_update_loyalty_settings'",
  "getAuthenticatorAssuranceLevel"
]){
  if(!admin.includes(token))fail('painel admin não usa proteção esperada: '+token);
}

if(!process.exitCode)console.log('PADOKA Club loyalty security audit: OK');
