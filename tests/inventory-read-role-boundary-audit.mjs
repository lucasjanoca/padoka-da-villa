import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/064_inventory_read_stock_roles_only.sql', import.meta.url), 'utf8');
const scanner = fs.readFileSync(new URL('../assets/pdv-scanner-fix.js', import.meta.url), 'utf8');

assert.match(migration, /drop policy if exists "padoka inventory roles read inventory"/i, 'previous inventory role policy must be replaced');
assert.match(migration, /create policy "padoka inventory roles read inventory"/i, 'role-bound inventory policy must exist');
assert.match(migration, /to authenticated/i, 'inventory reads must remain authenticated-only');
assert.match(migration, /padoka_staff_has_role\s*\(\s*array\['owner','manager','stock'\]::text\[\]\s*\)/i, 'direct inventory reads must be limited to stock-management roles');
assert.doesNotMatch(migration, /\b(cashier|attendant|production)\b/i, 'non-stock roles must not regain direct inventory reads');
assert.doesNotMatch(migration, /using\s*\(\s*padoka_is_staff\s*\(\s*\)\s*\)/i, 'inventory reads must not regress to generic staff access');
assert.doesNotMatch(migration, /\bgrant\b[\s\S]*\b(insert|update|delete)\b/i, 'migration must not widen write privileges');
assert.match(scanner, /rpc\(['"]padoka_list_product_barcodes['"]\)/, 'PDV scanner must keep barcode lookup on the dedicated server-authoritative RPC');

console.log('PADOKA inventory read role boundary audit: OK');
