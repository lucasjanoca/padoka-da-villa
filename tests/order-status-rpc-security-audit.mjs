import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const migration = read('supabase/005_order_status_transition_rpc.sql');
const ordersUi = read('pedidos.html');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

// This audit protects the already-published PADOKA order-status boundary.
// It does not apply migrations or widen privileges.
ok(migration.includes('yncspxfsvlqdnodlsosb'), 'migration 005: backend PADOKA esperado não está documentado');
ok(/create\s+or\s+replace\s+function\s+public\.padoka_update_order_status\s*\(/i.test(migration), 'migration 005: RPC padoka_update_order_status ausente');
ok(/language\s+plpgsql[\s\S]{0,120}?security\s+definer/i.test(migration), 'migration 005: RPC não está SECURITY DEFINER');
ok(/set\s+search_path\s*=\s*public/i.test(migration), 'migration 005: SECURITY DEFINER sem search_path fixo');
ok(/if\s+auth\.uid\(\)\s+is\s+null\s+then/i.test(migration), 'migration 005: autenticação explícita via auth.uid() ausente');
ok(/if\s+not\s+public\.padoka_is_staff\(\)\s+then/i.test(migration), 'migration 005: autorização explícita de staff PADOKA ausente');
ok(!/\bon\s+auth\.users\b/i.test(migration), 'migration 005: referência de trigger/objeto global auth.users detectada');

for (const status of ['received','seen','confirmed','preparing','ready','completed','cancelled']) {
  ok(migration.includes(`'${status}'`), `migration 005: status permitido ${status} ausente`);
}
ok(/for\s+update/i.test(migration), 'migration 005: linha do pedido não é bloqueada durante transição');
ok(/v_order\.status\s+in\s*\(\s*'completed'\s*,\s*'cancelled'\s*\)/i.test(migration), 'migration 005: pedidos finalizados podem perder proteção contra reabertura');
ok(/when\s+'received'\s+then\s+p_status\s+in\s*\(\s*'seen'\s*,\s*'cancelled'\s*\)/i.test(migration), 'migration 005: transição received não está limitada');
ok(/when\s+'ready'\s+then\s+p_status\s+in\s*\(\s*'completed'\s*,\s*'cancelled'\s*\)/i.test(migration), 'migration 005: transição ready não está limitada');

// Least privilege: browser users may execute only after authentication; direct table UPDATE stays revoked.
ok(/revoke\s+update\s+on\s+table\s+public\.padoka_orders\s+from\s+authenticated/i.test(migration), 'migration 005: UPDATE direto em padoka_orders não foi revogado de authenticated');
ok(/revoke\s+all\s+on\s+function\s+public\.padoka_update_order_status\s*\(\s*uuid\s*,\s*text\s*\)\s+from\s+public\s*,\s*anon/i.test(migration), 'migration 005: EXECUTE público/anon da RPC não está revogado');
ok(/grant\s+execute\s+on\s+function\s+public\.padoka_update_order_status\s*\(\s*uuid\s*,\s*text\s*\)\s+to\s+authenticated/i.test(migration), 'migration 005: EXECUTE não está limitado a authenticated após revogações');

// Internal UI must keep the server-authoritative path and must not restore a direct/fallback mutation.
ok(ordersUi.includes("rpc('padoka_update_order_status'"), 'pedidos.html: status não usa padoka_update_order_status');
ok(!/from\(['"]padoka_orders['"]\)\.update\s*\(/.test(ordersUi), 'pedidos.html: UPDATE direto em padoka_orders reapareceu');
ok(!ordersUi.includes('rpcMissing'), 'pedidos.html: fallback legado para UPDATE direto reapareceu');
ok(ordersUi.includes("from('padoka_staff_users')"), 'pedidos.html: validação de padoka_staff_users ausente');
ok(ordersUi.includes("eq('user_id',session.user.id)"), 'pedidos.html: validação de staff não está vinculada ao usuário autenticado');
ok(ordersUi.includes("if(error||!s?.active)"), 'pedidos.html: staff inativo não é bloqueado antes da fila');

for (const forbidden of ['service_role', 'sb_secret_']) {
  ok(!ordersUi.includes(forbidden), `pedidos.html: segredo privilegiado detectado (${forbidden})`);
}

if (failures.length) {
  console.error(`Order status RPC security audit: ${failures.length} falha(s)`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Order status RPC security audit: OK');
