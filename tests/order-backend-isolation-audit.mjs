import fs from 'node:fs';

const order = fs.readFileSync('assets/order-idempotency.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(order.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'checkout order runtime must pin the Sites De Clientes! backend');
expect(order.includes("function isPadokaClient()"), 'checkout must validate the Supabase client origin locally');
expect(order.includes("sb?.supabaseUrl"), 'checkout must derive the active client origin from the Supabase client instance');
expect(order.includes('if(!isPadokaClient())return null;'), 'session reads must fail closed for a non-PADOKA client');
expect(order.includes("if(!isPadokaClient()){\n    disableCheckout('Não foi possível validar o serviço PADOKA."), 'order submission must block before auth/RPC when the backend cannot be validated');
expect(order.includes("if(!isPadokaClient())throw new Error('PADOKA backend mismatch')"), 'RPC dispatch must revalidate the backend immediately before the server-authoritative call');
expect(order.includes("sb.rpc('padoka_create_order_once'"), 'checkout must keep the idempotent server-authoritative order RPC');
expect(order.includes("sb.rpc('padoka_create_order_once_v2'"), 'coupon checkout must keep the idempotent server-authoritative order RPC');
expect(!order.includes("sb.rpc('padoka_create_order',"), 'legacy non-idempotent order RPC must remain absent from checkout runtime');
expect(!/service_role|sb_secret_/i.test(order), 'checkout runtime must not expose privileged Supabase credentials');

console.log('order backend isolation audit passed');
