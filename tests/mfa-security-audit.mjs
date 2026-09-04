import fs from 'node:fs';

const page=fs.readFileSync('mfa.html','utf8');
const mfa=fs.readFileSync('assets/mfa.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const internal=fs.readFileSync('internal.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};

// The PADOKA no longer requires TOTP. The compatibility page must be inert and
// only redirect to a same-origin, allow-listed administrative destination.
need(page,/src=['"]assets\/mfa\.js['"]/,'MFA legado: lógica deve permanecer em módulo externo compatível com CSP estrita');
if(/<script>(?:.|\n)*?auth\.mfa\./.test(page))fail('MFA legado: não deve existir lógica Auth MFA inline');
need(mfa,/function safeReturn\(\)/,'MFA legado: retorno precisa ser sanitizado');
need(mfa,/u\.origin===location\.origin/,'MFA legado: retorno deve ficar na mesma origem');
need(mfa,/location\.replace\(safeReturn\(\)\)/,'MFA legado: deve apenas redirecionar');
if(/auth\.mfa\.|mfa\.enroll|mfa\.challenge|mfa\.verify/.test(mfa))fail('MFA legado: fluxo TOTP não pode ser reativado');
if(/createClient\(/.test(mfa))fail('MFA legado: não deve criar cliente de autenticação');

// A segurança administrativa continua baseada em sessão autenticada e papéis.
need(nav,/padoka_staff_users/,'Navegação: autorização deve continuar baseada nos perfis internos da PADOKA');
need(nav,/window\.padokaStaffRole/,'Navegação: papel validado deve continuar controlando módulos');
need(nav,/window\.padokaCanAccess/,'Navegação: permissões de módulo devem continuar fail-closed');
need(nav,/safeSession\(client\)/,'Navegação: sessão deve continuar sendo revalidada');
need(internal,/validateStaff\(session\)/,'Login interno: deve continuar validando funcionário autorizado');
need(internal,/padoka_staff_users/,'Login interno: autorização precisa permanecer no cadastro interno');

if(!process.exitCode)console.log('MFA security audit: retired TOTP flow OK');
