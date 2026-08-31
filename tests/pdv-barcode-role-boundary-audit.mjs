import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/062_pdv_barcode_role_boundary.sql', 'utf8');

assert.match(sql, /create or replace function padoka_private\.padoka_list_product_barcodes\(\)/i);
assert.match(sql, /security definer/i);
assert.match(sql, /set search_path\s*=\s*public/i);
assert.match(sql, /if\s*\(select auth\.uid\(\)\) is null/i);
assert.match(sql, /padoka_staff_has_role\s*\(\s*array\s*\[\s*'owner'\s*,\s*'manager'\s*,\s*'cashier'\s*,\s*'attendant'\s*\]\s*\)/i);
assert.doesNotMatch(sql, /padoka_is_staff\s*\(\s*\)/i);
assert.match(sql, /revoke all on function padoka_private\.padoka_list_product_barcodes\(\) from public, anon;/i);
assert.match(sql, /grant execute on function padoka_private\.padoka_list_product_barcodes\(\) to authenticated;/i);

console.log('PADOKA PDV barcode role boundary audit: OK');
