import fs from 'node:fs';

const pages=['index.html','produto.html','acompanhamento.html','conta.html','gestao.html','internal.html','mfa.html','pagamento.html','pdv.html','pedidos.html','enterprise.html'];
const guard=fs.readFileSync('assets/frame-guard.js','utf8');
const css=fs.readFileSync('assets/runtime-security.css','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

if(!guard.includes('window.top === window.self'))fail('Frame guard: verificação top/self ausente');
if(!guard.includes("classList.add('padoka-framed')"))fail('Frame guard: fail-closed visual ausente');
if(!css.includes('.padoka-framed body{display:none!important}'))fail('Frame guard: regra CSS fail-closed ausente');

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  if(!source.includes('assets/frame-guard.js'))fail(page+': frame guard ausente');
  if(!/<meta\s+name=["']referrer["']\s+content=["']strict-origin-when-cross-origin["']/i.test(source))
    fail(page+': meta Referrer-Policy ausente');
  const bodyPos=source.search(/<body\b/i);
  const guardPos=source.indexOf('assets/frame-guard.js');
  if(bodyPos>=0 && guardPos>bodyPos)fail(page+': frame guard deve carregar antes do body');
}

if(!process.exitCode)console.log('Anti-clickjacking/referrer audit: OK');
