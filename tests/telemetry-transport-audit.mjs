import fs from 'node:fs';

const telemetry = fs.readFileSync('assets/telemetry.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(telemetry.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'telemetry must pin the Sites De Clientes! backend');
expect(telemetry.includes("const ENDPOINT=PADOKA_ORIGIN+'/functions/v1/padoka-telemetry'"), 'telemetry endpoint must derive from the pinned PADOKA origin');
expect(telemetry.includes("credentials:'omit'"), 'telemetry must omit browser credentials');
expect(telemetry.includes("redirect:'error'"), 'telemetry must reject redirects');
expect(telemetry.includes("referrerPolicy:'no-referrer'"), 'telemetry must not leak referrer data');
expect(telemetry.includes("cache:'no-store'"), 'telemetry requests must not be cached');
expect(telemetry.includes("window.PADOKA_TELEMETRY=Object.freeze({track,sessionId})"), 'telemetry API must be immutable after initialization');
expect(telemetry.includes("const INTERNAL_PAGES=new Set(['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html','mfa.html'])"), 'telemetry must remain disabled on internal pages');
expect(!/service_role|sb_secret_/i.test(telemetry), 'telemetry frontend must not expose privileged Supabase credentials');

console.log('telemetry transport audit passed');