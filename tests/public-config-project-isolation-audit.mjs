import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/padoka-public-config/index.ts',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes('const PADOKA_PROJECT_URL = "https://yncspxfsvlqdnodlsosb.supabase.co"'))fail('Public config deve fixar o backend correto da PADOKA.');
if(!source.includes('const readPadokaProjectUrl = () =>'))fail('Public config deve validar SUPABASE_URL antes de usá-la.');
if(!source.includes('parsed.origin === PADOKA_PROJECT_URL'))fail('Public config deve rejeitar origem Supabase diferente da PADOKA.');
if(!source.includes('parsed.pathname === "/"'))fail('Public config não deve aceitar caminho inesperado em SUPABASE_URL.');
if(!source.includes('const url = readPadokaProjectUrl();'))fail('Handler deve usar somente a URL validada da PADOKA.');
if(source.includes('const url = Deno.env.get("SUPABASE_URL")'))fail('Handler não deve consumir SUPABASE_URL sem validação de projeto.');
if(!source.includes('return json(503, { error: "config_unavailable" }, origin)'))fail('Configuração inválida deve falhar fechada.');
if(!source.includes('googleEnabled = Boolean(body?.external?.google)'))fail('Detecção amigável do provider Google deve ser preservada.');

console.log('public-config-project-isolation-audit: ok');
