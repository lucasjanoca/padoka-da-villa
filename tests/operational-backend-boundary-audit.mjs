import fs from 'node:fs';
import assert from 'node:assert/strict';

const gestao = fs.readFileSync('gestao.html', 'utf8');
const nav = fs.readFileSync('assets/internal-nav.js', 'utf8');
const sync = fs.readFileSync('assets/operational-sync.js', 'utf8');

const PADOKA_ORIGIN = 'https://yncspxfsvlqdnodlsosb.supabase.co';
const PADOKA_WSS = 'wss://yncspxfsvlqdnodlsosb.supabase.co';

// The internal client must stay pinned to the PADOKA backend before any
// role-validated operational module is loaded.
assert.ok(nav.includes(`const PADOKA_SUPABASE_ORIGIN='${PADOKA_ORIGIN}'`), 'Internal guard perdeu o origin exato da PADOKA.');
assert.ok(nav.includes("if(origin!==PADOKA_SUPABASE_ORIGIN)throw new Error('PADOKA backend mismatch')"), 'Internal guard deve rejeitar qualquer origin Supabase diferente.');
assert.ok(nav.includes('return originalCreateClient(PADOKA_SUPABASE_ORIGIN,key,options)'), 'Cliente interno deve ser criado somente com o origin fixado da PADOKA.');

const csp = gestao.match(/Content-Security-Policy\" content=\"([^\"]+)/i)?.[1] || '';
assert.ok(csp.includes(`connect-src 'self' ${PADOKA_ORIGIN} ${PADOKA_WSS}`), 'Gestão deve restringir connect-src ao backend HTTP/WSS da PADOKA.');
assert.ok(!csp.includes('*.supabase.co'), 'Gestão não pode liberar wildcard Supabase na CSP.');

// Sensitive operational scripts must only load after the central staff guard
// resolves the role for the current authenticated user.
const staffValidation = nav.indexOf("from('padoka_staff_users')");
const moduleLoad = nav.indexOf('loadValidatedModuleScripts(role);');
assert.ok(staffValidation >= 0 && moduleLoad > staffValidation, 'Módulos operacionais não podem carregar antes da validação de staff.');
assert.ok(nav.includes('if(!allowed(current,role))return;'), 'Loader interno deve falhar fechado para papel sem acesso ao módulo atual.');
assert.ok(nav.includes("estoque:['owner','manager','stock']"), 'Estoque deve permanecer limitado a owner/manager/stock.');
assert.ok(nav.includes("producao:['owner','manager','production']"), 'Produção deve permanecer limitada a owner/manager/production.');
assert.ok(nav.includes("perdas:['owner','manager','stock','production']"), 'Perdas deve permanecer limitada aos papéis operacionais autorizados.');
assert.ok(nav.includes("relatorios:['owner','manager']"), 'Relatórios devem permanecer limitados a owner/manager.');
assert.ok(nav.includes("if(['estoque','producao','perdas','relatorios'].includes(current))loadScript('assets/operational-sync.js','padokaOps')"), 'Operational sync deve carregar somente nos módulos operacionais autorizados.');

// The operational runtime must reuse the already guarded client, scope itself
// to the active module, and re-confirm the exact staff session around I/O.
assert.ok(sync.includes('sb=window.padokaSupabase;if(!sb)return;'), 'Operational sync deve reutilizar o cliente interno já validado.');
assert.ok(!sync.includes('createClient('), 'Operational sync não deve criar um segundo cliente Supabase sem o guard central.');
assert.ok(sync.includes("if(!['estoque','producao','perdas','relatorios'].includes(OPERATIONAL_SCOPE))return"), 'Operational sync deve permanecer limitado aos quatro módulos operacionais.');
assert.ok(sync.includes('async function sessionStillMatches(expectedUserId,epoch=lifecycleEpoch)'), 'Operational sync deve revalidar identidade e ciclo da sessão.');
assert.ok(sync.includes('if(!await sessionStillMatches(expectedUserId,epoch))return false;'), 'Leituras operacionais devem confirmar a sessão antes de consultar dados.');
assert.ok(sync.includes('if(!await sessionStillMatches(userId,epoch))return;'), 'Escritas operacionais devem confirmar a sessão antes da RPC.');
assert.ok(sync.includes('onAuthStateChange'), 'Operational sync deve reagir a troca/saída da sessão interna.');
assert.ok(sync.includes('removeChannel(channel)'), 'Operational sync deve remover Realtime ao invalidar o ciclo da sessão.');

// Browser access may read only PADOKA tables and mutate through an explicit,
// narrow allowlist of server-authoritative RPCs. No direct DML, legacy mutation
// or cross-client object is allowed to enter this shared operational runtime.
const fromObjects = [...sync.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
const rpcObjects = [...sync.matchAll(/\.rpc\(['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.ok(fromObjects.length > 0, 'Auditoria esperava leituras operacionais no Supabase.');
assert.ok(rpcObjects.length > 0, 'Auditoria esperava RPCs operacionais server-authoritative.');
for (const object of [...fromObjects, ...rpcObjects]) {
  assert.match(object, /^padoka_/, `Objeto fora do namespace PADOKA detectado: ${object}`);
}
assert.deepEqual(new Set(fromObjects), new Set(['padoka_inventory', 'padoka_production_plans', 'padoka_losses']), 'Operational sync passou a ler tabela fora do conjunto operacional aprovado.');
assert.deepEqual(new Set(rpcObjects), new Set(['padoka_adjust_inventory_once', 'padoka_update_inventory_metadata', 'padoka_upsert_production_plan']), 'Operational sync passou a chamar RPC fora da allowlist operacional aprovada.');
assert.ok(!sync.includes(".rpc('padoka_adjust_inventory',"), 'RPC legada não idempotente de ajuste de estoque não pode voltar ao runtime.');
assert.ok(!sync.includes(".rpc('padoka_register_loss',"), 'RPC legada de perdas não pode voltar ao runtime compartilhado.');
assert.ok(!/\.from\(['"][^'"]+['"]\)\s*\.(?:insert|update|upsert|delete)\s*\(/.test(sync), 'Operational sync não pode executar DML direto; use RPC autorizada.');

for (const forbidden of ['service_role', 'sb_secret_', 'infotech-io', 'infotech.io']) {
  assert.ok(!sync.toLowerCase().includes(forbidden) && !gestao.toLowerCase().includes(forbidden) && !nav.toLowerCase().includes(forbidden), `Fronteira operacional contém referência proibida: ${forbidden}`);
}

console.log('PADOKA operational backend boundary audit: OK');
