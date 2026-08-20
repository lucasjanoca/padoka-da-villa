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
assert.match(sql,/insert into public\.padoka_order_items/i,'order items must remain transactional with order creation');
assert.match(sql,/revoke all on function public\.padoka_create_order_once[\s\S]*from public, anon/i,'public/anon execution must be revoked');
assert.match(sql,/grant execute on function public\.padoka_create_order_once[\s\S]*to authenticated/i,'only authenticated users should execute checkout RPC');
assert.doesNotMatch(sql,/create\s+trigger[\s\S]{0,160}auth\.users/i,'migration must not create a global auth.users trigger');

assert.match(html,/assets\/order-idempotency\.js/i,'checkout must load idempotency layer');
assert.match(js,/crypto\.randomUUID\(\)/,'frontend must generate a unique request_id');
assert.match(js,/sessionStorage/,'ambiguous checkout attempt must survive reload');
assert.match(js,/padoka_create_order_once/,'frontend must use idempotent RPC when available');
assert.match(js,/p_request_id\s*:/,'request_id must be sent to RPC');
assert.match(js,/Tentar novamente/,'ambiguous result must offer safe retry');
assert.match(js,/pointerEvents='none'/,'editing must be locked while an ambiguous request is pending');
assert.match(js,/localStorage\.removeItem\(CART_KEY\)/,'cart must be cleared only after confirmed success');
assert.match(js,/location\.href='acompanhamento\.html\?code='/,'confirmed order must continue to tracking');

console.log('Checkout idempotency audit passed.');
