import fs from 'node:fs';

const source=fs.readFileSync('assets/staff-management.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

const expectedUrl='https://yncspxfsvlqdnodlsosb.supabase.co';
expect(source.includes(`const PADOKA_SUPABASE_URL='${expectedUrl}'`),'Gestão de equipe deve fixar explicitamente o backend PADOKA correto.');
expect(source.includes("const isPadokaClient=candidate=>!!candidate&&String(candidate.supabaseUrl||'').replace(/\\/+$/,'')===PADOKA_SUPABASE_URL"),'Gestão de equipe deve validar localmente a origem da instância Supabase.');

const waitStart=source.indexOf('async function waitForContext(){');
const backendCheck=source.indexOf('isPadokaClient(window.padokaSupabase)',waitStart);
const contextReturn=source.indexOf('return {client:window.padokaSupabase,role:window.padokaStaffRole}',waitStart);
const sessionRead=source.indexOf('client.auth.getSession()');
const firstRpc=source.indexOf("client.rpc('padoka_list_staff')");
expect(waitStart>=0&&backendCheck>waitStart&&backendCheck<contextReturn,'Contexto interno só pode aceitar a instância Supabase após validar o project ref PADOKA.');
expect(backendCheck<sessionRead&&backendCheck<firstRpc,'Project pinning deve ocorrer antes de qualquer leitura de Auth ou RPC de equipe.');

expect(source.includes("context.role!=='owner'"),'Gestão de equipe deve continuar exclusiva do papel owner.');
expect(source.includes("client.rpc('padoka_list_staff')")&&source.includes("client.rpc('padoka_update_staff'")&&source.includes("client.rpc('padoka_add_staff_by_email'"),'Listagem, alteração e inclusão de staff devem continuar server-authoritative por RPCs padoka_.');
expect(source.includes("table:'padoka_staff_users'"),'Realtime da equipe deve continuar limitado à tabela padoka_staff_users.');
expect(!source.includes('service_role')&&!source.includes('sb_secret_'),'Frontend de equipe não pode conter credencial administrativa.');
expect(!/infotech/i.test(source),'Gestão de equipe PADOKA não pode depender do backend InfoTech.');

console.log('staff-management-backend-isolation-audit: ok');
