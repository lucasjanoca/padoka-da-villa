import fs from 'node:fs';

const lifecycle=fs.readFileSync('assets/staff-management-lifecycle.js','utf8');
const ui=fs.readFileSync('assets/staff-management.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(lifecycle.includes("const isGestao=location.pathname.endsWith('/gestao.html')"),'Guard de lifecycle da equipe deve permanecer limitado à Gestão interna.');
expect(lifecycle.includes('let baselineUserId=null;')&&lifecycle.includes('let transitionEpoch=0;'),'Lifecycle da equipe deve manter identidade-base e geração de transição separadas.');
expect(lifecycle.includes('function clearStaffManagementUi(client){')&&lifecycle.includes('transitionEpoch+=1;'),'Limpeza da equipe deve invalidar imediatamente operações assíncronas da identidade anterior.');
expect(lifecycle.includes("classList.add('padoka-staff-pending','padoka-role-pending')"),'Troca de identidade deve recolocar a Gestão em estado visual fail-closed.');
expect(lifecycle.includes("document.querySelector('[data-panel=\"equipe\"]')?.remove()")&&lifecycle.includes("document.querySelector('.tabs a[href=\"?tab=equipe\"]')?.remove()")&&lifecycle.includes("[data-padoka-module=\"equipe\"]") ,'Limpeza deve remover painel, aba e navegação privilegiada da equipe.');
expect(lifecycle.includes("includes('padoka-staff-management-ui')")&&lifecycle.includes('void client.removeChannel(staffChannel)'),'Limpeza deve encerrar o canal Realtime privilegiado da equipe.');
expect(lifecycle.includes('async function safeSession(client)')&&lifecycle.includes('client.auth.getSession()')&&lifecycle.includes('if(error)throw error;')&&lifecycle.includes('catch(error)'),'Lifecycle deve tratar erro retornado e falha de transporte ao confirmar a sessão.');

const initStart=lifecycle.indexOf('async function init(){');
const initialSession=lifecycle.indexOf('const session=await safeSession(client);',initStart);
const initialEpochCheck=lifecycle.indexOf('if(epoch!==transitionEpoch)return;',initialSession);
const noSessionClear=lifecycle.indexOf('clearStaffManagementUi(client);',initialEpochCheck);
expect(initStart>=0&&initialSession>initStart&&initialEpochCheck>initialSession&&noSessionClear>initialEpochCheck,'Bootstrap deve validar geração e limpar a UI quando a sessão não puder ser confirmada.');

const authStart=lifecycle.indexOf('client.auth.onAuthStateChange(');
const nextId=lifecycle.indexOf("const nextUserId=nextSession?.user?.id||'';",authStart);
const sameIdentityGuard=lifecycle.indexOf('if(baselineUserId!==null&&nextUserId===baselineUserId)return;',nextId);
const authClear=lifecycle.indexOf('clearStaffManagementUi(client);',sameIdentityGuard);
const baselineUpdate=lifecycle.indexOf('baselineUserId=nextUserId;',authClear);
expect(authStart>=0&&nextId>authStart&&sameIdentityGuard>nextId&&authClear>sameIdentityGuard&&baselineUpdate>authClear,'Mudança de conta deve limpar a equipe antes de aceitar a nova identidade-base.');
expect(lifecycle.includes("if(!nextUserId){")&&lifecycle.includes("location.replace('internal.html')"),'Logout deve retirar a pessoa da Gestão privilegiada.');
expect(lifecycle.includes('location.replace(location.href);'),'Troca para outra conta autenticada deve reconstruir a Gestão somente após novo bootstrap de autorização.');

expect(ui.includes('async function identityStillCurrent')&&ui.includes("session?.user?.id===expectedUserId&&window.padokaStaffRole==='owner'"),'Operações da equipe devem permanecer vinculadas ao mesmo owner autenticado.');
const loadStart=ui.indexOf('async function load(){');
const loadRpc=ui.indexOf("client.rpc('padoka_list_staff')",loadStart);
const loadPreflight=ui.indexOf('if(!(await identityStillCurrent(expectedUserId)))return false;',loadStart);
const loadPostflight=ui.indexOf('if(!(await identityStillCurrent(expectedUserId)))return false;',loadRpc);
expect(loadStart>=0&&loadPreflight>loadStart&&loadPreflight<loadRpc&&loadPostflight>loadRpc,'Listagem deve reconfirmar a identidade owner antes e depois da RPC.');
expect(ui.includes("client.channel('padoka-staff-management-ui')")&&ui.includes("table:'padoka_staff_users'")&&ui.includes("()=>load().catch(()=>{})"),'Realtime da equipe deve atualizar somente pelo carregamento que revalida identidade e autorização.');
expect(!ui.includes('service_role')&&!ui.includes('sb_secret_')&&!lifecycle.includes('service_role')&&!lifecycle.includes('sb_secret_'),'Gestão de equipe no navegador nunca pode conter segredo privilegiado.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(ui+lifecycle),'Lifecycle da equipe não pode introduzir trigger global em auth.users.');

console.log('staff-management-lifecycle-audit: ok');
