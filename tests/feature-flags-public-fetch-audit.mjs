import fs from 'node:fs';

const src=fs.readFileSync(new URL('../assets/feature-flags.js',import.meta.url),'utf8');
const fail=message=>{throw new Error(message)};

if(!src.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('feature flags must pin the PADOKA Supabase origin');
if(!src.includes("credentials:'omit'"))fail('public feature flag fetches must omit ambient credentials');
if(!src.includes("redirect:'error'"))fail('public feature flag fetches must fail closed on redirects');
if(!src.includes("cache:'no-store'"))fail('public feature flag fetches must not use a stale HTTP cache');
if(!src.includes("audience=eq.public"))fail('feature flags query must remain restricted to public audience');
if(!src.includes("requirePadokaOrigin(cfg.url)"))fail('runtime config origin must be validated before REST access');
if(/fetch\(CONFIG_URL,\{cache:'no-store'\}\)/.test(src))fail('legacy config fetch without credential isolation must not return');
if(/fetch\(url,\{cache:'no-store',headers:\{apikey:/.test(src))fail('legacy flag fetch without credential isolation must not return');
if(/service_role|sb_secret_/i.test(src))fail('public feature flag runtime must never contain administrative secrets');

console.log('feature flags public fetch audit: ok');
