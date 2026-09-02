import fs from 'node:fs';

const order = fs.readFileSync('assets/order-idempotency.js', 'utf8');
const checkout = fs.readFileSync('assets/checkout-page.js', 'utf8');
const privateAcl = fs.readFileSync('supabase/086_order_v3_private_acl.sql', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(order.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'checkout order runtime must pin the Sites De Clientes! backend');
expect(order.includes("function isPadokaClient()"), 'checkout must validate the Supabase client origin locally');
expect(order.includes("sb?.supabaseUrl"), 'checkout must derive the active client origin from the Supabase client instance');
expect(order.includes('if(!isPadokaClient())return null;'), 'session reads must fail closed for a non-PADOKA client');
expect(order.includes("if(!isPadokaClient()){disableCheckout('Não foi possível validar o serviço PADOKA."), 'order submission must block before auth/RPC when the backend cannot be validated');
expect(order.includes("if(!isPadokaClient())throw new Error('PADOKA backend mismatch')"), 'RPC dispatch must revalidate the backend immediately before the server-authoritative call');
expect(order.includes("sb.rpc('padoka_create_order_once_v3'"), 'checkout must keep the current idempotent server-authoritative order RPC');
expect(order.includes('p_payment_method:p.payment_method'), 'server-authoritative order RPC must receive the selected payment method explicitly');
expect(!order.includes("sb.rpc('padoka_create_order',"), 'legacy non-idempotent order RPC must remain absent from checkout runtime');
expect(!order.includes("sb.rpc('padoka_create_order_once',"), 'checkout runtime must not fall back to the superseded v1 RPC');
expect(!order.includes("sb.rpc('padoka_create_order_once_v2',"), 'checkout runtime must not fall back to the superseded v2 RPC');

expect(checkout.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'checkout page must pin the Sites De Clientes! backend');
expect(checkout.includes("if(!window.PADOKA_RUNTIME?.getPublicConfig)throw new Error('PADOKA runtime unavailable')"), 'checkout page must fail closed when the central runtime is unavailable');
expect(checkout.includes('window.PADOKA_RUNTIME.getPublicConfig()'), 'checkout page must obtain public configuration from the central runtime');
expect(checkout.includes("cfg.scope!=='padoka'"), 'checkout page must validate the PADOKA config scope');
expect(checkout.includes("value.startsWith('sb_publishable_')"), 'checkout page must accept modern publishable keys');
expect(checkout.includes("role==='anon'"), 'checkout page may only accept legacy JWT config when its role is anon');
expect(checkout.includes("new URL(String(sb?.supabaseUrl||'')).origin!==PADOKA_ORIGIN"), 'checkout page must validate the created Supabase client origin before data/auth access');
expect(!checkout.includes('padoka-public-config'), 'checkout page must not bypass the central runtime with a direct public-config fetch');
expect(!/service_role|sb_secret_/i.test(order + checkout), 'checkout frontend must not expose privileged Supabase credentials');

expect(privateAcl.includes('padoka_private.padoka_create_order_once_v3'), 'checkout ACL migration must target only the private v3 implementation');
expect(/revoke execute[\s\S]*from public;/i.test(privateAcl), 'private v3 order implementation must revoke inherited PUBLIC execute');
expect(/revoke execute[\s\S]*from anon;/i.test(privateAcl), 'private v3 order implementation must explicitly deny anon execute');
expect(/grant execute[\s\S]*to authenticated;/i.test(privateAcl), 'authenticated must retain the minimum execute needed by the public SECURITY INVOKER wrapper');
expect(!/grant execute[\s\S]*to (public|anon)/i.test(privateAcl), 'private v3 order implementation must never grant execute to PUBLIC or anon');

console.log('order backend isolation audit passed');
