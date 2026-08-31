import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/060_inventory_movement_read_role_boundary.sql', 'utf8');

assert.match(sql, /alter table public\.padoka_inventory_movements enable row level security;/i);
assert.match(sql, /create policy "padoka stock roles read inventory movements"/i);
assert.match(sql, /for select\s+to authenticated/i);
assert.match(sql, /padoka_staff_has_role\s*\(\s*array\s*\[\s*'owner'\s*,\s*'manager'\s*,\s*'stock'\s*\]\s*\)/i);
assert.doesNotMatch(sql, /using\s*\(\s*(?:select\s+)?public\.padoka_is_staff\s*\(\s*\)/i);
assert.match(sql, /revoke all on public\.padoka_inventory_movements from anon;/i);
assert.match(sql, /revoke insert, update, delete, truncate, references, trigger\s+on public\.padoka_inventory_movements from authenticated;/i);
assert.match(sql, /grant select on public\.padoka_inventory_movements to authenticated;/i);

console.log('PADOKA inventory movement role boundary audit: OK');
