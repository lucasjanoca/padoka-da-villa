import fs from 'node:fs';

const js=fs.readFileSync('assets/pdv-sale-void.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const pdv=fs.readFileSync('pdv.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';

need(nav,/PADOKA_SUPABASE_ORIGIN=['"]https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co['"]/,'navegação interna precisa fixar o backend correto da PADOKA');
need(nav,/if\(origin!==PADOKA_SUPABASE_ORIGIN\)throw new Error\(['"]PADOKA backend mismatch['"]\)/,'client interno precisa falhar fechado para origem Supabase diferente');
need(nav,/originalCreateClient\(PADOKA_SUPABASE_ORIGIN,key,options\)/,'wrapper interno deve criar clientes somente na origem PADOKA fixada');
need(nav,/if\(isPdv\)\{[\s\S]*loadScript\(['"]assets\/pdv-sale-void\.js['"],['"]padokaPdvSaleVoid['"]\)/,'módulo de estorno precisa ser carregado somente pelo fluxo interno validado do PDV');
need(nav,/if\(!allowed\(current,role\)\)return;[\s\S]*if\(isPdv\)/,'scripts sensíveis do PDV só podem carregar depois da autorização de papel');

need(pdv,/connect-src 'self' https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co wss:\/\/yncspxfsvlqdnodlsosb\.supabase\.co/,'CSP do PDV precisa limitar conexões ao backend PADOKA');
need(pdv,/assets\/internal-nav\.js[\s\S]*CONFIG_URL=['"]https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co\/functions\/v1\/padoka-public-config['"]/,'pinning interno deve ser instalado antes do bootstrap Supabase do PDV');
forbid(pdv,/https:\/\/(?!yncspxfsvlqdnodlsosb\.supabase\.co)[a-z0-9-]+\.supabase\.co/i,'PDV não pode apontar para outro projeto Supabase');

need(js,/\['owner','manager'\]\.includes/i,'estorno precisa continuar limitado a owner/manager');
need(js,/window\.padokaCanAccess\('pdv'\)/i,'estorno precisa exigir permissão explícita ao módulo PDV');
need(js,/rpc\('padoka_void_sale'/i,'estorno deve permanecer server-authoritative pela RPC padoka_void_sale');
need(js,/sb\.auth\.getSession\(\)/i,'operações sensíveis precisam reconfirmar a sessão real');
need(js,/sb\.auth\.onAuthStateChange/i,'módulo precisa reagir à troca de funcionário autenticado');
need(js,/sb\.removeChannel\(channel\)/i,'troca de identidade precisa remover o canal Realtime anterior');

const fromObjects=[...js.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)].map(match=>match[1]);
if(!fromObjects.length)fail('auditoria precisa encontrar os objetos consultados pelo módulo');
for(const object of fromObjects){
  if(!object.startsWith('padoka_'))fail(`objeto fora do namespace PADOKA no estorno: ${object}`);
}
const rpcNames=[...js.matchAll(/\.rpc\(['"]([^'"]+)['"]/g)].map(match=>match[1]);
for(const rpc of rpcNames){
  if(!rpc.startsWith('padoka_'))fail(`RPC fora do namespace PADOKA no estorno: ${rpc}`);
}

forbid(js,/service_role|sb_secret_/i,'frontend de estorno nunca pode conter credencial privilegiada');
forbid(js,/infotech/i,'módulo de estorno não pode referenciar o backend InfoTech.io');
forbid(js,/localStorage|sessionStorage/i,'estorno não deve depender de estado local para autorização ou isolamento');
forbid(js,/\.from\(['"]padoka_sales['"]\)\.update/i,'frontend não pode atualizar vendas diretamente');
forbid(js,/\.from\(['"]padoka_inventory['"]\)\.(?:update|insert|upsert)/i,'frontend não pode devolver estoque diretamente');

if(!pdv.includes(PADOKA_ORIGIN))fail('PDV precisa conter explicitamente a origem do projeto PADOKA');
if(!process.exitCode)console.log('PDV sale void backend boundary audit: OK');
