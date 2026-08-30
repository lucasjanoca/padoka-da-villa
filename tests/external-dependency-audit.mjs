import fs from 'node:fs';
import crypto from 'node:crypto';

const pages=['conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html'];
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const sha256=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const expectedSupabase='f8ce7fab799af1916019cbd0b485b39bb80dbdbc6dc062909a751c9e5198e04c';
const expectedQr='84313e033c6365d29923c6bf5a1490f76f893c0a1e156bbd2bb3f8a96a3523d7';
const supabasePath='vendor/supabase-js-2.112.4.js';
const qrPath='vendor/html5-qrcode-2.3.8.js';
const lock=fs.readFileSync('vendor/SHA256SUMS','utf8');

if(sha256(supabasePath)!==expectedSupabase)fail('Vendor: hash do Supabase JS mudou');
if(sha256(qrPath)!==expectedQr)fail('Vendor: hash do html5-qrcode mudou');
if(!lock.includes(expectedSupabase+'  '+supabasePath))fail('Vendor lock: Supabase JS não corresponde');
if(!lock.includes(expectedQr+'  '+qrPath))fail('Vendor lock: html5-qrcode não corresponde');

for(const page of pages){
  const source=fs.readFileSync(page,'utf8');
  if(/<script\b[^>]+src=["']https?:\/\//i.test(source))fail(page+': JavaScript remoto detectado');
  if(source.includes('cdn.jsdelivr.net'))fail(page+': referência a jsDelivr detectada');
  if(!source.includes('src="vendor/supabase-js-2.112.4.js"'))fail(page+': Supabase JS local ausente');
  if(!source.includes('integrity="sha256-+M5/q3ma8ZFgGcvQtIWzm7gNvbxtwGKQmnUcnlGY4Ew="'))fail(page+': SRI local do Supabase ausente');
}

const pdv=fs.readFileSync('pdv.html','utf8');
if(!pdv.includes('src="vendor/html5-qrcode-2.3.8.js"'))fail('PDV: scanner local fixado ausente');
if(!pdv.includes('integrity="sha256-hDE+AzxjZdKZI8a/WhSQ92+JPAoeFWu9K7P4qWo1I9c="'))fail('PDV: SRI local do scanner ausente');

if(!process.exitCode)console.log('External dependency supply-chain audit: OK (zero remote scripts + vendored hashes verified)');
