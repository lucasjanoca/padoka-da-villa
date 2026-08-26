import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const migration = read('supabase/003_operational_inventory_production_losses.sql');
const sync = read('assets/operational-sync.js');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(migration.includes('public.padoka_update_inventory_metadata'), 'migration 003: RPC de metadados do estoque ausente');
ok(migration.includes("padoka_staff_has_role(array['owner','manager','stock'])"), 'migration 003: RPC de metadados não limita função interna');
ok(/unknown or inactive product/.test(migration), 'migration 003: RPC de metadados não valida produto ativo');
ok(/on conflict \(product_id\) do update/i.test(migration), 'migration 003: RPC não cria a linha de estoque para produto novo');
ok(!/grant\s+update\s*\([^)]*(?:barcode|min_quantity)[^)]*\)\s+on\s+public\.padoka_inventory\s+to\s+authenticated/i.test(migration), 'migration 003: UPDATE direto de metadados continua concedido');
ok(/grant\s+execute\s+on\s+function\s+public\.padoka_update_inventory_metadata\(text,text,numeric\)\s+to\s+authenticated/i.test(migration), 'migration 003: execute da RPC não foi concedido ao authenticated');
ok(sync.includes("rpc('padoka_update_inventory_metadata'"), 'operational-sync.js: metadados do estoque não usam RPC');
ok(!/from\('padoka_inventory'\)\.update\(/.test(sync), 'operational-sync.js: ainda existe UPDATE direto em padoka_inventory');
ok(sync.includes('lockOperationalUi('), 'operational-sync.js: gestão não bloqueia o fallback local antes da sincronização');
ok(sync.includes('showUnavailable()'), 'operational-sync.js: estado indisponível fail-closed ausente');
ok(sync.includes('salvar informações apenas neste navegador'), 'operational-sync.js: mensagem de bloqueio do fallback local ausente');
ok(/if\(p\.error\)\{if\(relationMissing\(p\.error\)\)return false/.test(sync), 'operational-sync.js: produção não falha fechada quando a relação está ausente');
ok(/if\(l\.error\)\{if\(relationMissing\(l\.error\)\)return false/.test(sync), 'operational-sync.js: perdas não falham fechadas quando a relação está ausente');

if (failures.length) {
  console.error(`PADOKA inventory audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PADOKA inventory audit: OK');
