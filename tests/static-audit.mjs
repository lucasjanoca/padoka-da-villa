import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const files = ['index.html','produto.html','conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html'];
const html = Object.fromEntries(files.map(f => [f, read(f)]));
const catalog = read('assets/catalog.js');
const orderIdempotency = read('assets/order-idempotency.js');
const reportingSync = read('assets/reporting-sync.js');
const settingsSync = read('assets/settings-sync.js');
const auth = read('AUTH_STATUS.md');
const statusMigration = read('supabase/005_order_status_transition_rpc.sql');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

// Public pages must not advertise internal operational modules.
for (const f of ['index.html','produto.html','conta.html','pagamento.html','acompanhamento.html']) {
  ok(!/(href=["'][^"']*(?:internal|pdv|gestao|pedidos)\.html)/i.test(html[f]), `${f}: expõe link para módulo interno`);
}

// Every internal surface must remain protected by the staff table.
for (const f of ['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html']) {
  ok(html[f].includes('padoka_staff_users'), `${f}: não valida padoka_staff_users`);
}

// Sensitive management modules must not even start server sync for unrelated staff roles.
for (const [name, source] of [['reporting-sync.js', reportingSync], ['settings-sync.js', settingsSync]]) {
  ok(source.includes("new Set(['owner','manager'])"), `${name}: sincronização sensível sem allowlist owner/manager`);
  ok(source.includes('window.padokaStaffRole'), `${name}: não espera o papel interno validado`);
  ok(/if\s*\(!allowedRoles\.has\(role\)\)\s*(?:return|\{[\s\S]{0,220}?return)/.test(source), `${name}: não interrompe execução para papel sem permissão`);
}

// Customer order tracking invariants.
ok(!/placeholder=["'][^"']*(?:pesquis|buscar)[^"']*["']/i.test(html['acompanhamento.html']), 'acompanhamento.html: não deve ter campo de pesquisa');
for (const status of ['received','seen','confirmed','preparing','ready','completed']) {
  ok(html['acompanhamento.html'].includes(status), `acompanhamento.html: status ${status} ausente`);
}
ok(html['acompanhamento.html'].includes('Pode vir buscar!'), 'acompanhamento.html: destaque ready ausente');
ok(html['acompanhamento.html'].includes('postgres_changes'), 'acompanhamento.html: atualização Realtime ausente');

// Checkout and public catalog must remain server-authoritative and retry-safe.
ok(html['pagamento.html'].includes('assets/order-idempotency.js'), 'pagamento.html: camada idempotente de checkout ausente');
ok(orderIdempotency.includes("rpc('padoka_create_order_once'"), 'checkout: pedido não usa padoka_create_order_once');
ok(!/\.rpc\(['"]padoka_create_order['"]/.test(html['pagamento.html']), 'pagamento.html: RPC legada de pedido reapareceu');
ok(!/insert\s*\([^)]*padoka_orders/i.test(html['pagamento.html']), 'pagamento.html: não deve inserir pedido diretamente');
ok(catalog.includes('/rest/v1/padoka_products'), 'assets/catalog.js: catálogo público não consulta padoka_products');
ok(catalog.includes('active=eq.true'), 'assets/catalog.js: catálogo público não filtra somente produtos ativos');
ok(!/\bprice\s*:\s*\d/i.test(catalog), 'assets/catalog.js: preço estático encontrado no catálogo visual');
ok(catalog.includes('Catálogo e valores provisórios'), 'assets/catalog.js: dados demonstrativos não estão identificados ao cliente');
ok(catalog.includes('Informações de funcionamento, endereço e campanhas'), 'assets/catalog.js: dados públicos não confirmados não estão identificados como provisórios');
ok(catalog.includes("role','note'"), 'assets/catalog.js: aviso de dados públicos provisórios sem semântica de nota');

// Server catalog data rendered by multiple surfaces must be normalized before it reaches innerHTML templates.
ok(catalog.includes('const safeId='), 'assets/catalog.js: validação de product_id ausente');
ok(/\^\[a-z0-9\]\[a-z0-9_-\]/i.test(catalog), 'assets/catalog.js: product_id não está limitado a caracteres seguros');
ok(catalog.includes('const esc='), 'assets/catalog.js: escape de texto do servidor ausente');
ok(/name:esc\(/.test(catalog), 'assets/catalog.js: nome vindo do servidor não é escapado');
ok(/category:esc\(/.test(catalog), 'assets/catalog.js: categoria vinda do servidor não é escapada');
ok(/p\.price>=0/.test(catalog), 'assets/catalog.js: preço negativo não é rejeitado no cliente');

// Internal order status changes must use only the server-authoritative RPC after migration 005 activation.
ok(html['pedidos.html'].includes("rpc('padoka_update_order_status'"), 'pedidos.html: atualização de status não usa RPC autoritativa');
ok(!/from\(['"]padoka_orders['"]\)\.update\(/.test(html['pedidos.html']), 'pedidos.html: UPDATE direto de status reapareceu no frontend');
ok(!html['pedidos.html'].includes('rpcMissing'), 'pedidos.html: fallback temporário da RPC reapareceu');
ok(statusMigration.includes('public.padoka_is_staff()'), 'migration 005: RPC de status não valida staff');
ok(statusMigration.includes("when 'received' then p_status in ('seen','cancelled')"), 'migration 005: transição inicial não está limitada');
ok(statusMigration.includes("when 'ready' then p_status in ('completed','cancelled')"), 'migration 005: conclusão não está limitada');
ok(/revoke\s+update\s+on\s+table\s+public\.padoka_orders\s+from\s+authenticated/i.test(statusMigration), 'migration 005: UPDATE direto de pedidos continua concedido após ativação');

// Google OAuth must keep account selection and friendly disabled-provider handling.
ok(html['conta.html'].includes('select_account'), 'conta.html: Google OAuth sem prompt select_account');
ok(/googleEnabled\s*===\s*false/.test(html['conta.html']), 'conta.html: tratamento de provider Google desativado ausente');
ok(auth.includes('yncspxfsvlqdnodlsosb'), 'AUTH_STATUS.md: project ref PADOKA ausente');

// Beverage imagery must be distinct.
const drinks = ['expresso','cappuccino','suco','agua'].map(id => {
  const m = catalog.match(new RegExp(`id:'${id}'[\\s\\S]*?img:'([^']+)'`));
  return m?.[1];
});
ok(drinks.every(Boolean), 'assets/catalog.js: alguma bebida está sem imagem');
ok(new Set(drinks).size === drinks.length, 'assets/catalog.js: bebidas reutilizam a mesma imagem');

// No global auth.users trigger in repository SQL migrations.
for (const f of fs.readdirSync(new URL('../supabase/', import.meta.url)).filter(x => x.endsWith('.sql'))) {
  const sql = read(`supabase/${f}`);
  ok(!/create\s+trigger[\s\S]{0,300}\bon\s+auth\.users\b/i.test(sql), `${f}: trigger global em auth.users detectado`);
}

if (failures.length) {
  console.error(`PADOKA static audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log(`PADOKA static audit: OK (${files.length} páginas + catálogo + migrations)`);
