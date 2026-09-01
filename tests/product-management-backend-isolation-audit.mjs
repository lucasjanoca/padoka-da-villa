import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/product-management.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_SUPABASE_URL='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('Gestão de catálogo deve fixar explicitamente o backend PADOKA.');
if(!source.includes('const isExpectedBackend=candidate=>!!candidate&&candidate.supabaseUrl===PADOKA_SUPABASE_URL;'))fail('Gestão de catálogo deve validar a origem da instância Supabase.');
if(!source.includes('const candidate=window.padokaSupabase;'))fail('Contexto do catálogo deve capturar a instância global como candidata antes do uso.');
if(!source.includes('if(!isExpectedBackend(candidate))return null;'))fail('Instância de backend inesperado deve falhar fechado.');
const guardIndex=source.indexOf('if(!isExpectedBackend(candidate))return null;');
const authIndex=source.indexOf('bindAuthLifecycle();');
if(guardIndex<0||authIndex<0||guardIndex>authIndex)fail('Pinning do backend deve ocorrer antes de listeners de Auth.');
if(!source.includes("!['owner','manager'].includes(context.role)"))fail('Gestão de catálogo deve permanecer restrita a owner/manager.');
if(!source.includes("client.rpc('padoka_list_products_admin')"))fail('Listagem administrativa deve continuar server-authoritative.');
if(!source.includes("client.rpc('padoka_save_product'"))fail('Gravação do catálogo deve continuar server-authoritative.');
if(!source.includes("table:'padoka_products'"))fail('Realtime deve permanecer restrito a padoka_products.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend de catálogo nunca deve conter credencial administrativa.');

console.log('product-management-backend-isolation-audit: ok');
