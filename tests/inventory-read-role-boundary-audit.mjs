import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/063_inventory_read_role_boundary.sql', import.meta.url), 'utf8');

assert.match(migration, /drop policy if exists "padoka staff read inventory"/i, 'legacy broad inventory policy must be removed');
assert.match(migration, /create policy "padoka inventory roles read inventory"/i, 'role-bound inventory policy must exist');
assert.match(migration, /to authenticated/i, 'inventory reads must remain authenticated-only');
assert.match(migration, /padoka_staff_has_role\s*\(\s*array\['owner','manager','stock','cashier','attendant'\]::text\[\]\s*\)/i, 'inventory reads must be limited to required roles');
assert.doesNotMatch(migration, /using\s*\(\s*padoka_is_staff\s*\(\s*\)\s*\)/i, 'inventory reads must not regress to generic staff access');
assert.doesNotMatch(migration, /\bgrant\b[\s\S]*\b(insert|update|delete)\b/i, 'migration must not widen write privileges');

console.log('PADOKA inventory read role boundary audit: OK');
