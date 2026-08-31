import fs from 'node:fs';

const migration=fs.readFileSync('supabase/071_remove_stale_profile_write_policies.sql','utf8');
const profileRpc=fs.readFileSync('supabase/013_customer_profile_rpc.sql','utf8');
const account=fs.readFileSync('conta.html','utf8');

const checks=[
  [migration.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'), 'migration must target the PADOKA backend explicitly'],
  [migration.includes('alter table public.padoka_profiles enable row level security'), 'customer profiles must keep RLS enabled'],
  [migration.includes('drop policy if exists "padoka_customer_create_own_profile"'), 'legacy direct INSERT policy must be removed'],
  [migration.includes('drop policy if exists "padoka_customer_update_own_profile"'), 'legacy direct UPDATE policy must be removed'],
  [migration.includes('revoke insert, update, delete on table public.padoka_profiles from anon, authenticated'), 'browser roles must not regain direct profile writes'],
  [!/^\s*grant\s+/im.test(migration), 'profile write hardening must not widen grants'],
  [!/(create|drop)\s+trigger[\s\S]{0,300}auth\.users/i.test(migration), 'migration must never touch a global auth.users trigger'],
  [profileRpc.includes('public.padoka_save_profile('), 'server-authoritative profile RPC must remain defined'],
  [profileRpc.includes('privacy consent required'), 'profile RPC must continue requiring privacy consent'],
  [profileRpc.includes('onboarding_completed')&&profileRpc.includes('true'), 'profile RPC must remain responsible for completing onboarding'],
  [account.includes("sb.rpc('padoka_save_profile',args)"), 'account onboarding must continue saving through the profile RPC'],
  [!account.includes("sb.from('padoka_profiles').insert("), 'account page must not insert profiles directly'],
  [!account.includes("sb.from('padoka_profiles').update("), 'account page must not update profiles directly']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA profile direct write policy audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA profile direct write policy audit passed');
