import fs from 'node:fs';

const pages=['index.html','produto.html','acompanhamento.html','conta.html','gestao.html','internal.html','mfa.html','pagamento.html','pdv.html','pedidos.html','enterprise.html'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  if(!/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(source))fail(page+': CSP meta ausente');
  if(!/script-src-attr 'none'/.test(source))fail(page+': atributos JavaScript inline não estão bloqueados');
  if(!/object-src 'none'/.test(source))fail(page+': object-src não está bloqueado');
  if(!/base-uri 'self'/.test(source))fail(page+': base-uri não está restrito');
  if(!/https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co/.test(source))fail(page+': CSP não contém o backend PADOKA esperado');
  if(/\son[a-z]+\s*=/i.test(source))fail(page+': handler inline on*= detectado');
}
for(const page of ['index.html','produto.html','gestao.html','pdv.html']){
  const source=fs.readFileSync(page,'utf8');
  if(!source.includes('assets/image-fallback.js'))fail(page+': fallback externo de imagem ausente');
  if(!source.includes('data-padoka-fallback'))fail(page+': imagens sem marcador de fallback seguro');
}

if(!process.exitCode)console.log('Browser CSP audit: OK');
