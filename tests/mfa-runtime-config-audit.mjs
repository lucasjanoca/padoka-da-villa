import fs from 'node:fs';

const source=fs.readFileSync('assets/mfa.js','utf8');
const html=fs.readFileSync('mfa.html','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

// MFA/TOTP was intentionally retired from PADOKA. The old route remains only
// as a safe compatibility redirect so cached links and bookmarks do not break.
expect(source.includes('function safeReturn()'),'MFA legado deve manter retorno sanitizado.');
expect(source.includes("location.replace(safeReturn())"),'MFA legado deve redirecionar sem iniciar autenticação TOTP.');
expect(source.includes("const allowed=new Set(['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html','club-admin.html'])"),'Retorno legado deve aceitar apenas telas administrativas conhecidas.');
expect(source.includes('u.origin===location.origin'),'Retorno legado deve permanecer preso à mesma origem.');
expect(!/auth\.mfa\./.test(source),'Fluxo PADOKA não deve mais chamar API MFA no navegador.');
expect(!/createClient\(/.test(source),'Rota MFA legada não deve criar cliente Supabase.');
expect(!/publishableKey|SUPABASE_URL|CONFIG_URL/.test(source),'Rota MFA legada não deve carregar configuração de backend.');
expect(!source.includes('service_role')&&!source.includes('sb_secret_'),'Rota legada não pode conter credencial administrativa.');
expect(!/infotech/i.test(source),'Rota legada PADOKA não pode depender do backend InfoTech.');

// A página pode permanecer publicada por compatibilidade, mas precisa carregar
// o módulo externo endurecido e não reintroduzir chamadas MFA inline.
expect(html.includes('assets/mfa.js'),'Página legada deve carregar o redirecionador externo.');
expect(!/<script>(?:.|\n)*?auth\.mfa\./.test(html),'Página legada não deve conter lógica MFA inline.');

console.log('mfa-runtime-config-audit: retired flow ok');
