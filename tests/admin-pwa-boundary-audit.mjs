import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const installer = read('admin-install.html');
const manifestRaw = read('admin-manifest.webmanifest');
const serviceWorker = read('service-worker.js');
const publicPages = ['index.html','produto.html','conta.html','pagamento.html','acompanhamento.html','club.html'];
const privatePages = ['internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html','club-admin.html'];

let manifest = null;
try {
  manifest = JSON.parse(manifestRaw);
} catch {
  failures.push('admin-manifest.webmanifest: JSON inválido');
}

if (manifest) {
  ok(manifest.id === './adm-padoka', 'admin manifest: id dedicado do ADM Padoka ausente');
  ok(manifest.name === 'ADM Padoka', 'admin manifest: nome ADM Padoka ausente');
  ok(manifest.start_url === './internal.html?app=adm-padoka', 'admin manifest: start_url dedicado do ADM Padoka ausente');
  ok(manifest.scope === './', 'admin manifest: scope inesperado');
  ok(manifest.display === 'standalone', 'admin manifest: display standalone ausente');
}

ok(installer.includes('rel="manifest" href="admin-manifest.webmanifest"'), 'admin installer: manifesto ADM não está vinculado');
ok(installer.includes('data-home="internal.html"'), 'admin installer: destino interno esperado ausente');
ok(installer.includes('form-action \'none\''), 'admin installer: CSP não bloqueia envio de formulários');
ok(installer.includes('frame-ancestors \'none\''), 'admin installer: CSP não bloqueia embedding');
ok(installer.includes('connect-src \'self\''), 'admin installer: CSP permite conexões externas inesperadas');
ok(installer.includes('noindex,nofollow,noarchive'), 'admin installer: proteção contra indexação ausente');
ok(!/service_role|sb_secret_|client_secret/i.test(installer + manifestRaw), 'admin PWA: segredo/credencial administrativa detectada');
ok(!/supabase\.co|auth\/v1|rest\/v1|functions\/v1/i.test(installer), 'admin installer: não deve consultar backend nem autenticação diretamente');

for (const page of publicPages) {
  const source = read(page);
  ok(!/(?:href|action|formaction)=["'][^"']*admin-install\.html(?:[?#][^"']*)?["']/i.test(source), `${page}: anuncia instalador administrativo`);
  ok(!/rel=["']manifest["'][^>]*href=["'][^"']*admin-manifest\.webmanifest/i.test(source), `${page}: usa manifesto administrativo`);

  for (const privatePage of privatePages) {
    const escaped = privatePage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const directNavigation = new RegExp(`(?:href|action|formaction)=["'][^"']*(?:^|\\/|\\.\\/)${escaped}(?:[?#][^"']*)?["']`, 'i');
    ok(!directNavigation.test(source), `${page}: expõe navegação pública direta para ${privatePage}`);
  }

  ok(!/<script\b[^>]*\bsrc=["'][^"']*assets\/(?:internal-nav|admin-dashboard-live|operational-sync|loss-registration|pdv-idempotency|staff-management|reporting|settings-sync)\.js(?:[?#][^"']*)?["'][^>]*>/i.test(source), `${page}: carrega runtime administrativo em página pública`);
}

for (const page of privatePages) {
  ok(serviceWorker.includes(`'${page}'`), `service-worker: ${page} não está classificada em PRIVATE_PATHS`);
  const appShellSection = serviceWorker.split('const APP_SHELL = [')[1]?.split('];')[0] || '';
  const publicCacheSection = serviceWorker.split('const PUBLIC_CACHE_PATHS = new Set([')[1]?.split(']);')[0] || '';
  ok(!appShellSection.includes(`'./${page}'`), `service-worker: ${page} entrou no APP_SHELL público`);
  ok(!publicCacheSection.includes(`'${page}'`), `service-worker: ${page} entrou no cache público`);
}

ok(serviceWorker.includes("if (!path || PRIVATE_PATHS.has(path)) return false;"), 'service-worker: bloqueio explícito de cache para PRIVATE_PATHS ausente');
ok(!serviceWorker.includes("'./admin-install.html'"), 'service-worker: instalador ADM não deve ser pré-cacheado no APP_SHELL público');
ok(!serviceWorker.includes("'admin-manifest.webmanifest'"), 'service-worker: manifesto ADM não deve entrar no cache público');

if (failures.length) {
  console.error(`PADOKA admin PWA boundary audit: ${failures.length} falha(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('PADOKA admin PWA boundary audit: OK');
