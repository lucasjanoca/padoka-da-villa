import fs from 'node:fs';

const dashboard = fs.readFileSync('assets/admin-dashboard-live.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(dashboard.includes("const PADOKA_SUPABASE_URL='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'admin dashboard must stay pinned to the PADOKA backend');
expect(dashboard.includes("const isPadokaClient=candidate=>!!candidate&&String(candidate.supabaseUrl||'').replace(/\\/+$/,'')===PADOKA_SUPABASE_URL"), 'admin dashboard must reject Supabase clients from another project');
expect(dashboard.includes("const INVENTORY_ROLES=new Set(['owner','manager','stock'])"), 'inventory dashboard access must remain restricted to explicit staff roles');
expect(dashboard.includes("const PRODUCTION_ROLES=new Set(['owner','manager','production'])"), 'production dashboard access must remain restricted to explicit staff roles');
expect(dashboard.includes("document.documentElement.classList.contains('padoka-staff-pending')"), 'dashboard must fail closed while staff authorization is pending');
expect(dashboard.includes('lifecycleEpoch+=1;'), 'dashboard must invalidate stale async work when staff lifecycle changes');
expect(dashboard.includes("activeUserId=''"), 'dashboard must clear the previous staff identity on lifecycle reset');
expect(dashboard.includes('session?.user?.id===userId'), 'dashboard must revalidate the current authenticated user before applying async results');
expect(dashboard.includes("client.from('padoka_orders')"), 'dashboard orders must continue reading only PADOKA order objects');
expect(dashboard.includes("client.from('padoka_inventory')"), 'inventory health must continue reading only PADOKA inventory objects');
expect(dashboard.includes("client.from('padoka_production_plans')"), 'production health must continue reading only PADOKA production objects');
expect(dashboard.includes("table:'padoka_orders'"), 'order Realtime must stay scoped to the PADOKA orders table');
expect(dashboard.includes("table:'padoka_inventory'"), 'inventory Realtime must stay scoped to the PADOKA inventory table');
expect(dashboard.includes("table:'padoka_production_plans'"), 'production Realtime must stay scoped to the PADOKA production table');
expect(dashboard.includes("if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;"), 'auth lifecycle must avoid unnecessary dashboard reset on initial session/token refresh');
expect(dashboard.includes('clearDashboardState();'), 'auth lifecycle must clear dashboard state before rebinding a new staff identity');
expect(!/service_role|sb_secret_/i.test(dashboard), 'admin dashboard frontend must not expose privileged Supabase credentials');
expect(!/\b(from|rpc|table)\(['\"](?!padoka_)/.test(dashboard), 'admin dashboard must not directly access non-PADOKA database objects');

console.log('admin dashboard lifecycle audit passed');
