import fs from 'node:fs';

const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const read=p=>fs.readFileSync(p,'utf8');

for(const p of [
  'supabase/082_padoka_loyalty_program_complete.sql',
  'supabase/083_padoka_loyalty_security_tightening.sql',
  'supabase/087_padoka_loyalty_redemption_idempotency.sql',
  'club.html','club-admin.html','assets/club.js','assets/club-admin.js'
]){
  if(!fs.existsSync(p))fail('arquivo obrigatório ausente: '+p);
}

const m82=read('supabase/082_padoka_loyalty_program_complete.sql');
const m83=read('supabase/083_padoka_loyalty_security_tightening.sql');
const m87=read('supabase/087_padoka_loyalty_redemption_idempotency.sql');
const migrationChain=fs.readdirSync('supabase')
  .filter(p=>p.endsWith('.sql'))
  .sort()
  .map(p=>read('supabase/'+p))
  .join('\n');
const customer=read('assets/club.js');
const admin=read('assets/club-admin.js');

for(const token of [
  "new.status <> 'completed'",
  "new.payment_status not in ('paid','paid_late')",
  "new.is_test",
  "for update",
  "padoka_redeem_reward",
  "padoka_cancel_loyalty_redemption",
  "padoka_loyalty_admin_audit",
  "loyalty_require_manager",
  "coalesce(auth.jwt()->>'aal','aal1') <> 'aal2'",
  "padoka-loyalty-expire-redemptions"
]){
  if(!m82.toLowerCase().includes(token.toLowerCase()))fail('migração 082 não contém proteção: '+token);
}
if(!migrationChain.includes('padoka_loyalty_order_earn_uidx'))fail('cadeia de migrations não protege ganho duplicado por pedido');

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

for(const token of [
  'request_id uuid',
  'padoka_loyalty_redemptions_user_request_uidx',
  'padoka_rpc_private.redeem_reward_once',
  'public.padoka_redeem_reward_once',
  "set search_path=''",
  'padoka_private.padoka_loyalty_require_customer()',
  'request id conflict',
  'revoke execute on function public.padoka_redeem_reward(uuid)'
]){
  if(!m87.toLowerCase().includes(token.toLowerCase()))fail('migração 087 não contém proteção idempotente: '+token);
}

for(const table of ['padoka_loyalty_accounts','padoka_loyalty_ledger']){
  const pattern=new RegExp("revoke\\s+insert,\\s*update,\\s*delete[\\s\\S]{0,300}"+table.replace(/[.*+?^$()|[\]{}]/g,'\\$&'), 'i');
  if(!pattern.test(m82))fail('escrita direta não foi revogada para '+table);
}

if(!customer.includes("sb.rpc('padoka_redeem_reward_once'"))fail('cliente não usa RPC idempotente de resgate');
if(customer.includes("sb.rpc('padoka_redeem_reward'"))fail('cliente voltou a usar RPC de resgate sem idempotência');
if(!customer.includes("sb.rpc('padoka_cancel_loyalty_redemption'"))fail('cliente não usa RPC de cancelamento');
if(!customer.includes('p_request_id:attempt.requestId'))fail('cliente não envia request_id no resgate');
if(!customer.includes('crypto.randomUUID()'))fail('cliente não gera request_id seguro');
if(/from\(['"]padoka_loyalty_accounts['"]\)\.(insert|update|delete)/.test(customer))fail('frontend do cliente tenta gravar saldo diretamente');
if(/from\(['"]padoka_loyalty_ledger['"]\)\.(insert|update|delete)/.test(customer))fail('frontend do cliente tenta gravar extrato diretamente');

for(const token of [
  "EXPECTED_PROJECT_REF='yncspxfsvlqdnodlsosb'",
  'parsed.origin!==SUPABASE_URL',
  'createClient(SUPABASE_URL,publishableKey',
  'lifecycleEpoch',
  'clearCustomerState()',
  'ensureSession(expectedUserId,epoch)',
  'onAuthStateChange',
  'handleAuthChange(nextSession)',
  'currentIdentity(expectedUserId,epoch)'
]){
  if(!customer.includes(token))fail('cliente do PADOKA Club não contém proteção de lifecycle/backend: '+token);
}
if(customer.includes('createClient(cfg.url'))fail('PADOKA Club voltou a confiar diretamente em cfg.url');
if(!/user=session\.user;[\s\S]{0,300}onAuthStateChange/.test(customer))fail('listener de Auth não é instalado após resolver a identidade inicial');
if(!/if\(!user\)\{location\.replace\('conta\.html'\);return\}/.test(customer))fail('logout não fecha a tela do PADOKA Club');

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