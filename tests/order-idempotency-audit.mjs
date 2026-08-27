import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync('supabase/011_checkout_order_idempotency.sql','utf8');
const html=fs.readFileSync('pagamento.html','utf8');
const js=fs.readFileSync('assets/order-idempotency.js','utf8');

assert.match(sql,/add column if not exists request_id uuid/i,'orders must gain request_id');
assert.match(sql,/unique index[\s\S]*customer_id, request_id/i,'request_id must be unique per customer');
assert.match(sql,/create or replace function public\.padoka_create_order_once/i,'idempotent checkout RPC missing');
assert.match(sql,/auth\.uid\(\)/i,'RPC must bind the order to authenticated user');
assert.match(sql,/on conflict \(customer_id, request_id\)[\s\S]*do nothing/i,'RPC must reconcile concurrent duplicate attempts');
assert.match(sql,/request id conflict/i,'reused request_id with different payload must be rejected');
assert.match(sql,/char_length\(trim\(p_pickup_name\)\)\s*>\s*80/i,'pickup name must be bounded server-side');
assert.match(sql,/America\/Sao_Paulo/i,'pickup date validation must use the padaria timezone');
assert.match(sql,/pickup date is in the past/i,'past pickup dates must be rejected');
assert.match(sql,/\(p_pickup_date \+ p_pickup_time\)\s*<\s*\(now\(\) at time zone 'America\/Sao_Paulo'\)/i,'same-day pickup time must be validated against the padaria clock');
assert.match(sql,/pickup time is in the past/i,'past pickup times on the current date must be rejected');
assert.match(sql,/product_id\s*~\s*'\^\[a-z0-9\]/i,'product ids must be validated server-side');
assert.match(sql,/select 1 from grouped where quantity > 50/i,'duplicate lines must not bypass the per-product quantity limit');
assert.match(sql,/insert into public\.padoka_order_items/i,'order items must remain transactional with order creation');
assert.match(sql,/revoke all on function public\.padoka_create_order_once[\s\S]*from public, anon/i,'public/anon execution must be revoked');
assert.match(sql,/grant execute on function public\.padoka_create_order_once[\s\S]*to authenticated/i,'only authenticated users should execute checkout RPC');
assert.doesNotMatch(sql,/create\s+trigger[\s\S]{0,160}auth\.users/i,'migration must not create a global auth.users trigger');

assert.match(html,/assets\/order-idempotency\.js/i,'checkout must load idempotency layer');
assert.doesNotMatch(html,/\.rpc\(['"]padoka_create_order['"]/,'checkout HTML must not keep a legacy non-idempotent RPC path');
assert.doesNotMatch(html,/sendOrder['"]\)\.onclick\s*=\s*async/,'checkout HTML must not keep a legacy submit handler');
assert.match(js,/crypto\.randomUUID\(\)/,'frontend must generate a unique request_id');
assert.match(js,/sessionStorage/,'ambiguous checkout attempt must survive reload');
assert.match(js,/padoka_create_order_once/,'frontend must use idempotent RPC when available');
assert.doesNotMatch(js,/\.rpc\(['"]padoka_create_order['"]/,'idempotency layer must never call the legacy checkout RPC');
assert.match(js,/p_request_id\s*:/,'request_id must be sent to RPC');
assert.match(js,/Tentar novamente/,'ambiguous result must offer safe retry');
assert.match(js,/pointerEvents='none'/,'editing must be locked while an ambiguous request is pending');
assert.match(js,/localStorage\.removeItem\(CART_KEY\)/,'cart must be cleared only after confirmed success');
assert.match(js,/location\.href='acompanhamento\.html\?code='/,'confirmed order must continue to tracking');

console.log('Checkout idempotency audit passed.');
