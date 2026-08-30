import fs from 'node:fs';
import crypto from 'node:crypto';

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

  const meta=source.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content="([^"]+)"/i);
  const policy=meta?.[1]||'';
  const scriptDirective=(policy.match(/(?:^|;\s*)script-src\s+([^;]+)/)||[])[1]||'';
  if(scriptDirective.includes("'unsafe-inline'"))fail(page+': script-src ainda permite unsafe-inline');

  const inlineScripts=[...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!(/\bsrc\s*=/i.test(match[1]))&&match[2].trim());

  for(const match of inlineScripts){
    const hash=crypto.createHash('sha256').update(match[2],'utf8').digest('base64');
    if(!scriptDirective.includes("'sha256-"+hash+"'")){
      fail(page+': hash CSP do script inline não corresponde ao conteúdo');
    }
  }
}
for(const page of ['index.html','produto.html','gestao.html','pdv.html']){
  const source=fs.readFileSync(page,'utf8');
  if(!source.includes('assets/image-fallback.js'))fail(page+': fallback externo de imagem ausente');
  if(!source.includes('data-padoka-fallback'))fail(page+': imagens sem marcador de fallback seguro');
}

const headers=fs.readFileSync('_headers','utf8');
const headerScript=(headers.match(/script-src\s+([^;]+)/)||[])[1]||'';
if(headerScript.includes("'unsafe-inline'"))fail('_headers: script-src ainda permite unsafe-inline');
for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  for(const match of [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(x=>!(/\bsrc\s*=/i.test(x[1]))&&x[2].trim())){
    const hash=crypto.createHash('sha256').update(match[2],'utf8').digest('base64');
    if(!headerScript.includes("'sha256-"+hash+"'"))fail('_headers: hash ausente para '+page);
  }
}

if(!process.exitCode)console.log('Browser CSP audit: OK (unsafe-inline removido + hashes SHA-256 validados)');
