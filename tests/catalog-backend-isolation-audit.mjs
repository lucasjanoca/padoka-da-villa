import fs from 'node:fs';

const catalog = fs.readFileSync(new URL('../assets/catalog.js', import.meta.url), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const PADOKA_REF = 'yncspxfsvlqdnodlsosb';
const PADOKA_ORIGIN = `https://${PADOKA_REF}.supabase.co`;

// The public catalog must remain pinned to the PADOKA backend and fail closed
// if a runtime config tries to redirect it to another shared Supabase project.
ok(catalog.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`), 'catalog: origem fixa da PADOKA ausente ou alterada');
ok(catalog.includes("value.scope!=='padoka'"), 'catalog: escopo público padoka não é validado');
ok(catalog.includes('url.origin!==PADOKA_ORIGIN'), 'catalog: runtime config não é preso à origem PADOKA');
ok(catalog.includes("url.protocol!=='https:'"), 'catalog: backend público não exige HTTPS');
ok(catalog.includes("url.pathname!=='/'"), 'catalog: runtime config aceita caminho inesperado no backend');

// Only public client credentials may be accepted. Administrative credentials
// must never become a fallback for a browser-side catalog request.
ok(catalog.includes("key.startsWith('sb_publishable_')"), 'catalog: publishable key não é reconhecida explicitamente');
ok(catalog.includes("decodeJwtPayload(key)?.role==='anon'"), 'catalog: fallback legado não limita JWT ao papel anon');
ok(!/service_role/i.test(catalog), 'catalog: referência a service_role apareceu no runtime público');
ok(!/sb_secret_/i.test(catalog), 'catalog: referência a sb_secret_ apareceu no runtime público');

// The request must not carry browser credentials/cookies and must not follow
// redirects that could silently move the catalog request to another origin.
ok(catalog.includes("credentials:'omit'"), 'catalog: fetch não omite credenciais do navegador');
ok(catalog.includes("redirect:'error'"), 'catalog: fetch aceita redirecionamento silencioso');
ok(catalog.includes('/rest/v1/padoka_products'), 'catalog: endpoint não usa padoka_products');

if (failures.length) {
  console.error(`PADOKA catalog backend isolation audit: ${failures.length} falha(s)`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PADOKA catalog backend isolation audit: OK');
