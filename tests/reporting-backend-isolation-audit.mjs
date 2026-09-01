import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/reporting-sync.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('Relatórios devem fixar explicitamente a origem do backend PADOKA.');
if(!source.includes('function isPadokaClient(candidate)'))fail('Relatórios devem validar a instância Supabase antes de usar Auth ou RPC.');
if(!source.includes("new URL(candidate?.supabaseUrl||'').origin===PADOKA_ORIGIN"))fail('Validação do relatório deve comparar a origem da instância com Sites De Clientes!.');
if(!source.includes('const candidate=window.padokaSupabase;if(!isPadokaClient(candidate)){clearReporting();return}sb=candidate;'))fail('Inicialização dos relatórios deve falhar fechado antes de vincular uma instância de outro projeto.');
const guardIndex=source.indexOf('if(!isPadokaClient(candidate)){clearReporting();return}');
const authIndex=source.indexOf('watchAuth();');
if(guardIndex<0||authIndex<0||guardIndex>authIndex)fail('Pinning do backend deve acontecer antes de registrar listeners de Auth.');
if(!source.includes("sb.rpc('padoka_report_summary'"))fail('Relatórios devem continuar usando a RPC server-authoritative padoka_report_summary.');
if(!source.includes("new Set(['owner','manager'])"))fail('Relatórios financeiros devem permanecer restritos à gerência.');
if(!source.includes("table:'padoka_sales'"))fail('Realtime do relatório deve permanecer restrito a objetos padoka_.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend de relatórios nunca deve conter credencial administrativa.');

console.log('reporting-backend-isolation-audit: ok');
