import fs from 'node:fs';

const catalog=fs.readFileSync('assets/catalog.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};
const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';

expect(catalog.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`),'Catálogo deve fixar explicitamente a origem do backend PADOKA.');
expect(catalog.includes("const CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config'"),'Public config do catálogo deve derivar da origem PADOKA fixada.');
expect(catalog.includes('const requirePadokaOrigin=value=>'),'Catálogo deve validar a origem retornada pelo public config.');
expect(/url\.origin!==PADOKA_ORIGIN/.test(catalog),'Catálogo deve rejeitar public config apontando para outro backend.');
expect(catalog.includes('const origin=requirePadokaOrigin(cfg.url);'),'Catálogo deve validar cfg.url antes de consultar produtos.');
expect(catalog.includes("typeof cfg.publishableKey!=='string'||!cfg.publishableKey.trim()"),'Catálogo deve rejeitar publishable key ausente ou vazia.');
expect(catalog.includes('const endpoint=`${origin}/rest/v1/padoka_products?'),'Consulta de produtos deve usar somente a origem PADOKA já validada.');
expect(!catalog.includes('`${cfg.url}/rest/v1/padoka_products?'),'Catálogo não pode consultar diretamente a URL não validada do public config.');
expect(!catalog.includes('InfoTech.io'),'Catálogo PADOKA não deve referenciar InfoTech.io.');

console.log('catalog-backend-pinning-audit: ok');