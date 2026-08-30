import fs from 'node:fs';

const page=fs.readFileSync('mfa.html','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const internal=fs.readFileSync('internal.html','utf8');
const migration=fs.readFileSync('supabase/038_privileged_mfa_hardening.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};

need(page,/auth\.mfa\.getAuthenticatorAssuranceLevel\(\)/,'MFA: deve consultar o AAL atual');
need(page,/auth\.mfa\.listFactors\(\)/,'MFA: deve listar fatores existentes');
need(page,/auth\.mfa\.enroll\(\{factorType:['"]totp['"]/,'MFA: deve permitir enrolamento TOTP');
need(page,/auth\.mfa\.challenge\(\{factorId/,'MFA: deve criar challenge');
need(page,/auth\.mfa\.verify\(\{factorId,challengeId:challenge\.id,code/,'MFA: deve verificar challenge com código');
need(page,/\['owner','manager'\]/,'MFA: somente perfis privilegiados devem ser obrigados nesta tela');
need(page,/safeReturn\(\)/,'MFA: retorno precisa ser sanitizado');

need(nav,/privilegedMfaRoles=new Set\(\['owner','manager'\]\)/,'Navegação: owner/manager precisam de MFA');
need(nav,/getAuthenticatorAssuranceLevel\(\)/,'Navegação: deve validar AAL antes de liberar');
need(nav,/location\.replace\('mfa\.html\?return='/,'Navegação: deve redirecionar fail-closed para MFA');

need(internal,/privilegedMfaReady/,'Login interno: precisa validar MFA antes de abrir painel');
need(internal,/currentLevel===['"]aal2['"]/,'Login interno: precisa exigir AAL2');
need(internal,/mfa\.html\?return=internal\.html/,'Login interno: deve redirecionar para MFA');

need(migration,/auth\.jwt\(\)->>['"]aal['"]/,'Banco: trigger deve validar claim aal');
need(migration,/v_role in \('owner','manager'\)/,'Banco: exigência deve atingir owner/manager');
for(const table of ['padoka_staff_users','padoka_products','padoka_settings','padoka_sales','padoka_orders']){
  if(!migration.includes(table))fail('Banco: proteção MFA ausente em '+table);
}

if(!process.exitCode)console.log('MFA security audit: OK');
