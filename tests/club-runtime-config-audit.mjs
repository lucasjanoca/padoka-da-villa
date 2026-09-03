import fs from 'node:fs';

const source=fs.readFileSync('assets/club.js','utf8');
const html=fs.readFileSync('club.html','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

const expectedUrl='https://yncspxfsvlqdnodlsosb.supabase.co';
expect(source.includes("const EXPECTED_PROJECT_REF='yncspxfsvlqdnodlsosb'"),'PADOKA Club deve permanecer fixado no project ref correto.');
expect(source.includes('const SUPABASE_URL=`https://${EXPECTED_PROJECT_REF}.supabase.co`'),'PADOKA Club deve derivar a URL apenas do project ref esperado.');
expect(html.includes('<script src="assets/frame-guard.js"></script><script src="assets/app-runtime.js"></script>'),'PADOKA Club deve carregar o runtime endurecido antes do módulo do cliente.');
expect(source.includes('window.PADOKA_RUNTIME?.getPublicConfig'),'PADOKA Club deve obter configuração pública somente pelo runtime central.');
expect(!source.includes('fetch(CONFIG_URL')&&!source.includes('padoka-public-config'),'PADOKA Club não pode manter fallback próprio de fetch da configuração pública.');
expect(source.includes("cfg?.scope!=='padoka'"),'PADOKA Club deve rejeitar configuração fora do escopo PADOKA.');
expect(source.includes("parsed.origin!==SUPABASE_URL||parsed.pathname!=='/'"),'PADOKA Club deve exigir a raiz exata do backend PADOKA.');
expect(source.includes("key.startsWith('sb_publishable_')"),'PADOKA Club deve aceitar publishable key moderna.');
expect(source.includes("decodeJwtPayload(key)?.role==='anon'"),'JWT público legado do Club deve exigir role anon.');

const runtimeRead=source.indexOf('const cfg=await window.PADOKA_RUNTIME.getPublicConfig();');
const validation=source.indexOf('const publishableKey=validateConfig(cfg);',runtimeRead);
const clientCreate=source.indexOf('window.supabase.createClient',validation);
const authRead=source.indexOf('sb.auth.getSession()',clientCreate);
expect(runtimeRead>=0&&validation>runtimeRead&&clientCreate>validation&&authRead>clientCreate,'PADOKA Club deve validar configuração antes de criar cliente e ler sessão.');

expect(source.includes("sb.rpc('padoka_redeem_reward_once'"),'Resgate deve continuar server-authoritative via RPC PADOKA idempotente.');
expect(source.includes('p_request_id:attempt.requestId'),'Resgate deve enviar request_id para retry seguro.');
expect(!source.includes("sb.rpc('padoka_redeem_reward'"),'RPC legado de resgate sem idempotência não pode voltar ao runtime.');
expect(source.includes("sb.rpc('padoka_cancel_loyalty_redemption'"),'Cancelamento deve continuar server-authoritative via RPC PADOKA.');
expect(!source.includes(".update({points_balance")&&!source.includes(".insert({points_balance"),'Cliente não pode gravar saldo de fidelidade diretamente.');
expect(!source.includes('service_role')&&!source.includes('sb_secret_'),'Frontend público não pode conter credencial administrativa.');
expect(!/infotech/i.test(source),'PADOKA Club não pode depender do backend InfoTech.');

console.log('club-runtime-config-audit: ok');