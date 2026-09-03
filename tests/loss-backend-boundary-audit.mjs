import fs from 'node:fs';

const loss=fs.readFileSync('assets/loss-registration.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const gestao=fs.readFileSync('gestao.html','utf8');

const PADOKA_REF='yncspxfsvlqdnodlsosb';
const PADOKA_ORIGIN=`https://${PADOKA_REF}.supabase.co`;

const checks=[
  ['gestão fixa o backend correto da PADOKA',gestao.includes(`${PADOKA_ORIGIN}/functions/v1/padoka-public-config`)],
  ['CSP conecta somente ao backend PADOKA',gestao.includes(`connect-src 'self' ${PADOKA_ORIGIN} wss://${PADOKA_REF}.supabase.co`)&&!gestao.includes('https://*.supabase.co')&&!gestao.includes('wss://*.supabase.co')],
  ['guard interno fixa o mesmo origin',nav.includes(`const PADOKA_SUPABASE_ORIGIN='${PADOKA_ORIGIN}'`)&&nav.includes("throw new Error('PADOKA backend mismatch')")],
  ['perdas são carregadas somente após validação interna',/function loadValidatedModuleScripts\(role\)[\s\S]*?if\(!allowed\(current,role\)\)return;[\s\S]*?if\(current==='perdas'\)loadScript\('assets\/loss-registration\.js','padokaLoss'\)/.test(nav)],
  ['papéis de perdas permanecem mínimos',/perdas:\['owner','manager','stock','production'\]/.test(nav)&&/allowedRoles=new Set\(\['owner','manager','stock','production'\]\)/.test(loss)],
  ['módulo exige sessão confirmada antes da RPC',/const sessionBeforeRpc=await getSessionSafe\(epoch,userId\);[\s\S]*?if\(!sessionBeforeRpc\)return resetForIdentityChange\(\);[\s\S]*?await sb\.rpc\('padoka_register_loss_once'/.test(loss)],
  ['perdas usam apenas objetos padoka_',!/(?:from|rpc)\(['"](?!padoka_)[^'"]+['"]\)/.test(loss)],
  ['perdas não escrevem estoque diretamente',!/from\('padoka_inventory'\)[\s\S]*?\.(?:insert|update|upsert)\(/.test(loss)],
  ['retry é isolado pela identidade do funcionário',/function storageKey\(userId\)[\s\S]*?KEY_PREFIX[\s\S]*?userId/.test(loss)&&/v\?\.userId===expectedUserId/.test(loss)&&/op\.userId!==userId/.test(loss)],
  ['troca de sessão invalida estado e respostas antigas',/function resetForIdentityChange\(\)[\s\S]*?lifecycleEpoch\+=1/.test(loss)&&/onAuthStateChange/.test(loss)&&/epoch!==lifecycleEpoch/.test(loss)],
  ['capability de perdas é fail-closed',/function blockCapability[\s\S]*?enabled=false[\s\S]*?btn\.disabled=true/.test(loss)&&/if\(probe\.error\)[\s\S]*?blockCapability\(\)/.test(loss)],
  ['nenhuma credencial privilegiada está no frontend',!/(service_role|sb_secret_)/i.test(loss+nav+gestao)],
  ['InfoTech.io não participa do runtime interno',!/infotech(?:-io)?\.com\.br|infotech\.io/i.test(loss+nav+gestao)]
];

let failed=0;
for(const [name,ok] of checks){
  console.log(`${ok?'✓':'✗'} ${name}`);
  if(!ok)failed++;
}
if(failed){
  console.error(`\n${failed} verificação(ões) falharam.`);
  process.exit(1);
}
console.log('\nAuditoria da fronteira de backend de perdas concluída.');
