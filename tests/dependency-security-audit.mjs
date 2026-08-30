import fs from 'node:fs';

const pages=['index.html','produto.html','acompanhamento.html','conta.html','gestao.html','internal.html','mfa.html','pagamento.html','pdv.html','pedidos.html','enterprise.html'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  for(const match of source.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)){
    const src=match[1];
    if(/^https?:\/\//i.test(src))fail(`${page}: script remoto proibido: ${src}`);
  }
  if(source.includes('cdn.jsdelivr.net'))fail(`${page}: CDN de JavaScript reapareceu`);
}

for(const [file,expected] of [
  ['supabase/functions/padoka-pix-checkout/index.ts',/npm:@supabase\/supabase-js@2\.112\.4/],
  ['supabase/functions/padoka-push/index.ts',/npm:@supabase\/supabase-js@2\.112\.4/]
]){
  const source=fs.readFileSync(file,'utf8');
  if(!expected.test(source))fail(file+': supabase-js do Edge não está fixado em 2.112.4');
}

const vendorWorkflow=fs.readFileSync('.github/workflows/vendor-browser-dependencies.yml','utf8');
if(!vendorWorkflow.includes('@supabase/supabase-js@2.112.4'))fail('Vendoring: Supabase não está fixado');
if(!vendorWorkflow.includes('html5-qrcode@2.3.8'))fail('Vendoring: scanner não está fixado');

if(!process.exitCode)console.log('Dependency security audit: OK (browser scripts self-hosted; Edge imports pinned)');
