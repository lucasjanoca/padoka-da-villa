import fs from 'node:fs';

const migration=fs.readFileSync('supabase/009_internal_settings.sql','utf8');
const frontend=fs.readFileSync('assets/settings-sync.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');

const checks=[
  [migration.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'), 'migration must target the PADOKA backend explicitly'],
  [migration.includes('create table if not exists public.padoka_settings'), 'settings table must use padoka_ prefix'],
  [migration.includes('alter table public.padoka_settings enable row level security'), 'settings table must enable RLS'],
  [migration.includes("public.padoka_staff_has_role(array['owner','manager'])"), 'settings writes must require owner/manager'],
  [migration.includes('public.padoka_is_staff()'), 'settings reads must require PADOKA staff'],
  [migration.includes('revoke all on public.padoka_settings from anon'), 'anon must not access settings'],
  [migration.includes('revoke all on public.padoka_settings from authenticated'), 'authenticated must not receive direct writes'],
  [migration.includes('grant select on public.padoka_settings to authenticated'), 'staff reads may use authenticated select under RLS'],
  [migration.includes('create or replace function public.padoka_get_settings()'), 'read RPC must exist'],
  [migration.includes('create or replace function public.padoka_update_settings('), 'write RPC must exist'],
  [!/(create|drop)\s+trigger[\s\S]{0,300}auth\.users/i.test(migration), 'migration must never create/drop a global auth.users trigger'],
  [frontend.includes("sb.rpc('padoka_get_settings')"), 'frontend must load settings through RPC'],
  [frontend.includes("sb.rpc('padoka_update_settings'"), 'frontend must save settings through RPC'],
  [frontend.includes('functionMissing(error)'), 'frontend must detect a missing server settings function'],
  [frontend.includes('blockLegacyFallback('), 'frontend must disable the legacy local fallback before server sync'],
  [frontend.includes('setControlsEnabled(false)'), 'settings controls must remain disabled while server state is unavailable'],
  [frontend.includes('O salvamento local foi bloqueado'), 'frontend must explain that local-only settings are blocked'],
  [frontend.includes('btn.onclick=save'), 'server sync must take over the save action when available'],
  [!frontend.includes("localStorage.setItem('padoka_demo_config'"), 'server sync must not write settings to localStorage'],
  [frontend.includes('sb.auth.onAuthStateChange'), 'settings sync must react to staff auth lifecycle changes'],
  [frontend.includes("event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED'"), 'settings sync must ignore non-identity auth refresh events'],
  [frontend.includes("let sb=null,active=false,channel=null,lifecycleEpoch=0,activeUserId=''"), 'settings sync must bind async work to an auth lifecycle epoch and active user'],
  [frontend.includes('function resetForIdentityChange('), 'settings sync must fail closed immediately on identity changes'],
  [frontend.includes('async function identityStillCurrent(epoch,userId)'), 'settings sync must revalidate delayed async responses against the active identity'],
  [(frontend.match(/identityStillCurrent\(epoch,userId\)/g)||[]).length>=5, 'settings load/save and transport recovery must reject stale responses from a previous identity'],
  [frontend.includes('const epoch=lifecycleEpoch,userId=activeUserId;'), 'settings async operations must capture the current identity before RPC work'],
  [frontend.includes('session?.user?.id!==expectedUserId'), 'settings activation must verify the Supabase session still belongs to the expected staff user'],
  [frontend.includes("document.documentElement.classList.contains('padoka-staff-pending')"), 'settings activation must wait for the staff guard before trusting role state'],
  [frontend.includes("document.documentElement.classList.contains('padoka-role-pending')"), 'settings activation must wait for role revalidation before enabling controls'],
  [frontend.includes('clearChannel()'), 'settings sync must tear down the previous realtime channel on identity change'],
  [frontend.includes('sb.removeChannel(current)'), 'settings sync must unsubscribe the old realtime settings channel'],
  [frontend.includes('if(epoch===lifecycleEpoch&&activeUserId===userId)load()'), 'settings realtime callbacks must be scoped to the identity that created the channel'],
  [frontend.includes("resetForIdentityChange();"), 'auth changes must invalidate stale settings runtime immediately'],
  [frontend.includes("if(!allowedRoles.has(role)){blockLegacyFallback('Somente responsáveis autorizados podem alterar configurações.')"), 'settings controls must stay blocked after a switch to an unauthorized staff role'],
  [frontend.includes("catch(error){\n      if(!await identityStillCurrent(epoch,userId))return false;"), 'settings load must recover from a transport rejection without reviving a stale identity'],
  [frontend.includes("console.error('PADOKA settings load transport:',error)"), 'settings load transport failures must be handled explicitly'],
  [frontend.includes("catch(error){\n      if(!await identityStillCurrent(epoch,userId))return;\n      if(btn)btn.disabled=false;"), 'settings save must restore the retry control after a transport rejection for the same identity'],
  [frontend.includes("toast('Falha de conexão. Tente salvar novamente.')"), 'settings save transport failures must provide a safe retry message'],
  [nav.includes("s.src='assets/settings-sync.js'"), 'management navigation must load settings sync'],
  [nav.includes('if(isGestao)'), 'settings sync must only be loaded in internal management']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){console.error('PADOKA settings audit failed:\n- '+failed.join('\n- '));process.exit(1)}
console.log('PADOKA settings audit passed');
