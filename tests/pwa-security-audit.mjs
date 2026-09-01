import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

assert.match(source, /const CACHE_NAME = 'padoka-pwa-v8'/, 'PWA cache version must be bumped after security-policy changes');
assert.match(source, /const PUBLIC_CACHE_PATHS = new Set\(/, 'PWA must use an explicit public cache allowlist');
assert.match(source, /assets\/runtime-security\.css/, 'critical runtime security CSS must remain cacheable offline');
assert.match(source, /assets\/frame-guard\.js/, 'frame guard must remain cacheable offline');
for (const page of ['conta.html','acompanhamento.html','pagamento.html']) assert.doesNotMatch(source.split('const PUBLIC_CACHE_PATHS = new Set([')[1].split(']);')[0], new RegExp(`'${page.replace('.', '\\.')}'`), `${page} must not be cached as public shell`);
assert.match(source, /const PRIVATE_PATHS = new Set\(/, 'PWA must keep an explicit internal-path denylist as defense in depth');
for (const page of ['internal.html', 'pedidos.html', 'pdv.html', 'gestao.html', 'mfa.html', 'enterprise.html', 'club-admin.html']) {
  assert.match(source, new RegExp(`'${page.replace('.', '\\.')}'`), `${page} must remain classified as private`);
}
assert.match(source, /if \(isCacheableRequest\(request, url\)\)/, 'same-origin cache must remain behind the public allowlist');
assert.match(source, /if \(isCacheableRemoteRequest\(request, url\)\)/, 'remote cache must remain behind an explicit public allowlist');
assert.match(source, /request\.headers\.has\('authorization'\)/, 'remote cache must reject authenticated requests');
assert.match(source, /const cached = await caches\.match\(request\)/, 'public shell must support instant cache reads');
assert.match(source, /event\.waitUntil\(refresh\)/, 'cached responses must revalidate in background');
assert.match(source, /navigationPreload\.enable\(\)/, 'navigation preload must accelerate uncached pages');
assert.match(source, /const NOTIFICATION_TARGETS = new Set\(/, 'push navigation must use an explicit public allowlist');
assert.match(source, /function notificationTarget\(candidate\)/, 'push URLs must be normalized through a target guard');
assert.match(
  source,
  /if \(!path \|\| !NOTIFICATION_TARGETS\.has\(path\)\)/,
  'push payloads must not navigate to arbitrary same-scope pages'
);
assert.doesNotMatch(
  source,
  /icon:\s*payload\.icon/,
  'push payloads must not inject an arbitrary notification icon URL'
);

console.log('PWA security audit passed');
