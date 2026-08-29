import fs from 'node:fs';

const file='assets/production-completion.js';
const src=fs.readFileSync(file,'utf8');
const checks=[
  ['restrito à gestão',/gestao\.html/.test(src)],
  ['detecta a camada 006',/padoka_production_batches/.test(src)],
  ['usa RPC transacional',/rpc\('padoka_record_production'/.test(src)],
  ['gera request id idempotente',/crypto\.randomUUID\(\)/.test(src)&&/requestId/.test(src)],
  ['persiste request id na sessão',/padoka_pending_production_v1/.test(src)&&/sessionStorage/.test(src)&&/function savePending/.test(src)],
  ['preserva quantidade da tentativa',/requestQuantity/.test(src)&&/p_quantity:Number\(operation\.quantity\)/.test(src)],
  ['retry reutiliza operação pendente',/const operation=stored\|\|savePending/.test(src)&&/pending\?'Tentar novamente':'Registrar'/.test(src)],
  ['retry não libera edição ambígua',/if\(error\).*?input\.disabled=true/s.test(src)],
  ['reconcilia resposta ambígua pelo lote',/function reconcilePending/.test(src)&&/\.in\('request_id',ids\)/.test(src)&&/batch\.plan_id===entry\.planId/.test(src)],
  ['trata conflito de request id',/request id conflict/.test(src)],
  ['não escreve estoque diretamente',!/(from\('padoka_inventory'\).*?(insert|update|upsert)|\.from\('padoka_inventory'\)\.update)/s.test(src)],
  ['não simula sucesso sem RPC',!/localStorage|padoka_demo_production/.test(src)],
  ['trata permissão sem expor detalhe técnico',/não tem permissão|Sem permissão/i.test(src)],
  ['re-renderiza controle quando plano muda',/prodSignature/.test(src)&&/replaceChildren\(\)/.test(src)&&/function signature\(plan\)/.test(src)],
  ['refresh reconcilia e recarrega antes de redesenhar',/async function refresh\(\).*?reconcilePending\(epoch\).*?loadPlans\(epoch\).*?enhance\(\)/s.test(src)],
  ['realtime atualiza plano e lote',/padoka_production_plans/.test(src)&&/padoka_production_batches/.test(src)&&/scheduleRefresh/.test(src)],
  ['observa lifecycle real do Supabase Auth',/onAuthStateChange/.test(src)&&/INITIAL_SESSION/.test(src)&&/TOKEN_REFRESHED/.test(src)],
  ['limpa controles e realtime ao trocar sessão',/function clearProduction/.test(src)&&/removeChannel\(channel\)/.test(src)&&/observer\.disconnect\(\)/.test(src)&&/\[data-prod-cell\]/.test(src)],
  ['invalida respostas assíncronas da sessão anterior',/lifecycleEpoch/.test(src)&&/epoch!==lifecycleEpoch/.test(src)],
  ['espera o guard interno resolver o papel atual',/padoka-staff-pending/.test(src)&&/padoka-role-pending/.test(src)&&/waitForRole/.test(src)],
  ['restringe ativação aos papéis de produção',/allowedRoles=new Set\(\['owner','manager','production'\]\)/.test(src)&&/allowedRoles\.has\(role\)/.test(src)],
  ['confirma a mesma identidade antes de ativar',/session\?\.user\?\.id!==expectedUserId/.test(src)&&/activeUserId=expectedUserId/.test(src)],
  ['captura falha de transporte ao confirmar sessão',/async function confirmedSession\(\).*?try\{.*?auth\.getSession\(\).*?catch\{return null\}/s.test(src)],
  ['falha fechada quando sessão não pode ser confirmada',/const session=await confirmedSession\(\);.*?session\?\.user\?\.id!==expectedUserId/s.test(src)&&/start\(\)\.catch\(\(\)=>clearProduction\(\)\)/.test(src)],
  ['revalida identidade após RPC de produção',/await sb\.rpc\('padoka_record_production'.*?const session=await confirmedSession\(\).*?session\?\.user\?\.id!==userId/s.test(src)],
  ['captura falha de transporte no probe da capability',/try\{probe=await sb\.from\('padoka_production_batches'\).*?catch\(error\).*?return/s.test(src)],
  ['encerra subscription no pagehide',/pagehide/.test(src)&&/authSubscription\?\.unsubscribe/.test(src)],
  ['carregamento interno inclui módulo',/production-completion\.js/.test(fs.readFileSync('assets/internal-nav.js','utf8'))]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed){console.error(`\n${failed} verificação(ões) falharam.`);process.exit(1)}
console.log('\nAuditoria do frontend de produção concluída.');
