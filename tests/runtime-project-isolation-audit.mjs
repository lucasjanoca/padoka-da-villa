import fs from 'node:fs';

const runtime=fs.readFileSync(new URL('../assets/app-runtime.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!runtime.includes("const PADOKA_PROJECT_REF='yncspxfsvlqdnodlsosb'"))fail('Runtime deve fixar o project ref correto da PADOKA.');
if(!runtime.includes("const PADOKA_AUTH_STORAGE_KEY=`sb-${PADOKA_PROJECT_REF}-auth-token`"))fail('Hint de sessão deve usar somente a chave Auth do projeto PADOKA.');
if(runtime.includes('/^sb-.*-auth-token$/')||runtime.includes('sb-.*-auth-token'))fail('Runtime não deve considerar tokens de outros projetos Supabase no boot da conta.');
if(!runtime.includes('localStorage.getItem(PADOKA_AUTH_STORAGE_KEY)'))fail('Boot da conta deve consultar somente o token persistido da PADOKA.');
if(!runtime.includes('return url.origin===PADOKA_ORIGIN'))fail('Configuração pública deve continuar presa à origem PADOKA.');
if(!runtime.includes("const PUBLIC_CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config'"))fail('Configuração pública deve continuar carregada somente do backend PADOKA.');
if(!runtime.includes('const PUBLIC_CONFIG_MAX_AGE=5*60*1000;'))fail('Cache da configuração pública deve expirar em até 5 minutos para não manter estado de providers desatualizado por horas.');
if(!runtime.includes("nativeFetch(PUBLIC_CONFIG_URL,{cache:'no-store',credentials:'omit'})"))fail('Atualização da configuração pública deve continuar sem cookies e sem cache HTTP.');

console.log('runtime-project-isolation-audit: ok');
