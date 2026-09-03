import fs from 'node:fs';

const checkout = fs.readFileSync(new URL('../assets/checkout-page.js', import.meta.url), 'utf8');
const idempotency = fs.readFileSync(new URL('../assets/order-idempotency.js', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../pagamento.html', import.meta.url), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const PADOKA_REF = 'yncspxfsvlqdnodlsosb';
const PADOKA_ORIGIN = `https://${PADOKA_REF}.supabase.co`;

// Checkout bootstrap must remain pinned to the PADOKA backend and reject
// runtime config belonging to another application in the shared environment.
ok(checkout.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`), 'checkout: origem fixa da PADOKA ausente ou alterada');
ok(checkout.includes("cfg.scope!=='padoka'"), 'checkout: escopo público padoka não é validado');
ok(checkout.includes('url.origin===PADOKA_ORIGIN'), 'checkout: runtime config não é preso à origem PADOKA');
ok(checkout.includes("url.pathname==='/'"), 'checkout: runtime config aceita caminho inesperado no backend');
ok(checkout.includes("value.startsWith('sb_publishable_')"), 'checkout: publishable key não é reconhecida explicitamente');
ok(checkout.includes("JSON.parse(atob(padded))?.role==='anon'"), 'checkout: fallback legado não limita JWT ao papel anon');
ok(checkout.includes("sb.from('padoka_products')"), 'checkout: catálogo não é carregado de padoka_products');
ok(checkout.includes("sb.from('padoka_profiles')"), 'checkout: onboarding não é carregado de padoka_profiles');
ok(checkout.includes("new URL(String(sb?.supabaseUrl||'')).origin!==PADOKA_ORIGIN"), 'checkout: cliente Supabase criado não é revalidado contra a origem PADOKA');

// Order submission must remain server-authoritative, idempotent and bound to
// the authenticated PADOKA client instead of falling back to direct inserts.
ok(idempotency.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`), 'checkout idempotency: origem fixa da PADOKA ausente ou alterada');
ok(idempotency.includes("sb.rpc('padoka_create_order_once_v3'"), 'checkout idempotency: RPC autoritativa v3 ausente');
ok(!idempotency.includes("sb.rpc('padoka_create_order',"), 'checkout idempotency: RPC legada padoka_create_order voltou ao runtime');
ok(!idempotency.includes("sb.rpc('padoka_create_order_once',"), 'checkout idempotency: RPC legada padoka_create_order_once voltou ao runtime');
ok(!idempotency.includes("sb.rpc('padoka_create_order_once_v2',"), 'checkout idempotency: RPC legada v2 voltou ao runtime');
ok(!/\.from\(['\"]padoka_orders['\"]\)\.(insert|upsert|update)/.test(idempotency), 'checkout idempotency: gravação direta em padoka_orders apareceu no navegador');
ok(idempotency.includes('crypto.randomUUID()'), 'checkout idempotency: request_id UUID não é gerado para retry seguro');
ok(idempotency.includes('KEY_PREFIX+userId'), 'checkout idempotency: retry não permanece vinculado ao user_id');
ok(idempotency.includes('identityStillCurrent(requestUserId,epoch)'), 'checkout idempotency: resposta não revalida identidade/lifecycle');
ok(idempotency.includes('AUTOMATIC_PIX_READY=false'), 'checkout idempotency: Pix deixou de ficar fail-closed antes da integração real');

// Public checkout must not contain administrative credentials or references to
// the global auth.users table. CSP must connect only to the PADOKA Supabase host.
for (const [name, source] of [['checkout', checkout], ['checkout idempotency', idempotency], ['pagamento', page]]) {
  ok(!/service_role/i.test(source), `${name}: referência a service_role apareceu no runtime público`);
  ok(!/sb_secret_/i.test(source), `${name}: referência a sb_secret_ apareceu no runtime público`);
  ok(!/auth\.users/i.test(source), `${name}: referência global a auth.users apareceu no runtime público`);
}
ok(page.includes(`connect-src 'self' ${PADOKA_ORIGIN} wss://${PADOKA_REF}.supabase.co`), 'pagamento: CSP não está presa ao host PADOKA');
ok(!/https:\/\/[^\s"';]*\.supabase\.co/.test(page.replaceAll(PADOKA_ORIGIN, '')), 'pagamento: outro host Supabase apareceu na página pública');

if (failures.length) {
  console.error(`PADOKA checkout backend isolation audit: ${failures.length} falha(s)`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PADOKA checkout backend isolation audit: OK');
