import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/065_production_batch_read_role_boundary.sql', 'utf8');

assert.match(sql, /alter table public\.padoka_production_batches enable row level security;/i);
assert.match(sql, /revoke all on public\.padoka_production_batches from anon;/i);
assert.match(sql, /revoke insert, update, delete, truncate, references, trigger\s+on public\.padoka_production_batches from authenticated;/i);
assert.match(sql, /grant select on public\.padoka_production_batches to authenticated;/i);
assert.match(sql, /drop policy if exists "padoka staff read production batches" on public\.padoka_production_batches;/i);
assert.match(sql, /create policy "padoka production roles read production batches"[\s\S]*?for select\s+to authenticated[\s\S]*?padoka_staff_has_role\s*\(\s*array\s*\[\s*'owner'\s*,\s*'manager'\s*,\s*'production'\s*\]\s*::text\[\]\s*\)/i);
assert.doesNotMatch(sql, /using\s*\(\s*(?:select\s+)?(?:public\.)?padoka_is_staff\s*\(\s*\)/i);
assert.doesNotMatch(sql, /'stock'|'cashier'|'attendant'/i);

const runtime = fs.readFileSync('assets/production-completion.js', 'utf8');
assert.match(runtime, /allowedRoles\s*=\s*new Set\(\['owner','manager','production'\]\)/);
assert.match(runtime, /from\('padoka_production_batches'\)\.select\('plan_id,quantity,request_id'\)/);

console.log('PADOKA production batch read role boundary audit: OK');
