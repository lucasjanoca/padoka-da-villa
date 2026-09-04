import fs from 'node:fs';

const account=fs.readFileSync('assets/account.js','utf8');

const checks=[
  [account.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'sensitive account actions must stay pinned to the PADOKA backend'],
  [account.includes("$('markNotificationsRead').onclick=async()=>{const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return"), 'notification mutation must capture and validate the active customer lifecycle before the RPC'],
  [account.includes("sb.rpc('padoka_mark_customer_notifications_read',{p_notification_id:null});if(!isCurrent(epoch,userId))return"), 'notification mutation must revalidate identity after the RPC response'],
  [account.includes("$('exportData').onclick=async()=>{const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return"), 'data export must capture and validate the active customer lifecycle before export'],
  [account.includes("sb.rpc('padoka_export_my_data');if(!isCurrent(epoch,userId))return"), 'data export must revalidate identity before creating the downloadable file'],
  [account.includes("$('requestDelete').onclick=async()=>"), 'privacy deletion request must remain an explicit customer action'],
  [account.includes("sb.rpc('padoka_request_privacy_action',{p_type:'delete'"), 'privacy deletion requests must remain server-authoritative'],
  [account.includes("const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return;const btn=$('requestDelete')"), 'privacy request must validate the active identity before mutation'],
  [account.includes("padoka_request_privacy_action',{p_type:'delete',p_details:'Solicitação aberta pelo autoatendimento da conta.'});if(!isCurrent(epoch,userId))return"), 'privacy request must revalidate identity after the RPC response'],
  [account.includes("sb.from('padoka_customer_notifications').select('id,kind,title,body,read_at,created_at').eq('user_id',userId)"), 'notification reads must remain scoped to the active customer'],
  [account.includes("sb.from('padoka_privacy_requests').select('request_type,status,created_at').eq('user_id',userId)"), 'privacy request reads must remain scoped to the active customer'],
  [!account.includes("sb.from('padoka_customer_notifications').update("), 'browser must not update customer notifications directly'],
  [!account.includes("sb.from('padoka_privacy_requests').insert("), 'browser must not insert privacy requests directly'],
  [!account.includes('service_role')&&!account.includes('sb_secret_'), 'account browser runtime must not expose privileged Supabase credentials'],
  [!account.includes('auth.users'), 'account browser runtime must not depend on global auth.users objects']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA account sensitive-actions lifecycle audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA account sensitive-actions lifecycle audit passed');
