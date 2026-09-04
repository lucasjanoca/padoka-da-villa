import fs from 'node:fs';

const reporting = fs.readFileSync('assets/reporting-sync.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(reporting.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'reporting must stay pinned to the PADOKA backend');
expect(reporting.includes("const allowedRoles=new Set(['owner','manager'])"), 'financial reports must remain restricted to owner/manager in the internal UI');
expect(reporting.includes("function isPadokaClient(candidate)"), 'reporting must validate the active Supabase client before use');
expect(reporting.includes("new URL(candidate?.supabaseUrl||'').origin===PADOKA_ORIGIN"), 'reporting must reject Supabase clients from another project');
expect(reporting.includes('lifecycleEpoch+=1;'), 'reporting must invalidate stale async work when staff lifecycle changes');
expect(reporting.includes("activeUserId=''"), 'reporting must track the authenticated staff identity explicitly');
expect(reporting.includes('confirmedSession(userId,epoch)'), 'reporting must revalidate the authenticated staff identity before sensitive work');
expect(reporting.includes("sb.rpc('padoka_report_summary'"), 'reporting must use the server-authoritative PADOKA report RPC');
expect(reporting.includes("if(!allowedRoles.has(role))return;"), 'reporting activation must fail closed for unauthorized staff roles');
expect(reporting.includes("document.documentElement.classList.contains('padoka-staff-pending')"), 'reporting must fail closed while staff authorization is pending');
expect(reporting.includes("if(channel&&sb){try{sb.removeChannel(channel)}catch{}}channel=null;"), 'reporting must remove the previous realtime channel on lifecycle reset');
expect(reporting.includes("if(removeUi)$('serverReport')?.remove();"), 'reporting must remove privileged report UI when staff lifecycle is cleared');
expect(reporting.includes("if(epoch!==lifecycleEpoch||activeUserId!==userId)return;"), 'reporting must discard stale async results after identity changes');
expect(reporting.includes('const session=await confirmedSession(userId,epoch);'), 'reporting must perform a post-RPC session check before applying privileged data');
expect(reporting.includes('if(!session)return;\n    render(data||{});subscribe()'), 'reporting must render/subscribe only after the post-RPC identity check succeeds');
expect(reporting.includes("table:'padoka_sales'"), 'reporting realtime must remain scoped to PADOKA sales');
expect(reporting.includes("table:'padoka_orders'"), 'reporting realtime must remain scoped to PADOKA orders');
expect(reporting.includes("table:'padoka_losses'"), 'reporting realtime must remain scoped to PADOKA losses');
expect(reporting.includes("table:'padoka_production_plans'"), 'reporting realtime must remain scoped to PADOKA production');
expect(reporting.includes("table:'padoka_inventory'"), 'reporting realtime must remain scoped to PADOKA inventory');
expect(reporting.includes("if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;"), 'reporting auth lifecycle must avoid unnecessary reset on initial session/token refresh');
expect(reporting.includes('activeUserId=nextUserId;clearReporting();'), 'reporting auth lifecycle must clear prior staff state before rebinding the next identity');
expect(reporting.includes("window.addEventListener('pagehide',()=>{clearReporting(false);try{authSubscription?.unsubscribe()}catch{}},{once:true});"), 'reporting must tear down privileged realtime/auth resources when leaving the page');
expect(!/service_role|sb_secret_/i.test(reporting), 'reporting frontend must not expose privileged Supabase credentials');
expect(!/\b(from|rpc|table)\(['\"](?!padoka_)/.test(reporting), 'reporting must not directly access non-PADOKA database objects');

console.log('reporting lifecycle audit passed');
