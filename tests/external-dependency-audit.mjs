import fs from 'node:fs';

const pages=['conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  const supabase=[...source.matchAll(/<script\b[^>]+src=["']([^"']*supabase-js[^"']*)["'][^>]*>/gi)];
  for(const match of supabase){
    if(!match[1].includes('@2.112.4'))fail(page+': Supabase JS não está fixado em 2.112.4');
    if(/@2(?:["'\/]|$)/.test(match[1]))fail(page+': versão flutuante do Supabase detectada');
    if(!/referrerpolicy=["']no-referrer["']/i.test(match[0]))fail(page+': Supabase externo sem referrerpolicy');
  }
}

const pdv=fs.readFileSync('pdv.html','utf8');
const qr=pdv.match(/<script\b[^>]+src=["']https:\/\/cdn\.jsdelivr\.net\/npm\/html5-qrcode@2\.3\.8\/html5-qrcode\.js["'][^>]*>/i);
if(!qr)fail('PDV: html5-qrcode fixado em 2.3.8 ausente');
else{
  if(!qr[0].includes('integrity="sha512-r6rDA7W6ZeQhvl8S7yRVQUKVHdexq+GAlNkNNqVC7YyIV+NwqCTJe2hDWCiffTyRNOeGEzRRJ9ifvRm/HCzGYg=="'))fail('PDV: SRI do html5-qrcode ausente ou alterado');
  if(!/crossorigin=["']anonymous["']/i.test(qr[0]))fail('PDV: html5-qrcode sem crossorigin anonymous');
  if(!/referrerpolicy=["']no-referrer["']/i.test(qr[0]))fail('PDV: html5-qrcode sem referrerpolicy');
}

if(!process.exitCode)console.log('External dependency supply-chain audit: OK');
