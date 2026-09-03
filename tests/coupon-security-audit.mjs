import fs from 'node:fs';

const sql=fs.readFileSync('supabase/044_server_authoritative_coupons.sql','utf8');
const orderJs=fs.readFileSync('assets/order-idempotency.js','utf8');
const checkoutJs=fs.readFileSync('assets/checkout-page.js','utf8');
const html=fs.readFileSync('pagamento.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(s,r,m)=>{if(!r.test(s))fail(m)};
const reject=(s,r,m)=>{if(r.test(s))fail(m)};

// Coupon rules remain server-authoritative even while the public coupon UI is not exposed.
need(sql,/create table if not exists public\.padoka_coupons/i,'cupons server-side ausentes');
need(sql,/padoka_calculate_coupon/i,'cálculo server-side ausente');
need(sql,/padoka_coupon_preview/i,'preview server-side ausente');
need(sql,/coupons disabled/i,'feature flag server-side não é exigida');
need(sql,/coupons unavailable for demo catalog/i,'cupom não bloqueia catálogo demo');
need(sql,/v_user_uses>=v_coupon\.max_per_user/i,'limite por cliente ausente');
need(sql,/v_coupon\.max_redemptions/i,'limite global ausente');
need(sql,/total=subtotal-discount_total/i,'invariante financeiro do pedido ausente');

// Current checkout must stay on the hardened/idempotent v3 path and send only the coupon code.
need(orderJs,/sb\.rpc\(['"]padoka_create_order_once_v3['"]/,'checkout não usa a RPC v3');
need(orderJs,/p_coupon_code\s*:\s*p\.coupon_code/,'checkout v3 deixou de enviar cupom para validação server-side');
need(orderJs,/coupon_code\s*:\s*String\(window\.PADOKA_CHECKOUT_COUPON/,'payload perdeu normalização do código de cupom');
need(orderJs,/request_id/,'checkout perdeu request_id');
reject(orderJs,/sb\.rpc\(['"]padoka_create_order_once(?:_v2)?['"]/,'runtime voltou a chamar RPC legada de pedido');

// Until a dedicated public coupon controller is intentionally restored, keep the checkout fail-closed:
// no local discount math, no coupon field that could imply an active feature, and an empty coupon by default.
need(checkoutJs,/window\.PADOKA_CHECKOUT_COUPON\s*=\s*['"]["']/,'checkout não inicializa cupom como vazio');
reject(checkoutJs,/(discount_value|discount_total)\s*[+*\-/]/i,'frontend passou a calcular desconto localmente');
reject(html,/data-feature=["']coupons["']/i,'UI de cupom foi exposta sem controlador server-side dedicado');
reject(html,/(id|name)=["'][^"']*coupon/i,'campo público de cupom reapareceu sem preview server-side dedicado');

if(!process.exitCode)console.log('Coupon security audit: OK (server-authoritative rules + checkout v3)');
