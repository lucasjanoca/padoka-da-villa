(() => {
  'use strict';

  if (window.top !== window.self) {
    document.documentElement.classList.add('padoka-framed');
    try { window.top.location = window.location.href; } catch {}
    return;
  }

  const page = location.pathname.split('/').pop() || 'index.html';
  const adminPages = new Set([
    'internal.html',
    'pedidos.html',
    'pdv.html',
    'gestao.html',
    'enterprise.html',
    'club-admin.html',
    'mfa.html',
    'admin-install.html'
  ]);
  if (!adminPages.has(page)) return;

  const ADMIN_APP_KEY = 'padoka_admin_pwa_session';
  const ADMIN_APP_VALUE = 'adm-padoka';
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const launchedAsAdminApp = () => {
    try { return standalone() && sessionStorage.getItem(ADMIN_APP_KEY) === ADMIN_APP_VALUE; }
    catch { return false; }
  };

  const query = new URLSearchParams(location.search);
  if (standalone() && query.get('app') === ADMIN_APP_VALUE) {
    try { sessionStorage.setItem(ADMIN_APP_KEY, ADMIN_APP_VALUE); } catch {}
  }

  if (!document.querySelector('link[rel="manifest"][href*="admin-manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = 'admin-manifest.webmanifest';
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('meta[name="application-name"]')) {
    const name = document.createElement('meta');
    name.name = 'application-name';
    name.content = 'ADM Padoka';
    document.head.appendChild(name);
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'apple-touch-icon';
    icon.href = 'assets/icon-192.png';
    document.head.appendChild(icon);
  }

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    const status = document.getElementById('status');
    if (page === 'admin-install.html' && status) status.textContent = 'Pronto para instalar o ADM Padoka neste aparelho.';
    syncButtons();
  });

  async function requestInstall() {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        const status = document.getElementById('status');
        if (status) status.textContent = choice?.outcome === 'accepted' ? 'ADM Padoka instalado com sucesso.' : 'Instalação cancelada. Você pode tentar novamente.';
      } catch {}
      return;
    }
    if (page !== 'admin-install.html') {
      location.href = 'admin-install.html?from=adm';
      return;
    }
    const status = document.getElementById('status');
    if (status) status.textContent = 'No Chrome, toque em ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.';
  }

  function configureButton(button, label = 'Baixar ADM Padoka') {
    if (!button || launchedAsAdminApp()) {
      if (button) button.hidden = true;
      return;
    }
    button.hidden = false;
    button.textContent = label;
    button.onclick = requestInstall;
  }

  function ensureEntryButton() {
    if (page !== 'internal.html' || launchedAsAdminApp()) return;
    const access = document.querySelector('.access');
    if (!access || document.getElementById('padokaAdminInstallEntry')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'padokaAdminInstallEntry';
    button.className = 'btn light';
    button.textContent = 'Baixar ADM Padoka';
    button.addEventListener('click', requestInstall);
    const status = access.querySelector('#status');
    if (status) status.insertAdjacentElement('afterend', button);
    else access.appendChild(button);
  }

  function syncButtons() {
    configureButton(document.getElementById('padokaAdminInstallEntry'));
    configureButton(document.getElementById('padokaInstallAdmin'), 'Instalar ADM Padoka');
    if (page === 'admin-install.html') configureButton(document.getElementById('install'), 'Instalar ADM Padoka');
  }

  const observer = new MutationObserver(() => {
    ensureEntryButton();
    syncButtons();
  });

  const start = () => {
    ensureEntryButton();
    syncButtons();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' }).catch(() => {});
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('appinstalled', () => {
    const status = document.getElementById('status');
    if (status && page === 'admin-install.html') status.textContent = 'ADM Padoka instalado com sucesso.';
    document.getElementById('padokaAdminInstallEntry')?.setAttribute('hidden', '');
    document.getElementById('padokaInstallAdmin')?.setAttribute('hidden', '');
    document.getElementById('install')?.setAttribute('hidden', '');
  });
})();
