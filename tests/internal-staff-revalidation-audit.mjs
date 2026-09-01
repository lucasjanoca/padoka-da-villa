import fs from 'node:fs';

const src=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(src))fail(m)};
const forbid=(re,m)=>{if(re.test(src))fail(m)};

need(/PADOKA_SUPABASE_ORIGIN=['"]https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co['"]/,'navegação interna precisa continuar presa ao backend PADOKA');
need(/from\(['"]padoka_staff_users['"]\)\.select\(['"]role,active['"]\)\.eq\(['"]user_id['"],session\.user\.id\)\.maybeSingle\(\)/,'revalidação precisa consultar somente o próprio registro padoka_staff_users');
need(/let staffRevalidationTimer=null/,'revalidação periódica precisa possuir timer controlado');
need(/setInterval\(\(\)=>\{[\s\S]*?validatedStaffUserId[\s\S]*?applyStaffRole\(validatedStaffUserId\)[\s\S]*?\},300000\)/,'staff validado precisa ser rechecado no servidor em janela de cinco minutos');
need(/visibilitychange[\s\S]*?!document\.hidden&&validatedStaffUserId[\s\S]*?applyStaffRole\(validatedStaffUserId\)/,'retorno à aba precisa revalidar imediatamente o staff atual');
need(/const hadResolvedStaff=!!validatedStaffUserId/,'falha após uma autorização prévia precisa ser distinguida do primeiro acesso');
need(/if\(targetNeedsRole\|\|hadResolvedStaff\)\{\s*location\.replace\(['"]internal\.html['"]\)/,'revogação de staff já validado precisa retirar imediatamente a interface interna');
need(/pagehide[\s\S]*?clearInterval\(staffRevalidationTimer\)/,'timer de revalidação precisa ser encerrado ao abandonar a página');
need(/privilegedMfaRoles=new Set\(\[['"]owner['"],['"]manager['"]\]\)/,'owner e manager precisam continuar submetidos a MFA');
need(/getAuthenticatorAssuranceLevel/,'revalidação não pode contornar a checagem AAL2');
forbid(/auth\.users|from\(['"]profiles['"]\)/i,'guard interno não pode criar dependência global em auth.users/perfil genérico');
forbid(/service_role|sb_secret_/i,'frontend interno não pode conter segredo administrativo');

if(!process.exitCode)console.log('Internal staff revalidation audit: OK');
