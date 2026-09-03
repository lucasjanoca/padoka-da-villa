import fs from 'node:fs';

const production=fs.readFileSync('assets/production-completion.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const gestao=fs.readFileSync('gestao.html','utf8');

const PADOKA_REF='yncspxfsvlqdnodlsosb';
const PADOKA_ORIGIN=`https://${PADOKA_REF}.supabase.co`;

const checks=[
  ['gestão fixa o backend correto da PADOKA',gestao.includes(`${PADOKA_ORIGIN}/functions/v1/padoka-public-config`)],
  ['CSP conecta somente ao backend PADOKA',gestao.includes(`connect-src 'self' ${PADOKA_ORIGIN} wss://${PADOKA_REF}.supabase.co`)&&!gestao.includes('https://*.supabase.co')&&!gestao.includes('wss://*.supabase.co')],
  ['guard interno fixa o mesmo origin',nav.includes(`const PADOKA_SUPABASE_ORIGIN='${PADOKA_ORIGIN}'`)&&nav.includes("throw new Error('PADOKA backend mismatch')"))],
  ['produção é carregada somente após validação interna',/function loadValidatedModuleScripts\(role\)[\s\S]*?if\(!allowed\(current,role\)\)return;[\s\S]*?if\(current==='producao'\)loadScript\('assets\/production-completion\.js','padokaProduction'\)/.test(nav)],
  ['papéis da produção permanecem mínimos',/producao:\['owner','manager','production'\]/.test(nav)&&/allowedRoles=new Set\(\['owner','manager','production'\]\)/.test(production)],
  ['módulo exige sessão confirmada antes da RPC',/const preflightSession=await confirmedSession\(\);[\s\S]*?preflightSession\?\.user\?\.id!==userId[\s\S]*?await sb\.rpc\('padoka_record_production'/.test(production)],
  ['produção usa apenas objetos padoka_',!/(?:from|rpc)\(['"](?!padoka_)[^'"]+['"]\)/.test(production)],
  ['produção não escreve estoque diretamente',!/from\('padoka_inventory'\)[\s\S]*?\.(?:insert|update|upsert)\(/.test(production)],
  ['retry é isolado pela identidade do funcionário',/scopedPendingKey\(userId=activeUserId\)/.test(production)&&/entry\?\.userId===activeUserId/.test(production)],
  ['troca de sessão encerra realtime e invalida respostas antigas',/removeChannel\(channel\)/.test(production)&&/lifecycleEpoch\+=1/.test(production)&&/onAuthStateChange/.test(production)],
  ['nenhuma credencial privilegiada está no frontend',!/(service_role|sb_secret_)/i.test(production+nav+gestao)],
  ['InfoTech.io não participa do runtime interno',!/infotech(?:-io)?\.com\.br|infotech\.io/i.test(production+nav+gestao)]
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
console.log('\nAuditoria da fronteira de backend da produção concluída.');
