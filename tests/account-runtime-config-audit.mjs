import fs from 'node:fs';

const account = fs.readFileSync('assets/account.js', 'utf8');
const html = fs.readFileSync('conta.html', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(html.includes('assets/app-runtime.js'), 'conta.html must load the hardened PADOKA runtime');
expect(account.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'account must pin the Sites De Clientes! project');
expect(account.includes("typeof window.PADOKA_RUNTIME?.getPublicConfig!=='function'"), 'account must fail closed without PADOKA_RUNTIME');
expect(account.includes('await window.PADOKA_RUNTIME.getPublicConfig()'), 'account must obtain public config only through PADOKA_RUNTIME');
expect(!account.includes('padoka-public-config'), 'account must not keep its own public-config fetch fallback');
expect(account.includes("value.scope!=='padoka'"), 'account must validate PADOKA config scope');
expect(account.includes("url.protocol!=='https:'||url.origin!==PADOKA_ORIGIN||url.pathname!=='/'"), 'account must require the exact PADOKA backend root');
expect(account.includes("key.startsWith('sb_publishable_')"), 'account must accept modern publishable keys');
expect(account.includes("decodeJwtPayload(key)?.role==='anon'"), 'account must restrict legacy JWT keys to anon role');
expect(account.includes("new URL(String(sb?.supabaseUrl||'')).origin"), 'account must validate the created Supabase client origin');
expect(account.includes("queryParams:{prompt:'select_account'"), 'Google OAuth must keep prompt=select_account');
expect(!/service_role|sb_secret_/i.test(account), 'account frontend must not expose privileged Supabase credentials');
expect(account.includes("sb.rpc('padoka_save_profile'"), 'onboarding must remain server-authoritative through padoka_save_profile');

console.log('account runtime config audit passed');
