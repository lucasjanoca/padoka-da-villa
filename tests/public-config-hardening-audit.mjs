import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/app-runtime.js',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/padoka-public-config/index.ts',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_PROJECT_REF='yncspxfsvlqdnodlsosb'"))fail('Runtime deve permanecer fixado no project ref correto da PADOKA.');
if(!source.includes("value.scope!=='padoka'"))fail('Configuração pública deve exigir scope padoka.');
if(!source.includes("url.origin===PADOKA_ORIGIN&&url.pathname==='/'"))fail('URL retornada pela configuração pública deve apontar exatamente para a raiz do backend PADOKA.');
if(!source.includes("value.startsWith('sb_publishable_')||value.startsWith('eyJ')"))fail('Runtime deve aceitar somente chave publishable moderna ou anon JWT legado.');
if(!source.includes("/^sb_secret_/i.test(value)||/service_role/i.test(value)"))fail('Runtime deve rejeitar explicitamente credenciais administrativas.');
if(!source.includes("credentials:'omit',redirect:'error'"))fail('Busca da configuração pública deve omitir credenciais e rejeitar redirects.');
if(!source.includes("contentType.includes('application/json')"))fail('Resposta da configuração pública deve exigir JSON.');
if(!edge.includes('const PADOKA_PROJECT_URL = "https://yncspxfsvlqdnodlsosb.supabase.co"'))fail('Edge Function deve continuar fixada no backend PADOKA.');
if(!edge.includes('value.startsWith("sb_publishable_")'))fail('Edge Function deve preferir chave publishable.');
if(/sb_secret_|service_role/i.test(edge))fail('Edge Function pública não deve referenciar credencial administrativa.');

console.log('public-config-hardening-audit: ok');
