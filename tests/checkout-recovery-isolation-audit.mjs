import fs from 'node:fs';

const recovery = fs.readFileSync('assets/checkout-recovery.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(recovery.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'checkout recovery must pin the Sites De Clientes! backend');
expect(recovery.includes('window.PADOKA_RUNTIME.getPublicConfig()'), 'checkout recovery must obtain config from the central runtime');
expect(recovery.includes("cfg.scope!=='padoka'"), 'checkout recovery must validate PADOKA scope');
expect(recovery.includes("value.startsWith('sb_publishable_')"), 'checkout recovery must accept modern publishable keys');
expect(recovery.includes("role==='anon'"), 'checkout recovery may only accept legacy JWT config when role is anon');
expect(recovery.includes("function isPadokaClient(client)"), 'checkout recovery must validate the created Supabase client locally');
expect(recovery.includes("if(!validateConfig(cfg))throw new Error('checkout_runtime_config_invalid')"), 'checkout recovery must fail closed on invalid runtime config');
expect(recovery.includes("if(!isPadokaClient(client))throw new Error('checkout_backend_mismatch')"), 'checkout recovery must block before catalog/auth access on backend mismatch');
expect(recovery.includes("client.from('padoka_products')"), 'checkout recovery must keep catalog reads isolated to padoka_products');
expect(recovery.includes("client.from('padoka_profiles')"), 'checkout recovery must keep profile reads isolated to padoka_profiles');
expect(!recovery.includes('padoka-public-config'), 'checkout recovery must not bypass the central runtime');
expect(!/service_role|sb_secret_/i.test(recovery), 'checkout recovery must not expose privileged Supabase credentials');

console.log('checkout recovery isolation audit passed');
