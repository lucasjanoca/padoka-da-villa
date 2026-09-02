import fs from 'node:fs';

const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const migrationPath='supabase/085_padoka_loyalty_customer_boundary.sql';

if(!fs.existsSync(migrationPath)){
  fail('migração de isolamento do PADOKA Club ausente');
}else{
  const sql=fs.readFileSync(migrationPath,'utf8');
  const lower=sql.toLowerCase();

  for(const token of [
    'padoka_private.padoka_loyalty_require_customer()',
    "set search_path=''",
    'revoke all on function padoka_private.padoka_loyalty_require_customer()',
    'from public.padoka_profiles p',
    'padoka_rpc_private.redeem_reward',
    'padoka_rpc_private.cancel_redemption',
    'padoka_rpc_private.admin_loyalty_customers',
    'padoka_rpc_private.admin_adjust_loyalty'
  ]){
    if(!lower.includes(token.toLowerCase()))fail('proteção ausente: '+token);
  }

  for(const policy of [
    'padoka_loyalty_account_own_read',
    'padoka_loyalty_ledger_own_read',
    'padoka_loyalty_settings_read',
    'padoka_loyalty_rewards_read',
    'padoka_loyalty_campaigns_read',
    'padoka_loyalty_redemptions_read'
  ]){
    const start=lower.indexOf('create policy '+policy);
    if(start<0){fail('policy ausente: '+policy);continue;}
    const block=lower.slice(start,start+900);
    if(!block.includes('padoka_profiles'))fail('policy sem gate de perfil PADOKA: '+policy);
  }

  const searchStart=lower.indexOf('create or replace function padoka_rpc_private.admin_loyalty_customers');
  const searchEnd=lower.indexOf('create or replace function padoka_rpc_private.admin_adjust_loyalty',searchStart);
  const searchBlock=lower.slice(searchStart,searchEnd);
  if(!searchBlock.includes('from public.padoka_profiles p\n  join auth.users u on u.id=p.id')){
    fail('busca administrativa não parte de padoka_profiles');
  }
  if(searchBlock.includes('from auth.users u\n  left join public.padoka_profiles')){
    fail('busca administrativa voltou a partir de auth.users global');
  }

  const adjustBlock=lower.slice(searchEnd);
  if(!adjustBlock.includes('select 1 from public.padoka_profiles p where p.id=p_user_id')){
    fail('ajuste administrativo não exige cliente PADOKA');
  }
  if(adjustBlock.includes('select 1 from auth.users u where u.id=p_user_id')){
    fail('ajuste administrativo voltou a aceitar qualquer auth.users');
  }

  const redeemStart=lower.indexOf('create or replace function padoka_rpc_private.redeem_reward');
  const cancelStart=lower.indexOf('create or replace function padoka_rpc_private.cancel_redemption');
  const redeemBlock=lower.slice(redeemStart,cancelStart);
  const cancelBlock=lower.slice(cancelStart,searchStart);
  if(!redeemBlock.includes('v_uid:=padoka_private.padoka_loyalty_require_customer()')){
    fail('resgate não exige onboarding PADOKA');
  }
  if(!cancelBlock.includes('v_uid:=padoka_private.padoka_loyalty_require_customer()')){
    fail('cancelamento não exige onboarding PADOKA');
  }

  if(/\b(service_role|sb_secret_)\b/i.test(sql))fail('migração contém credencial/role privilegiada indevida');
}

if(!process.exitCode)console.log('PADOKA Club customer boundary audit: OK');