import fs from 'node:fs';

const source=fs.readFileSync('assets/feature-flags.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"),'Feature flags devem permanecer fixadas no backend PADOKA correto.');
expect(source.includes("typeof window.PADOKA_RUNTIME?.getPublicConfig!=='function'"),'Feature flags devem falhar fechadas sem o runtime central.');
expect(source.includes('await window.PADOKA_RUNTIME.getPublicConfig()'),'Feature flags devem obter configuração pública somente pelo runtime central.');
expect(!source.includes('padoka-public-config')&&!source.includes('fetch(CONFIG_URL'),'Feature flags não podem manter fallback próprio da configuração pública.');
expect(source.includes("value.scope!=='padoka'"),'Feature flags devem rejeitar configuração fora do escopo PADOKA.');
expect(source.includes("url.origin!==PADOKA_ORIGIN||url.pathname!=='/'"),'Feature flags devem exigir a raiz exata do backend PADOKA.');
expect(source.includes("value.startsWith('sb_publishable_')"),'Feature flags devem aceitar a publishable key moderna.');
expect(source.includes("decodeJwtPayload(value)?.role==='anon'"),'JWT público legado deve exigir role anon.');
expect(source.includes("contentType.includes('application/json')"),'Resposta REST das feature flags deve exigir JSON.');
expect(source.includes("audience=eq.public"),'Consulta das feature flags deve permanecer limitada à audiência pública.');
expect(source.includes("cache:'no-store',credentials:'omit',redirect:'error'"),'Fetch público deve continuar sem credenciais, sem cache e sem redirects.');
expect(!source.includes('sb_secret_')&&!source.includes('service_role'),'Feature flags públicas não podem conter credencial administrativa.');
expect(!/infotech/i.test(source),'Feature flags da PADOKA não podem depender do backend InfoTech.');

const runtimeRead=source.indexOf('await window.PADOKA_RUNTIME.getPublicConfig()');
const configValidation=source.indexOf('validateConfig(',Math.max(0,runtimeRead-80));
const restFetch=source.indexOf("'/rest/v1/padoka_feature_flags",runtimeRead);
expect(runtimeRead>=0&&configValidation>=0&&restFetch>runtimeRead,'Configuração deve ser validada antes da consulta REST das feature flags.');

console.log('feature-flags-runtime-config-audit: ok');
