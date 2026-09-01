import fs from 'node:fs';

const clubAdmin=fs.readFileSync('assets/club-admin.js','utf8');

const checks=[
  [clubAdmin.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'club admin runtime must stay pinned to the PADOKA backend'],
  [clubAdmin.includes('configOrigin!==PADOKA_ORIGIN'), 'club admin must reject config from another Supabase origin'],
  [clubAdmin.includes('createClient(PADOKA_ORIGIN,cfg.publishableKey'), 'club admin must create the client only for the pinned PADOKA origin'],
  [clubAdmin.includes('lifecycleEpoch')&&clubAdmin.includes('activeStaffUserId'), 'club admin must track auth lifecycle and active staff identity'],
  [clubAdmin.includes('function beginLifecycle(session)'), 'club admin must invalidate previous staff state synchronously'],
  [clubAdmin.includes('function clearAdminUi()'), 'club admin must clear sensitive UI on identity changes'],
  [clubAdmin.includes('sessionStillCurrent(epoch,userId)'), 'club admin actions must revalidate the active session'],
  [clubAdmin.includes("sb.auth.onAuthStateChange"), 'club admin must react to logout and account switches'],
  [clubAdmin.includes("sb.from('padoka_staff_users').select('role,active').eq('user_id',userId)"), 'club admin staff lookup must remain scoped to the active user'],
  [clubAdmin.includes("if(!isCurrent(epoch,userId))return"), 'stale async responses must be discarded'],
  [clubAdmin.includes("sb.rpc('padoka_admin_process_loyalty_code'"), 'loyalty code processing must remain server-authoritative'],
  [clubAdmin.includes("sb.rpc('padoka_admin_adjust_loyalty'"), 'loyalty balance adjustments must remain server-authoritative'],
  [!clubAdmin.includes("from('padoka_loyalty_accounts').update("), 'club admin must not update loyalty balances directly'],
  [!clubAdmin.includes('service_role'), 'club admin must not expose a service-role secret']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA club admin session lifecycle audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA club admin session lifecycle audit passed');
