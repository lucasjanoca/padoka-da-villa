import fs from 'node:fs';

const source=fs.readFileSync('assets/admin-dashboard-live.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

const expectedUrl='https://yncspxfsvlqdnodlsosb.supabase.co';
expect(source.includes(`const PADOKA_SUPABASE_URL='${expectedUrl}'`),'Dashboard interno deve fixar explicitamente o backend PADOKA correto.');
expect(source.includes("const isPadokaClient=candidate=>!!candidate&&String(candidate.supabaseUrl||'').replace(/\\/+$/,'')===PADOKA_SUPABASE_URL"),'Dashboard deve validar localmente a origem da instância Supabase.');
expect(source.includes('const padokaClient=()=>'),'Dashboard deve centralizar a obtenção da instância já validada.');

const safeSessionStart=source.indexOf('async function safeSession(){');
const safeClient=source.indexOf('const client=padokaClient();',safeSessionStart);
const authRead=source.indexOf('client.auth.getSession()',safeSessionStart);
expect(safeSessionStart>=0&&safeClient>safeSessionStart&&safeClient<authRead,'Leitura de sessão do dashboard deve ocorrer somente após validar o backend PADOKA.');

const ordersStart=source.indexOf('async function refreshOrders(');
const ordersClient=source.indexOf('const client=padokaClient();',ordersStart);
const ordersRead=source.indexOf("client.from('padoka_orders')",ordersStart);
expect(ordersClient>ordersStart&&ordersClient<ordersRead,'Pedidos do dashboard só podem ser consultados pela instância validada.');

const opsStart=source.indexOf('async function refreshOperational(');
const opsClient=source.indexOf('const client=padokaClient();',opsStart);
const inventoryRead=source.indexOf("client.from('padoka_inventory')",opsStart);
const productionRead=source.indexOf("client.from('padoka_production_plans')",opsStart);
expect(opsClient>opsStart&&opsClient<inventoryRead&&opsClient<productionRead,'Alertas operacionais só podem consultar tabelas PADOKA após project pinning.');

expect(source.includes("table:'padoka_orders'")&&source.includes("table:'padoka_inventory'")&&source.includes("table:'padoka_production_plans'"),'Realtime do dashboard deve permanecer limitado às tabelas padoka_ esperadas.');
expect(source.includes("new Set(['owner','manager','stock'])")&&source.includes("new Set(['owner','manager','production'])"),'Papéis operacionais do dashboard devem continuar explicitamente limitados.');
expect(!source.includes('service_role')&&!source.includes('sb_secret_'),'Dashboard público não pode conter credencial administrativa.');
expect(!/infotech/i.test(source),'Dashboard PADOKA não pode depender do backend InfoTech.');

console.log('admin-dashboard-backend-isolation-audit: ok');
