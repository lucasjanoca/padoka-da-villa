import fs from 'node:fs';
import assert from 'node:assert/strict';

// Regression guard for role-scoped production/loss reads introduced by migration 061.
const sql = fs.readFileSync('supabase/061_production_loss_read_role_boundaries.sql', 'utf8');

assert.match(sql, /alter table public\.padoka_production_plans enable row level security;/i);
assert.match(sql, /alter table public\.padoka_losses enable row level security;/i);

assert.match(sql, /create policy "padoka production roles read production"[\s\S]*?for select\s+to authenticated[\s\S]*?padoka_staff_has_role\s*\(\s*array\s*\[\s*'owner'\s*,\s*'manager'\s*,\s*'production'\s*\]\s*\)/i);
assert.match(sql, /create policy "padoka loss roles read losses"[\s\S]*?for select\s+to authenticated[\s\S]*?padoka_staff_has_role\s*\(\s*array\s*\[\s*'owner'\s*,\s*'manager'\s*,\s*'stock'\s*,\s*'production'\s*\]\s*\)/i);
assert.doesNotMatch(sql, /using\s*\(\s*(?:select\s+)?public\.padoka_is_staff\s*\(\s*\)/i);

assert.match(sql, /revoke all on public\.padoka_production_plans, public\.padoka_losses from anon;/i);
assert.match(sql, /revoke insert, update, delete, truncate, references, trigger\s+on public\.padoka_production_plans, public\.padoka_losses from authenticated;/i);
assert.match(sql, /grant select on public\.padoka_production_plans, public\.padoka_losses to authenticated;/i);

// Inventory is intentionally deferred: PDV still has a direct barcode read that supports cashier/attendant.
assert.doesNotMatch(sql, /drop policy[^;]*padoka staff read inventory/i);
assert.doesNotMatch(sql, /create policy[^;]*padoka_inventory/i);

console.log('PADOKA operational read role boundary audit: OK');
