import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const fail = m => { console.error('FAIL:', m); process.exitCode = 1; };
const need = (cond, m) => { if (!cond) fail(m); };

const pwa = read('assets/padoka-pwa.js');
const sw = read('service-worker.js');
const manifest = JSON.parse(read('manifest.webmanifest'));
const pushFn = read('supabase/functions/padoka-push/index.ts');
const vaultMigration = read('supabase/050_push_vault_and_internal_auth.sql');
const dropMigration = read('supabase/051_push_remove_public_private_key.sql');
const pages = ['index.html','produto.html','pagamento.html','conta.html','acompanhamento.html','club.html'];

need(pwa.includes('beforeinstallprompt'), 'PWA: hook nativo de instalação ausente');
need(pwa.includes('window.setTimeout(() => showInstallBanner(), 450)'), 'PWA: aviso de instalação não aparece em toda entrada');
need(!pwa.includes('INSTALL_DISMISS_KEY'), 'PWA: bloqueio persistente do aviso de instalação reapareceu');
need(!pwa.includes('installDismissedRecently'), 'PWA: cooldown de instalação reapareceu');
need(pwa.includes('pushManager.subscribe'), 'PWA: assinatura Web Push ausente');
need(pwa.includes("Notification.requestPermission()"), 'PWA: pedido explícito de permissão push ausente');

need(sw.includes("const CACHE_NAME = 'padoka-pwa-v8'"), 'Service Worker: versão de cache atual ausente');
need(sw.includes("addEventListener('push'"), 'Service Worker: listener push ausente');
need(sw.includes("addEventListener('notificationclick'"), 'Service Worker: clique em notificação ausente');

need(manifest.display === 'standalone', 'Manifest: display standalone ausente');
need(manifest.icons?.some(i=>i.src==='assets/icon-192.png'&&i.sizes==='192x192'&&i.type==='image/png'),'Manifest: ícone PNG 192 ausente');
need(manifest.icons?.some(i=>i.src==='assets/icon-512.png'&&i.sizes==='512x512'&&i.type==='image/png'),'Manifest: ícone PNG 512 ausente');
need(sw.includes("icon: './assets/icon-192.png'"),'Service Worker: notificação não usa ícone PNG');
need(sw.includes("'./assets/icon-512.png'"),'Service Worker: ícone 512 não está no shell PWA');
need(sw.includes("'./assets/runtime-security.css'"),'Service Worker: CSS crítico de segurança não está no shell');
need(sw.includes("'./assets/app-shell.css'"),'Service Worker: shell visual do app não está em cache');
need(sw.includes("'./assets/app-runtime.js'"),'Service Worker: runtime do app não está em cache');
need(sw.includes("'./assets/frame-guard.js'"),'Service Worker: frame guard não está no shell');
need(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'Manifest: atalhos do app ausentes');
need(manifest.orientation === 'portrait-primary', 'Manifest: orientação mobile profissional ausente');
need(manifest.launch_handler?.client_mode?.includes('navigate-existing'), 'Manifest: reaproveitamento da janela instalada ausente');

for (const page of pages) {
  const source = read(page);
  need(source.includes('assets/padoka-pwa.js?v=4'), `${page}: cliente PWA v4 ausente`);
  need(source.includes('rel="manifest"'), `${page}: manifest PWA ausente`);
  need(source.includes('rel="apple-touch-icon"') && source.includes('assets/icon-192.png'), `${page}: Apple touch icon ausente`);
}

need(pushFn.includes('padoka_get_push_server_config'), 'Push: segredo do servidor não vem do backend protegido');
need(pushFn.includes('x-padoka-push-secret'), 'Push: autenticação interna do webhook ausente');
need(pushFn.includes('constantTimeEqual'), 'Push: comparação protegida do segredo interno ausente');
need(pushFn.includes('rawBody.length > 16_384'), 'Push: limite de payload ausente');
need(pushFn.includes('content_type_required'), 'Push: validação de Content-Type ausente');
need(pushFn.includes('keepBeforeUpsert = existingEndpoint ? 5 : 4'), 'Push: limite de 5 dispositivos por conta ausente');
need(pushFn.includes('subscription_prune_failed'), 'Push: poda de assinaturas antigas ausente');
need(!pushFn.includes('select("vapid_public_key,vapid_private_key'), 'Push: chave privada voltou a ser consultada da tabela pública');

need(vaultMigration.includes("padoka_vapid_private_key"), 'Vault: segredo VAPID não está migrado');
need(vaultMigration.includes("padoka_push_webhook_secret"), 'Vault: segredo interno do push não está migrado');
need(vaultMigration.includes("revoke all on function public.padoka_get_push_server_config()"), 'Vault: RPC de segredo sem revoke explícito');
need(dropMigration.includes('drop column if exists vapid_private_key'), 'Banco: chave privada não é removida do schema público');

if (!process.exitCode) console.log('PWA + Web Push security audit: OK');
