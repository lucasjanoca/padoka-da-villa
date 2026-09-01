import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/customer-notifications.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('Central de notificações deve fixar a origem do projeto PADOKA.');
if(!source.includes('function isPadokaClient(candidate)'))fail('Central de notificações deve validar explicitamente a instância Supabase recebida.');
if(!source.includes('new URL(candidate.supabaseUrl).origin===PADOKA_ORIGIN'))fail('Validação da instância deve comparar a origem Supabase com o backend PADOKA.');
if(!source.includes('if(!isPadokaClient(nextClient))return;'))fail('Bind das notificações deve falhar fechado para clientes Supabase de outro projeto.');
if(!source.includes(".from('padoka_customer_notifications')"))fail('Central deve continuar consultando somente a tabela de notificações PADOKA.');
if(!source.includes(".eq('user_id',userId)"))fail('Consulta de notificações deve continuar explicitamente limitada ao usuário autenticado atual.');
if(!source.includes("filter:'user_id=eq.'+userId"))fail('Realtime deve continuar filtrado pelo usuário autenticado atual.');
if(!source.includes('sessionStillCurrent(epoch,userId)'))fail('Operações de notificações devem continuar revalidando lifecycle e sessão.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend de notificações nunca deve conter credencial administrativa.');

console.log('customer-notifications-backend-isolation-audit: ok');
