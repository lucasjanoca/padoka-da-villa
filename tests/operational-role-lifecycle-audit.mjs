import fs from 'node:fs';
import assert from 'node:assert/strict';

const nav = fs.readFileSync('assets/internal-nav.js', 'utf8');
const sync = fs.readFileSync('assets/operational-sync.js', 'utf8');

const roleChecks = [
  ["estoque:['owner','manager','stock']", 'Estoque'],
  ["producao:['owner','manager','production']", 'Produção'],
  ["perdas:['owner','manager','stock','production']", 'Perdas'],
  ["relatorios:['owner','manager']", 'Relatórios']
];
for (const [needle, label] of roleChecks) {
  assert.ok(nav.includes(needle), `${label} perdeu a allowlist mínima de papéis.`);
}

const validation = nav.indexOf("from('padoka_staff_users')");
const authorization = nav.indexOf('if(!allowed(current,role)){', validation);
const moduleLoad = nav.indexOf('loadValidatedModuleScripts(role);', validation);
assert.ok(validation >= 0 && authorization > validation && moduleLoad > authorization,
  'Módulos internos só podem carregar após validar padoka_staff_users e autorizar o papel atual.');

assert.ok(nav.includes("if(error||!staff?.active)throw new Error('staff permission unavailable')"),
  'Conta interna inativa deve falhar fechada.');
assert.ok(nav.includes('delete window.padokaStaffRole;'),
  'Troca/logout deve apagar imediatamente o papel interno resolvido.');
assert.ok(nav.includes('delete window.padokaCanAccess;'),
  'Troca/logout deve apagar imediatamente a capability de navegação interna.');
assert.ok(nav.includes("root.querySelectorAll('[data-padoka-module]').forEach(link=>{"),
  'Links restritos devem ser reocultados enquanto o novo staff é revalidado.');
assert.ok(nav.includes('staffValidationEpoch+=1;') && nav.includes('clearResolvedStaff();'),
  'Mudança de autenticação deve invalidar validações antigas e limpar o staff anterior.');
assert.ok(nav.includes('if(!nextUserId){') && nav.includes("location.replace('internal.html');"),
  'Logout interno deve sair das áreas protegidas.');
assert.ok(nav.includes("if(!document.hidden&&validatedStaffUserId)applyStaffRole(validatedStaffUserId);"),
  'Retorno à aba deve revalidar o funcionário ativo.');

assert.ok(sync.includes("const OPERATIONAL_SCOPE=(new URLSearchParams(location.search).get('tab')||'').toLowerCase();"),
  'Runtime operacional deve permanecer escopado pela aba interna atual.');
assert.ok(sync.includes("if(!['estoque','producao','perdas','relatorios'].includes(OPERATIONAL_SCOPE))return"),
  'Runtime operacional não pode ativar fora dos quatro módulos aprovados.');
assert.ok(sync.includes("const pending=document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending');"),
  'Runtime operacional deve aguardar o guard central terminar a revalidação de staff/papel.');
assert.ok(sync.includes('if(session?.user?.id!==expectedUserId)return false;'),
  'Runtime operacional deve abortar quando a sessão mudou durante a validação.');
assert.ok(sync.includes("clearOperationalState('Validando novamente o acesso interno…');"),
  'Troca de conta deve limpar imediatamente o estado operacional anterior.');
assert.ok(sync.includes('if(channel&&sb){try{sb.removeChannel(channel)}catch{}}channel=null;'),
  'Troca de conta deve remover o canal Realtime operacional anterior.');

for (const forbidden of ['service_role', 'sb_secret_', 'auth.users']) {
  assert.ok(!nav.toLowerCase().includes(forbidden) && !sync.toLowerCase().includes(forbidden),
    `Runtime interno contém referência proibida: ${forbidden}`);
}

console.log('PADOKA operational role lifecycle audit: OK');
