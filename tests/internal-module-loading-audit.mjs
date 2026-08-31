import fs from 'node:fs';

const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(nav))fail(m)};
const forbid=(re,m)=>{if(re.test(nav))fail(m)};

need(/function loadValidatedModuleScripts\(role\)/,'carregamento dos scripts internos precisa ocorrer somente após papel validado');
need(/if\(!allowed\(current,role\)\)return/,'loader interno precisa falhar fechado para módulo sem permissão');
need(/loadValidatedModuleScripts\(role\)[\s\S]*?classList\.remove\(['"]padoka-role-pending['"]\)/,'scripts do módulo precisam ser carregados dentro do fluxo de staff já validado');
need(/if\(current===['"]produtos['"]\)loadScript\(['"]assets\/product-management\.js['"]/,'gestão de produtos só deve carregar no módulo Produtos');
need(/if\(\[['"]estoque['"],['"]producao['"],['"]perdas['"],['"]relatorios['"]\]\.includes\(current\)\)loadScript\(['"]assets\/operational-sync\.js['"]/,'sincronização operacional não deve carregar fora dos módulos operacionais');
need(/if\(current===['"]producao['"]\)loadScript\(['"]assets\/production-completion\.js['"]/,'finalização de produção só deve carregar na Produção');
need(/if\(current===['"]perdas['"]\)loadScript\(['"]assets\/loss-registration\.js['"]/,'registro de perdas só deve carregar em Perdas');
need(/if\(current===['"]relatorios['"]\)loadScript\(['"]assets\/reporting-sync\.js['"]/,'relatórios só devem carregar no módulo Relatórios');
need(/if\(current===['"]configuracoes['"]\)loadScript\(['"]assets\/settings-sync\.js['"]/,'configurações só devem carregar no módulo Configurações');
need(/if\(current===['"]equipe['"]\)\{[\s\S]*?staff-management-lifecycle\.js[\s\S]*?staff-management\.js[\s\S]*?staff-audit\.js/,'scripts de equipe só devem carregar no módulo Equipe');
need(/const latestSession=await safeSession\(client\)[\s\S]*?loadValidatedModuleScripts\(role\)/,'loader precisa ocorrer somente após reconfirmação da mesma sessão');
forbid(/if\(isGestao\)\{[\s\S]*?document\.head\.appendChild\(s\)[\s\S]*?\}\s*\}\s*\)\(\);$/,'não pode existir bloco legado que injete todos os scripts de Gestão incondicionalmente');

if(!process.exitCode)console.log('Internal module loading audit: OK');
