import fs from 'node:fs';

const migration=fs.readFileSync('supabase/007_loss_idempotency.sql','utf8');
const exposureMigration=fs.readFileSync('supabase/033_loss_rpc_exposure_hardening.sql','utf8');
const migrationCode=migration.replace(/^\s*--.*$/gm,'');
const frontend=fs.readFileSync('assets/loss-registration.js','utf8');
const operationalSync=fs.readFileSync('assets/operational-sync.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');

const checks=[
  ['migration alvo correto',/yncspxfsvlqdnodlsosb/.test(migration)&&/NÃO aplicar no projeto InfoTech\.io/.test(migration)],
  ['sem trigger global em auth.users',!/create\s+trigger[\s\S]{0,600}?\bon\s+auth\.users\b/i.test(migrationCode)],
  ['request_id único',/padoka_losses_request_id_uidx/.test(migration)&&/where request_id is not null/i.test(migration)],
  ['RPC idempotente dedicada',/padoka_register_loss_once/.test(migration)&&/p_request_id uuid/.test(migration)],
  ['rejeita conflito de request id',/loss request id conflict/.test(migration)],
  ['lock de estoque antes da baixa',/padoka_inventory[\s\S]*for update/i.test(migration)],
  ['bloqueia estoque insuficiente',/insufficient inventory/.test(migration)],
  ['movimento referencia a perda',/source,reference_id[\s\S]*'loss',v_loss\.id/s.test(migration)],
  ['anon não executa RPC',/revoke all on function public\.padoka_register_loss_once[\s\S]*from public, anon/i.test(migration)],
  ['RPC legada não é executável pelo navegador',/revoke execute on function public\.padoka_register_loss\(text, numeric, text, text\) from public, anon, authenticated/i.test(exposureMigration)],
  ['RPC idempotente segue disponível ao autenticado',/grant execute on function public\.padoka_register_loss_once\(text, numeric, text, text, uuid\) to authenticated, service_role/i.test(exposureMigration)],
  ['frontend usa RPC idempotente',/rpc\('padoka_register_loss_once'/.test(frontend)],
  ['frontend preserva request no sessionStorage',/sessionStorage/.test(frontend)&&/padoka_pending_loss_v2/.test(frontend)],
  ['retry mantém mesmos dados',/pending\|\|currentOperation\(userId\)/.test(frontend)&&/Tentar novamente/.test(frontend)],
  ['retry é isolado por identidade do staff',/function storageKey\(userId\)[\s\S]*KEY_PREFIX[\s\S]*userId/.test(frontend)&&/v\?\.userId===expectedUserId/.test(frontend)&&/return \{requestId:uuid\(\),userId,productId,quantity,reason,note\}/.test(frontend)],
  ['troca de conta não apaga retry ambíguo do funcionário anterior',/function resetForIdentityChange\(\)[\s\S]*pending=null;activeUserId=''/.test(frontend)&&!/function resetForIdentityChange\(\)[\s\S]{0,120}savePending\(null/.test(frontend)],
  ['chave legada compartilhada é descartada',/LEGACY_KEY='padoka_pending_loss_v1'/.test(frontend)&&/sessionStorage\.removeItem\(LEGACY_KEY\)/.test(frontend)],
  ['resposta ambígua não libera formulário',/networkish\(rpcError\)[\s\S]*lockForm\(true\)/.test(frontend)],
  ['rejeição de transporte é capturada sem perder request_id',/try\s*\{[\s\S]*await sb\.rpc\('padoka_register_loss_once'[\s\S]*\}catch\(error\)\{[\s\S]*rpcError=/.test(frontend)&&/if\(networkish\(rpcError\)\)[\s\S]*Tente novamente com os mesmos dados/.test(frontend)],
  ['releitura de sessão usa helper fail-closed',/async function getSessionSafe\(epoch,userId=''\)[\s\S]*try\s*\{[\s\S]*await sb\.auth\.getSession\(\)[\s\S]*catch\(error\)[\s\S]*blockCapability/.test(frontend)&&/const latestSession=await getSessionSafe\(epoch,userId\)/.test(frontend)],
  ['helper de sessão rejeita erro retornado pelo Supabase Auth',/const \{data,error\}=await sb\.auth\.getSession\(\);[\s\S]*if\(error\)throw error;[\s\S]*const session=data\?\.session\|\|null/.test(frontend)],
  ['probe de capability captura rejeição de transporte',/try\s*\{[\s\S]*probe=await sb\.from\('padoka_losses'\)\.select\('request_id'\)\.limit\(1\)[\s\S]*\}catch\(error\)[\s\S]*blockCapability/.test(frontend)],
  ['inicialização não revela perdas sem sessão confirmada',/const session=await getSessionSafe\(epoch\);[\s\S]*if\(!session\)return blockCapability\(\)/.test(frontend)],
  ['clique é interceptado mesmo sem capability',/function intercept\(e\)[\s\S]*if\(!btn\)return;[\s\S]*preventDefault\(\)[\s\S]*if\(!enabled\)/.test(frontend)],
  ['capability ausente mantém formulário bloqueado',/function blockCapability[\s\S]*btn\.disabled=true[\s\S]*Registro indisponível/.test(frontend)&&/if\(probe\.error\)[\s\S]*blockCapability\(\)/.test(frontend)],
  ['handler legado é neutralizado por defesa em profundidade',/function detachLegacyHandler\(\)[\s\S]*btn\.onclick=null/.test(frontend)&&/enabled=true;detachLegacyHandler\(\)/.test(frontend)],
  ['frontend não altera estoque diretamente',!/(from\('padoka_inventory'\).*?(insert|update|upsert)|\.from\('padoka_inventory'\)\.update)/s.test(frontend)],
  ['módulo carrega só na gestão',/gestao\.html/.test(frontend)&&/loss-registration\.js/.test(nav)],
  ['sincronizador operacional não contém RPC legada de perdas',!/rpc\('padoka_register_loss'/.test(operationalSync)&&!/function registerLoss\(/.test(operationalSync)&&!/lossSave'\);if\(btn\)btn\.onclick/.test(operationalSync)],
  ['lifecycle acompanha Supabase Auth',/onAuthStateChange/.test(frontend)&&/INITIAL_SESSION/.test(frontend)&&/TOKEN_REFRESHED/.test(frontend)],
  ['troca de identidade invalida somente estado em memória',/function resetForIdentityChange\(\)[\s\S]*lifecycleEpoch\+=1;pending=null;activeUserId=''[\s\S]*blockCapability/.test(frontend)],
  ['papel interno é revalidado antes de reativar perdas',/allowedRoles=new Set\(\['owner','manager','stock','production'\]\)/.test(frontend)&&/padokaStaffRole/.test(frontend)&&/padokaCanAccess\('perdas'\)/.test(frontend)],
  ['resposta assíncrona antiga é invalidada pela identidade capturada',/const epoch=lifecycleEpoch,userId=activeUserId/.test(frontend)&&/epoch!==lifecycleEpoch/.test(frontend)&&/getSessionSafe\(epoch,userId\)/.test(frontend)],
  ['operação pendente nunca cruza identidade',/if\(op\.userId!==userId\)\{resetForIdentityChange\(\);return\}/.test(frontend)],
  ['nova sessão só reativa fora do callback de auth',/setTimeout\(\(\)=>activateForUser\(nextUserId\),0\)/.test(frontend)]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed){console.error(`\n${failed} verificação(ões) falharam.`);process.exit(1)}
console.log('\nAuditoria de perdas idempotentes concluída.');
