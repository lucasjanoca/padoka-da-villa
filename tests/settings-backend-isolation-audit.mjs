import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/settings-sync.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_SUPABASE_URL='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('Configurações internas devem fixar explicitamente o backend PADOKA.');
if(!source.includes('function isExpectedBackend(candidate)'))fail('Configurações internas devem validar a instância Supabase antes de usar Auth/RPC.');
if(!source.includes('candidate.supabaseUrl===PADOKA_SUPABASE_URL'))fail('Validação das configurações deve rejeitar cliente de outro projeto Supabase.');
if(!source.includes('const candidate=window.padokaSupabase;'))fail('Inicialização deve capturar a instância como candidata antes de vinculá-la.');
if(!source.includes("if(!isExpectedBackend(candidate)){\n      blockLegacyFallback('Não foi possível validar o servidor da PADOKA. As configurações permanecem bloqueadas.');"))fail('Instância de backend inesperado deve falhar fechado.');
const guardIndex=source.indexOf('if(!isExpectedBackend(candidate))');
const authIndex=source.indexOf('watchAuth();');
if(guardIndex<0||authIndex<0||guardIndex>authIndex)fail('Pinning do backend deve ocorrer antes dos listeners de Auth.');
if(!source.includes("sb.rpc('padoka_get_settings')"))fail('Leitura deve continuar server-authoritative pela RPC padoka_get_settings.');
if(!source.includes("sb.rpc('padoka_update_settings'"))fail('Gravação deve continuar server-authoritative pela RPC padoka_update_settings.');
if(!source.includes("const allowedRoles=new Set(['owner','manager'])"))fail('Configurações internas devem permanecer restritas a owner/manager.');
if(!source.includes("table:'padoka_settings'"))fail('Realtime deve permanecer restrito a padoka_settings.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend de configurações nunca deve conter credencial administrativa.');

console.log('settings-backend-isolation-audit: ok');
