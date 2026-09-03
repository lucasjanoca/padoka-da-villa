import fs from 'node:fs';

const admin = fs.readFileSync('assets/club-admin.js', 'utf8');
const html = fs.readFileSync('club-admin.html', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(admin.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'club admin must pin the Sites De Clientes! backend');
expect(admin.includes("sb.from('padoka_staff_users')"), 'club admin must authorize through padoka_staff_users');
expect(admin.includes("['owner','manager','cashier','attendant']"), 'club admin must restrict access to explicit staff roles');
expect(admin.includes("aal?.currentLevel!=='aal2'"), 'owner/manager actions must require AAL2');
expect(admin.includes('lifecycleEpoch'), 'club admin must invalidate stale async work across auth changes');
expect(admin.includes('activeStaffUserId'), 'club admin must bind state to the active staff identity');
expect(admin.includes('sessionStillCurrent'), 'club admin must revalidate the session before sensitive work');
expect(admin.includes("document.body.classList.remove('manager')"), 'auth lifecycle cleanup must immediately clear manager-only UI state');
expect(admin.includes("role='';rewards=[];campaigns=[];selectedCustomer=null;lookupData=null"), 'auth lifecycle cleanup must clear privileged Club state before revalidation');
expect(admin.includes("$('app')?.classList.add('hidden');$('gate')?.classList.remove('hidden')"), 'auth lifecycle cleanup must hide the internal Club app before revalidation');
expect(admin.includes("sb.rpc('padoka_admin_adjust_loyalty'"), 'manual loyalty adjustment must go through the server-authoritative RPC');
expect(admin.includes("sb.rpc('padoka_admin_process_loyalty_code'"), 'redemption processing must go through the server-authoritative RPC');
expect(admin.includes("sb.rpc('padoka_admin_loyalty_customers'"), 'customer lookup must stay behind the PADOKA admin RPC');
expect(admin.includes("sb.from('padoka_loyalty_settings')"), 'manager data must stay inside padoka_* objects');
expect(!/service_role|sb_secret_/i.test(admin), 'club admin must not expose privileged Supabase credentials');
expect(html.includes('noindex,nofollow,noarchive'), 'club admin must remain excluded from indexing');
expect(html.includes("connect-src 'self' https://yncspxfsvlqdnodlsosb.supabase.co wss://yncspxfsvlqdnodlsosb.supabase.co"), 'club admin CSP must restrict Supabase connections to the PADOKA backend');
expect(!html.includes('href="club-admin.html"') || html.includes('id="padokaInternalNav"'), 'club admin must not be exposed as a standalone public-navigation destination');

console.log('club admin lifecycle audit passed');
