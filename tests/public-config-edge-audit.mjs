import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/padoka-public-config/index.ts','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(source))fail(m)};
const forbid=(re,m)=>{if(re.test(source))fail(m)};

need(/SUPABASE_PUBLISHABLE_KEYS/i,'public-config deve preferir publishable keys modernas');
need(/SUPABASE_ANON_KEY/i,'public-config deve manter fallback legado temporário');
forbid(/SUPABASE_SECRET_KEYS|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i,'public-config nunca pode acessar segredo administrativo');
need(/ALLOWED_ORIGINS\s*=\s*new Set/i,'public-config deve usar allowlist explícita de CORS');
need(/https:\/\/lucasjanoca\.github\.io/i,'GitHub Pages precisa permanecer permitido');
need(/https:\/\/padoka-da-villa\.pages\.dev/i,'Cloudflare Pages de produção precisa permanecer permitido');
forbid(/security-preview\.padoka-da-villa\.pages\.dev/i,'preview temporário não pode permanecer permitido em produção');
forbid(/access-control-allow-origin["']?\s*:\s*["']\*["']/i,'public-config não pode usar CORS wildcard');
need(/cache-control["']?\s*:\s*["']no-store/i,'configuração pública não deve ser cacheada');
need(/scope:\s*["']padoka["']/i,'escopo PADOKA precisa ser explícito');

if(!process.exitCode)console.log('Public config Edge audit: OK');
