import fs from 'node:fs';

const ui=fs.readFileSync('assets/admin-dashboard-live.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(ui))fail(m)};

need(/observedStaffRole/i,'dashboard precisa acompanhar o papel de staff já validado');
need(/MutationObserver/i,'dashboard precisa reagir à revalidação de papel sem depender de reload manual');
need(/attributeFilter:\[['"]data-staff-role['"]\]/i,'observer deve ficar restrito ao atributo de papel do guard interno');
need(/if\(nextRole===observedStaffRole\)return/i,'revalidação sem mudança de papel não deve reiniciar o dashboard');
need(/const userId=activeUserId;\s*clearDashboardState\(\)/i,'mudança de papel deve limpar dados e canais do papel anterior antes de qualquer reativação');
need(/clearDashboardState\(\);\s*if\(nextRole&&userId\)/i,'papel removido precisa permanecer fail-closed sem reativar o dashboard');
need(/const epoch=currentEpoch\(\);\s*setTimeout\(\(\)=>init\(userId,epoch\),0\)/i,'papel novo só pode reativar usando um novo lifecycle epoch');
need(/get\(['"]adminOperationalHealth['"]\)\?\.remove\(\)/i,'limpeza do lifecycle deve remover alertas operacionais do papel anterior');
need(/removeChannel/i,'limpeza por mudança de papel precisa encerrar canais Realtime anteriores');
need(/observer\.disconnect\(\)/i,'observer de papel deve ser descartado ao sair da página');

if(!process.exitCode)console.log('Admin dashboard role-change audit: OK');
