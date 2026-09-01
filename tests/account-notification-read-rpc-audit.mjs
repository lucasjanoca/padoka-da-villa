import fs from 'node:fs';

const src=fs.readFileSync(new URL('../assets/account.js',import.meta.url),'utf8');

function expect(condition,message){
  if(!condition)throw new Error(message);
}

expect(src.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"),'account.js must remain pinned to the PADOKA backend');
expect(src.includes("sb.rpc('padoka_mark_customer_notifications_read',{p_notification_id:null})"),'mark-all-read must use the server-authoritative notification RPC');
expect(!src.includes("from('padoka_customer_notifications').update("),'account.js must not update customer notifications directly');
expect(src.includes("'\"':'&quot;'"),'HTML escaping for double quotes must remain intact');
expect(!/service_role|sb_secret_/i.test(src),'account.js must not expose administrative Supabase credentials');

console.log('account notification read RPC audit: ok');
