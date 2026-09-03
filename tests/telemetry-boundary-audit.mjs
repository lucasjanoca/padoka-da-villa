import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('assets/telemetry.js', root), 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

for (const page of ['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html','mfa.html']) {
  ok(source.includes(`'${page}'`), `telemetry: ${page} precisa permanecer na fronteira interna`);
}
const internalGuard='if(INTERNAL_PAGES.has(currentPage))return;';
const endpointDeclaration="const ENDPOINT=PADOKA_ORIGIN+'/functions/v1/padoka-telemetry'";
ok(/if\(INTERNAL_PAGES\.has\(currentPage\)\)return;/.test(source), 'telemetry: páginas internas precisam abortar antes de inicializar sessão/endpoint');
ok(source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'telemetry: origin precisa permanecer fixado no backend PADOKA');
ok(source.includes(endpointDeclaration), 'telemetry: endpoint precisa derivar do origin PADOKA validado');
ok(source.indexOf(internalGuard) < source.indexOf(endpointDeclaration), 'telemetry: bloqueio interno deve ocorrer antes de configurar o endpoint');
ok(source.indexOf(internalGuard) < source.indexOf("sessionStorage.getItem(KEY)"), 'telemetry: página interna não deve criar/restaurar sessão de telemetria');
ok(source.includes("credentials:'omit'"), 'telemetry: envio público deve continuar sem credenciais do navegador');

if (failures.length) {
  console.error(`PADOKA telemetry boundary audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PADOKA telemetry boundary audit: OK');
