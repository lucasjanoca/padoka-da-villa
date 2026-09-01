import fs from 'node:fs';

const account=fs.readFileSync('assets/account.js','utf8');

const checks=[
  [account.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'account runtime must stay pinned to the PADOKA backend'],
  [account.includes("url.origin!==PADOKA_ORIGIN"), 'public config must reject a different Supabase origin'],
  [account.includes('lifecycleEpoch')&&account.includes('activeUserId'), 'account must track auth lifecycle and active customer identity'],
  [account.includes('function beginLifecycle(session)'), 'account must invalidate the previous customer synchronously on auth changes'],
  [account.includes('clearCustomerUi()'), 'account must clear customer-specific UI when identity changes'],
  [account.includes("sb.auth.onAuthStateChange"), 'account must react to auth changes'],
  [account.includes('if(!isCurrent(epoch,userId))return'), 'async account responses must be discarded after identity changes'],
  [account.includes("sb.from('padoka_profiles').select('*').eq('id',userId)"), 'profile lookup must remain scoped to the current authenticated customer'],
  [account.includes("sb.from('padoka_loyalty_accounts').select('points_balance,lifetime_points').eq('user_id',userId)"), 'loyalty lookup must remain scoped to the active customer'],
  [account.includes("sb.from('padoka_customer_notifications').select('id,kind,title,body,read_at,created_at').eq('user_id',userId)"), 'notifications lookup must remain scoped to the active customer'],
  [account.includes("sb.from('padoka_privacy_requests').select('request_type,status,created_at').eq('user_id',userId)"), 'privacy requests lookup must remain scoped to the active customer'],
  [account.includes("queryParams:{prompt:'select_account',access_type:'offline'}"), 'Google login must keep prompt select_account'],
  [account.includes("sb.rpc('padoka_save_profile',args)"), 'onboarding must continue using the server-authoritative profile RPC'],
  [!account.includes("sb.from('padoka_profiles').insert("), 'account must not insert customer profiles directly'],
  [!account.includes("sb.from('padoka_profiles').update("), 'account must not update customer profiles directly']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA account session lifecycle audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA account session lifecycle audit passed');
