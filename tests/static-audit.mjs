import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const files = ['index.html','conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html'];
const html = Object.fromEntries(files.map(f => [f, read(f)]));
const catalog = read('assets/catalog.js');
const auth = read('AUTH_STATUS.md');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

// Public pages must not advertise internal operational modules.
for (const f of ['index.html','conta.html','pagamento.html','acompanhamento.html']) {
  ok(!/(href=["'][^"']*(?:internal|pdv|gestao|pedidos)\.html)/i.test(html[f]), `${f}: expõe link para módulo interno`);
}

// Every internal surface must remain protected by the staff table.
for (const f of ['internal.html','pedidos.html','pdv.html','gestao.html']) {
  ok(html[f].includes('padoka_staff_users'), `${f}: não valida padoka_staff_users`);
}

// Customer order tracking invariants.
ok(!/placeholder=["'][^"']*(?:pesquis|buscar)[^"']*["']/i.test(html['acompanhamento.html']), 'acompanhamento.html: não deve ter campo de pesquisa');
for (const status of ['received','seen','confirmed','preparing','ready','completed']) {
  ok(html['acompanhamento.html'].includes(status), `acompanhamento.html: status ${status} ausente`);
}
ok(html['acompanhamento.html'].includes('Pode vir buscar!'), 'acompanhamento.html: destaque ready ausente');
ok(html['acompanhamento.html'].includes('postgres_changes'), 'acompanhamento.html: atualização Realtime ausente');

// Checkout and public catalog must remain server-authoritative.
ok(html['pagamento.html'].includes("rpc('padoka_create_order'"), 'pagamento.html: pedido não usa padoka_create_order');
ok(!/insert\s*\([^)]*padoka_orders/i.test(html['pagamento.html']), 'pagamento.html: não deve inserir pedido diretamente');
ok(catalog.includes('/rest/v1/padoka_products'), 'assets/catalog.js: catálogo público não consulta padoka_products');
ok(catalog.includes('active=eq.true'), 'assets/catalog.js: catálogo público não filtra somente produtos ativos');
ok(!/\bprice\s*:\s*\d/i.test(catalog), 'assets/catalog.js: preço estático encontrado no catálogo visual');
ok(catalog.includes('Catálogo e valores provisórios'), 'assets/catalog.js: dados demonstrativos não estão identificados ao cliente');

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
