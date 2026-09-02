import fs from 'node:fs';

const catalog = fs.readFileSync('assets/catalog.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(html.includes('assets/app-runtime.js'), 'index.html must load the hardened PADOKA runtime');
expect(catalog.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'catalog must pin the Sites De Clientes! project');
expect(catalog.includes("typeof window.PADOKA_RUNTIME?.getPublicConfig!=='function'"), 'catalog must fail closed without PADOKA_RUNTIME');
expect(catalog.includes('await window.PADOKA_RUNTIME.getPublicConfig()'), 'catalog must obtain public config only through PADOKA_RUNTIME');
expect(!catalog.includes('padoka-public-config'), 'catalog must not keep its own public-config fetch fallback');
expect(catalog.includes("value.scope!=='padoka'"), 'catalog must validate PADOKA config scope');
expect(catalog.includes("url.protocol!=='https:'||url.origin!==PADOKA_ORIGIN||url.pathname!=='/'"), 'catalog must require the exact PADOKA backend root');
expect(catalog.includes("key.startsWith('sb_publishable_')"), 'catalog must accept modern publishable keys');
expect(catalog.includes("decodeJwtPayload(key)?.role==='anon'"), 'catalog must restrict legacy JWT keys to anon role');
expect(catalog.includes("credentials:'omit'"), 'catalog request must omit browser credentials');
expect(catalog.includes("redirect:'error'"), 'catalog request must reject redirects');
expect(catalog.includes("contentType.includes('application/json')"), 'catalog must validate JSON response type');
expect(catalog.includes('/rest/v1/padoka_products'), 'catalog must remain server-authoritative through padoka_products');
expect(catalog.includes('active=eq.true'), 'catalog must only load active products');
expect(!/service_role|sb_secret_/i.test(catalog), 'catalog frontend must not expose privileged Supabase credentials');

const drinks = ['expresso','cappuccino','suco','agua'].map(id => {
  const match = catalog.match(new RegExp(`id:'${id}'[\\s\\S]*?img:'([^']+)'`));
  return match?.[1];
});
expect(drinks.every(Boolean), 'catalog must preserve an image for every required drink');
expect(new Set(drinks).size === drinks.length, 'catalog must preserve distinct beverage images');

console.log('catalog runtime config audit passed');
