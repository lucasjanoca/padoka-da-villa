import fs from 'node:fs';

const notifications = fs.readFileSync('assets/customer-notifications.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(notifications.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'customer notifications must stay pinned to the PADOKA backend');
expect(notifications.includes('previousAuthSub?.unsubscribe();'), 'client rebind must unsubscribe the previous auth lifecycle before using a new client');
expect(notifications.includes('previousClient.removeChannel(previousChannel)'), 'client rebind must remove the previous Realtime channel through the client that created it');
expect(notifications.includes("activeUserId='';\n    session=null;\n    channel=null;\n    authSub=null;"), 'client rebind must clear customer identity and subscriptions before switching clients');
expect(notifications.includes('if(client!==nextClient)return;'), 'async client rebind must reject stale completion from a superseded client');
expect(notifications.includes('if(client===nextClient)setSession(nextSession);'), 'auth callbacks must be scoped to the client that registered them');
expect(notifications.includes(".eq('user_id',userId)"), 'notification reads must remain scoped to the authenticated customer id');
expect(notifications.includes("filter:'user_id=eq.'+userId"), 'notification Realtime subscription must remain scoped to the authenticated customer id');
expect(notifications.includes("client.rpc('padoka_mark_customer_notifications_read'"), 'notification writes must remain server-authoritative through the PADOKA RPC');
expect(!/service_role|sb_secret_/i.test(notifications), 'customer notification runtime must not expose privileged Supabase credentials');

console.log('customer notifications client lifecycle audit passed');
