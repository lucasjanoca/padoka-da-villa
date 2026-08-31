import fs from 'node:fs';

const migration=fs.readFileSync('supabase/068_settings_read_role_boundary.sql','utf8');
const frontend=fs.readFileSync('assets/settings-sync.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');

const checks=[
  [migration.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'), 'migration must target the PADOKA backend explicitly'],
  [migration.includes('alter table public.padoka_settings enable row level security'), 'settings table must keep RLS enabled'],
  [migration.includes('drop policy if exists "padoka staff read settings"'), 'legacy any-staff read policy must be removed'],
  [migration.includes('create policy "padoka management read settings"'), 'settings must have a management-only read policy'],
  [migration.includes("public.padoka_staff_has_role(array['owner','manager'])"), 'settings direct reads must require owner/manager'],
  [!migration.includes('padoka_is_staff()'), 'new settings boundary must not authorize generic staff'],
  [migration.includes('create or replace function padoka_private.padoka_get_settings()'), 'private settings reader must be hardened'],
  [migration.includes('if auth.uid() is null then'), 'private settings reader must explicitly require an authenticated identity'],
  [migration.includes("padoka_private.staff_has_role(array['owner','manager'])"), 'private settings reader must authorize owner/manager explicitly'],
  [migration.includes("set search_path = ''"), 'private SECURITY DEFINER settings reader must pin an empty search_path'],
  [!/^\s*grant\s+/im.test(migration), 'settings hardening must not widen grants'],
  [!/(create|drop)\s+trigger[\s\S]{0,300}auth\.users/i.test(migration), 'migration must never create/drop a global auth.users trigger'],
  [frontend.includes("const allowedRoles=new Set(['owner','manager'])"), 'settings runtime must remain limited to owner/manager'],
  [frontend.includes("sb.rpc('padoka_get_settings')"), 'settings runtime must read through the server RPC'],
  [frontend.includes("sb.rpc('padoka_update_settings'"), 'settings runtime must write through the server RPC'],
  [nav.includes("configuracoes:['owner','manager']"), 'internal navigation must expose settings only to owner/manager'],
  [nav.includes("if(current==='configuracoes')loadScript('assets/settings-sync.js','padokaSettings')"), 'settings module must only load on the settings tab']
];

const failed=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
if(failed.length){
  console.error('PADOKA settings read role boundary audit failed:\n- '+failed.join('\n- '));
  process.exit(1);
}
console.log('PADOKA settings read role boundary audit passed');
