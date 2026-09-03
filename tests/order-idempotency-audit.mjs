import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync('supabase/011_checkout_order_idempotency.sql','utf8');
const v3AclSql=fs.readFileSync('supabase/086_order_v3_private_acl.sql','utf8');
const html=fs.readFileSync('pagamento.html','utf8');
const js=fs.readFileSync('assets/order-idempotency.js','utf8');

// Foundation: request idempotency remains enforced transactionally on the server.
assert.match(sql,/add column if not exists request_id uuid/i,'orders must gain request_id');
assert.match(sql,/unique index[\s\S]*customer_id, request_id/i,'request_id must be unique per customer');
assert.match(sql,/create or replace function public\.padoka_create_order_once/i,'idempotent checkout RPC foundation missing');
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
assert.doesNotMatch(sql,/create\s+trigger[\s\S]{0,160}auth\.users/i,'migration must not create a global auth.users trigger');

// Current v3 private implementation must not inherit browser execution through PUBLIC/anon.
assert.match(v3AclSql,/revoke execute on function padoka_private\.padoka_create_order_once_v3[\s\S]*from public/i,'v3 private implementation must revoke PUBLIC execute');
assert.match(v3AclSql,/revoke execute on function padoka_private\.padoka_create_order_once_v3[\s\S]*from anon/i,'v3 private implementation must revoke anon execute');
assert.match(v3AclSql,/grant execute on function padoka_private\.padoka_create_order_once_v3[\s\S]*to authenticated/i,'v3 wrapper path must remain available to authenticated customers');

// Browser boundary: exact PADOKA backend, no privileged secret, no legacy submit path.
assert.match(html,/assets\/order-idempotency\.js/i,'checkout must load idempotency layer');
assert.doesNotMatch(html,/\.rpc\(['"]padoka_create_order['"]/,'checkout HTML must not keep a legacy non-idempotent RPC path');
assert.doesNotMatch(html,/sendOrder['"]\)\.onclick\s*=\s*async/,'checkout HTML must not keep a legacy submit handler');
assert.match(js,/const PADOKA_ORIGIN='https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co'/,'checkout must pin the correct PADOKA backend');
assert.match(js,/function isPadokaClient\(\)[\s\S]*origin===PADOKA_ORIGIN/,'checkout must reject a Supabase client from another project');
assert.doesNotMatch(js,/(service_role|sb_secret_)/i,'checkout must never contain a privileged Supabase secret');
assert.doesNotMatch(js,/infotech/i,'InfoTech.io must not participate in PADOKA checkout runtime');

// Payment behavior: pickup remains usable, while automatic Pix is fail-closed until a real provider exists.
assert.match(js,/const AUTOMATIC_PIX_READY=false/,'checkout must remain fail-closed until automatic Pix provider is really integrated');
assert.match(js,/function selectedPaymentMethod\(\)[\s\S]*PADOKA_PAYMENT_METHOD==='pix'\?'pix':'pickup'/,'checkout must normalize the supported payment methods');
assert.match(js,/function paymentReady\(\)/,'checkout must have an explicit payment readiness gate');
assert.match(js,/if\(method==='pix'&&!AUTOMATIC_PIX_READY\)[\s\S]*btn\.disabled=true[\s\S]*btn\.textContent='Pix em configuração'[\s\S]*return false/,'Pix must keep submit disabled while automatic processing is unavailable');
assert.match(js,/async function sendOnce\(\)[\s\S]*if\(!paymentReady\(\)\)return;[\s\S]*sb\.rpc\('padoka_create_order_once_v3'/,'order creation must stop before the v3 RPC when the selected payment method is unavailable');
assert.match(js,/selectedPaymentMethod\(\)==='pickup'\?'Enviar pedido • pagar na retirada'/,'pickup payment must remain clearly identified to the customer');

// Active checkout path: v3 only, server-authoritative pricing/coupon/payment method, with idempotent request reconciliation.
assert.match(js,/crypto\.randomUUID\(\)/,'frontend must generate a unique request_id');
assert.match(js,/sessionStorage/,'ambiguous checkout attempt must survive reload');
assert.match(js,/sb\.rpc\('padoka_create_order_once_v3'/,'frontend must use the current idempotent v3 RPC');
assert.doesNotMatch(js,/sb\.rpc\(['"]padoka_create_order['"]\s*,/,'runtime must never call padoka_create_order');
assert.doesNotMatch(js,/sb\.rpc\(['"]padoka_create_order_once['"]\s*,/,'runtime must never call checkout v1');
assert.doesNotMatch(js,/sb\.rpc\(['"]padoka_create_order_once_v2['"]\s*,/,'runtime must never call checkout v2');
assert.match(js,/p_request_id\s*:\s*pending\.request_id/,'request_id must be sent to the v3 RPC');
assert.match(js,/p_items\s*:\s*p\.items/,'checkout must send only product ids/quantities for server-side pricing');
assert.match(js,/p_coupon_code\s*:\s*p\.coupon_code/,'coupon code must be validated by the server-authoritative v3 RPC');
assert.match(js,/p_payment_method\s*:\s*p\.payment_method/,'payment method must be validated by the server-authoritative v3 RPC');
assert.match(js,/Tentar novamente/,'ambiguous result must offer safe retry');
assert.match(js,/padoka-edit-disabled/,'editing must be locked while an ambiguous request is pending');
assert.match(js,/localStorage\.removeItem\('padoka_cart_mobile_v1'\)/,'cart must be cleared only after confirmed success');
assert.match(js,/location\.href='acompanhamento\.html\?code='/,'confirmed order must continue to tracking');

// Auth lifecycle: a pending request must never cross customer identities.
assert.match(js,/onAuthStateChange/,'checkout must react to logout/account changes after page initialization');
assert.match(js,/activeUserId/,'checkout retries must remain bound to the authenticated identity');
assert.match(js,/lifecycleEpoch/,'stale async checkout responses must be invalidated after auth lifecycle changes');
assert.match(js,/async function safeSession\(\)[\s\S]*sb\.auth\.getSession\(\)[\s\S]*catch\{[\s\S]*return null/,'checkout must fail closed when session confirmation rejects on transport');
assert.match(js,/async function identityStillCurrent\(expectedUserId,epoch\)/,'checkout must have an explicit post-RPC identity revalidation helper');
assert.match(js,/const session=await safeSession\(\);[\s\S]*session\.user\.id!==requestUserId/,'checkout must confirm the real auth session before creating or reconciling an order');
assert.match(js,/try\{[\s\S]*result=await sb\.rpc\('padoka_create_order_once_v3'/,'checkout must catch v3 RPC transport rejection while keeping the same pending request');
assert.match(js,/catch\(error\)\{[\s\S]*lockPending\(\);[\s\S]*mesma tentativa será reconciliada/,'RPC transport rejection must preserve an idempotent retry instead of generating a new attempt');
assert.match(js,/if\(!\(await identityStillCurrent\(requestUserId,epoch\)\)\)/,'checkout must revalidate the authenticated identity after the RPC before applying its response');
assert.match(js,/Não foi possível confirmar sua sessão após o envio/,'post-RPC session failure must present a fail-closed recovery state');
assert.match(js,/const KEY_PREFIX='padoka_pending_order_v3:'/,'pending checkout retries must use the current per-customer v3 namespace');
assert.match(js,/const LEGACY_KEYS=\['padoka_pending_order_v1','padoka_pending_order_v2:'\]/,'retired checkout retry namespaces must remain explicitly identified');
assert.match(js,/const keyFor=userId=>userId\?KEY_PREFIX\+userId:''/,'pending checkout storage key must be derived from user_id');
assert.match(js,/store\(requestUserId,pending\)/,'pending order must be persisted under the requesting customer identity');
assert.match(js,/const btn=el\('sendOrder'\),method=selectedPaymentMethod\(\),existing=parse\(requestUserId\)/,'retry restoration must only read the authenticated customer key');
assert.match(js,/const pending=parse\(user\.id\)/,'page initialization must only restore the current customer retry');
assert.match(js,/sessionStorage\.removeItem\(LEGACY_KEYS\[0\]\)/,'legacy shared checkout retry key must be discarded');
assert.doesNotMatch(js,/pending\?\.user_id===previousId\)clear\(\)/,'account switching must not destroy the previous customer retry');
assert.match(js,/Sessão encerrada ou alterada/,'logout/account change must immediately replace sensitive account presentation');
assert.match(js,/location\.reload\(\)/,'a newly authenticated identity must reload profile and server-authoritative checkout state');

console.log('Checkout idempotency v3 audit passed.');
