import fs from 'node:fs';

const catalog=fs.readFileSync('assets/catalog.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};
const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';

expect(catalog.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`),'Catálogo deve fixar explicitamente a origem do backend PADOKA.');
expect(catalog.includes("typeof window.PADOKA_RUNTIME?.getPublicConfig!=='function'"),'Catálogo deve falhar fechado sem o runtime PADOKA.');
expect(catalog.includes('await window.PADOKA_RUNTIME.getPublicConfig()'),'Catálogo deve obter a configuração pública apenas pelo runtime PADOKA.');
expect(!catalog.includes('padoka-public-config'),'Catálogo não deve manter fetch próprio/fallback para public config.');
expect(catalog.includes("value.scope!=='padoka'"),'Catálogo deve validar o escopo PADOKA retornado pelo runtime.');
expect(catalog.includes("url.protocol!=='https:'||url.origin!==PADOKA_ORIGIN||url.pathname!=='/'"),'Catálogo deve rejeitar configuração apontando para outro backend ou caminho.');
expect(catalog.includes('return {...value,url:PADOKA_ORIGIN,publishableKey:key};'),'Catálogo deve normalizar a configuração para a origem PADOKA fixada.');
expect(catalog.includes('const endpoint=`${PADOKA_ORIGIN}/rest/v1/padoka_products?'),'Consulta de produtos deve usar somente a origem PADOKA fixada.');
expect(!catalog.includes('`${cfg.url}/rest/v1/padoka_products?'),'Catálogo não pode consultar diretamente uma URL recebida da configuração.');
expect(catalog.includes("credentials:'omit'"),'Consulta pública do catálogo deve omitir credenciais do navegador.');
expect(catalog.includes("redirect:'error'"),'Consulta pública do catálogo deve rejeitar redirecionamentos.');
expect(!/service_role|sb_secret_/i.test(catalog),'Catálogo não pode expor credenciais privilegiadas do Supabase.');
expect(!catalog.includes('InfoTech.io'),'Catálogo PADOKA não deve referenciar InfoTech.io.');

console.log('catalog-backend-pinning-audit: ok');