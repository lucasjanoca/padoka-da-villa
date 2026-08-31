import fs from 'node:fs';

const src=fs.readFileSync('assets/operational-sync.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(src))fail(m)};
const forbid=(re,m)=>{if(re.test(src))fail(m)};

need(/const OPERATIONAL_SCOPE=\(new URLSearchParams\(location\.search\)\.get\(['"]tab['"]\)\|\|['"]['"]\)\.toLowerCase\(\)/,'sincronização operacional precisa derivar o escopo da aba atual');
need(/needsInventory=.*OPERATIONAL_SCOPE===['"]estoque['"].*OPERATIONAL_SCOPE===['"]relatorios['"]/,'estoque só pode ser lido em Estoque ou Relatórios');
need(/needsPlans=.*OPERATIONAL_SCOPE===['"]producao['"].*OPERATIONAL_SCOPE===['"]relatorios['"]/,'planos só podem ser lidos em Produção ou Relatórios');
need(/needsLosses=.*OPERATIONAL_SCOPE===['"]perdas['"].*OPERATIONAL_SCOPE===['"]relatorios['"]/,'perdas só podem ser lidas em Perdas ou Relatórios');
need(/if\(needsInventory\(\)\)queries\.inventory=sb\.from\(['"]padoka_inventory['"]\)/,'consulta de estoque precisa estar condicionada ao escopo');
need(/if\(needsPlans\(\)\)queries\.plans=sb\.from\(['"]padoka_production_plans['"]\)/,'consulta de produção precisa estar condicionada ao escopo');
need(/if\(needsLosses\(\)\)queries\.losses=sb\.from\(['"]padoka_losses['"]\)/,'consulta de perdas precisa estar condicionada ao escopo');
need(/if\(OPERATIONAL_SCOPE!==['"]estoque['"]\)return true;[\s\S]*?padoka_adjust_inventory_once/,'reconciliação de ajuste pendente não deve rodar fora da aba Estoque');
need(/if\(needsInventory\(\)\)channel\.on\([\s\S]*?padoka_inventory/,'Realtime de estoque precisa respeitar o escopo');
need(/if\(needsPlans\(\)\)channel\.on\([\s\S]*?padoka_production_plans/,'Realtime de produção precisa respeitar o escopo');
need(/if\(needsLosses\(\)\)channel\.on\([\s\S]*?padoka_losses/,'Realtime de perdas precisa respeitar o escopo');
need(/if\(!\[['"]estoque['"],['"]producao['"],['"]perdas['"],['"]relatorios['"]\]\.includes\(OPERATIONAL_SCOPE\)\)return/,'runtime operacional deve falhar fechado fora das abas permitidas');
forbid(/const \[i,p,l\]=await Promise\.all\(/,'não pode voltar a consultar estoque, produção e perdas sempre em bloco');
forbid(/renderStock\(\);renderProduction\(\);renderLosses\(\);renderReports\(\)/,'não pode renderizar todos os módulos em qualquer aba');

if(!process.exitCode)console.log('Operational read scope audit: OK');
