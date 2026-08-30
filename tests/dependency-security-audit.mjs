import fs from 'node:fs';

const pages=['acompanhamento.html','conta.html','gestao.html','internal.html','mfa.html','pagamento.html','pdv.html','pedidos.html'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  for(const match of source.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)){
    const src=match[1];
    if(src.includes('@supabase/supabase-js')){
      if(src!=='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4'){
        fail(`${page}: Supabase JS sem versão exata aprovada: ${src}`);
      }
    }
    if(src.includes('html5-qrcode')&&src!=='https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'){
      fail(`${page}: html5-qrcode sem versão exata aprovada: ${src}`);
    }
  }
  if(/@supabase\/supabase-js@2(?:["'\/]|$)/.test(source) && !/@supabase\/supabase-js@2\.112\.4/.test(source)){
    fail(`${page}: referência genérica @supabase/supabase-js@2 detectada`);
  }
}

const pix=fs.readFileSync('supabase/functions/padoka-pix-checkout/index.ts','utf8');
if(!/npm:@supabase\/supabase-js@2\.112\.4/.test(pix))fail('Pix Edge: supabase-js não está fixado em 2.112.4');

if(!process.exitCode)console.log('Dependency security audit: OK');
