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
  [frontend.includes("btn.onclick=save"), 'server sync must take over the save action when available'],
  [!frontend.includes("localStorage.setItem('padoka_demo_config'"), 'server sync must not write settings to localStorage'],
  [nav.includes("s.src='assets/settings-sync.js'"), 'management navigation must load settings sync'],
  [nav.includes('if(isGestao)'), 'settings sync must only be loaded in internal management']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){console.error('PADOKA settings audit failed:\n- '+failed.join('\n- '));process.exit(1)}
console.log('PADOKA settings audit passed');
