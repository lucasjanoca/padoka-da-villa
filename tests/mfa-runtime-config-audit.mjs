import fs from 'node:fs';

const source=fs.readFileSync('assets/mfa.js','utf8');
const html=fs.readFileSync('mfa.html','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

const expectedUrl='https://yncspxfsvlqdnodlsosb.supabase.co';
expect(source.includes(`const SUPABASE_URL='${expectedUrl}'`),'MFA deve permanecer fixado no backend PADOKA correto.');
expect(html.includes('<script src="assets/frame-guard.js"></script><script src="assets/app-runtime.js"></script>'),'MFA deve carregar o runtime endurecido antes do módulo de autenticação.');
expect(source.includes('window.PADOKA_RUNTIME?.getPublicConfig'),'MFA deve obter configuração pública somente pelo runtime central.');
expect(!source.includes('fetch(CONFIG_URL'),'MFA não pode manter fallback próprio de fetch da configuração pública.');
expect(source.includes("cfg.scope!=='padoka'"),'MFA deve rejeitar configuração fora do escopo PADOKA.');
expect(source.includes("url.origin===SUPABASE_URL&&url.pathname==='/'&&url.search===''&&url.hash===''"),'MFA deve exigir a raiz exata do projeto PADOKA.');
expect(source.includes("value.startsWith('sb_publishable_')||validLegacyAnonKey(value)"),'MFA deve aceitar apenas publishable key ou JWT público legado validado.');
expect(source.includes("payload?.role==='anon'"),'JWT legado do MFA deve exigir role anon.');

const configRead=source.indexOf('const cfg=await getPublicConfig();');
const clientCreate=source.indexOf('window.supabase.createClient',configRead);
const authRead=source.indexOf('sb.auth.getSession()',clientCreate);
expect(configRead>=0&&clientCreate>configRead&&authRead>clientCreate,'MFA deve validar configuração antes de criar cliente e ler a sessão.');

expect(source.includes("sb.from('padoka_staff_users')"),'MFA deve continuar validando funcionário em padoka_staff_users.');
expect(source.includes("['owner','manager'].includes(role)"),'MFA privilegiado deve continuar limitado a owner/manager.');
expect(!source.includes('service_role')&&!source.includes('sb_secret_'),'MFA público não pode conter credencial administrativa.');
expect(!/infotech/i.test(source),'MFA PADOKA não pode depender do backend InfoTech.');

console.log('mfa-runtime-config-audit: ok');
