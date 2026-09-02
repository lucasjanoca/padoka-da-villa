import fs from 'node:fs';

const clubAdmin=fs.readFileSync('assets/club-admin.js','utf8');
const clubAdminHtml=fs.readFileSync('club-admin.html','utf8');

const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';

const checks=[
  [clubAdmin.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`), 'club admin must stay pinned to the PADOKA Supabase project'],
  [clubAdmin.includes("const CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config'"), 'club admin public config must be requested only from the pinned PADOKA origin'],
  [clubAdmin.includes('configOrigin!==PADOKA_ORIGIN'), 'club admin must reject public config that points to another Supabase origin'],
  [clubAdmin.includes('createClient(PADOKA_ORIGIN,cfg.publishableKey'), 'club admin must create its Supabase client only for the pinned PADOKA origin'],
  [clubAdminHtml.includes(`connect-src 'self' ${PADOKA_ORIGIN} wss://yncspxfsvlqdnodlsosb.supabase.co`), 'club admin CSP must restrict network access to the PADOKA backend'],
  [clubAdmin.includes("sb.from('padoka_staff_users').select('role,active').eq('user_id',userId)"), 'club admin must authorize the active user through padoka_staff_users'],
  [clubAdmin.includes("['owner','manager','cashier','attendant'].includes(r)"), 'club admin must keep an explicit staff-role allowlist'],
  [clubAdmin.includes("aal?.currentLevel!=='aal2'"), 'owner and manager access must continue enforcing AAL2'],
  [clubAdmin.includes("sb.rpc('padoka_admin_process_loyalty_code'"), 'redemption processing must remain server-authoritative'],
  [clubAdmin.includes("sb.rpc('padoka_admin_update_loyalty_settings'"), 'loyalty settings mutations must remain server-authoritative'],
  [clubAdmin.includes("sb.rpc('padoka_admin_upsert_loyalty_reward'"), 'reward mutations must remain server-authoritative'],
  [clubAdmin.includes("sb.rpc('padoka_admin_upsert_loyalty_campaign'"), 'campaign mutations must remain server-authoritative'],
  [clubAdmin.includes("sb.rpc('padoka_admin_adjust_loyalty'"), 'loyalty balance adjustments must remain server-authoritative'],
  [!clubAdmin.includes("from('padoka_loyalty_accounts').update("), 'club admin must never update customer loyalty balances directly'],
  [!clubAdmin.includes("from('padoka_loyalty_accounts').insert("), 'club admin must never insert customer loyalty balances directly'],
  [!clubAdmin.includes('service_role')&&!clubAdmin.includes('sb_secret_'), 'club admin frontend must not contain administrative Supabase credentials'],
  [!clubAdmin.toLowerCase().includes('infotech.io'), 'club admin runtime must not depend on the InfoTech.io backend']
];

const failed=checks.filter(([ok])=>!ok).map(([,message])=>message);
if(failed.length){
  console.error('PADOKA club admin backend isolation audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}

console.log('PADOKA club admin backend isolation audit passed');
