(() => {
  'use strict';

  const PUSH_URL = 'https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-push';
  const INSTALL_DISMISS_KEY = 'padoka_pwa_install_dismissed_v1';
  const INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
  const BOUND = Symbol('padokaPwaBound');
  let deferredInstallPrompt = null;
  let serviceWorkerRegistration = null;
  let lastSession = null;
  let authSubscription = null;
  let installBanner = null;
  let pushBanner = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const pushSupported = () =>
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  function injectStyles() {
    if (document.getElementById('padokaPwaStyles')) return;
    const style = document.createElement('style');
    style.id = 'padokaPwaStyles';
    style.textContent = [
      '.padoka-pwa-card{position:fixed;left:12px;right:12px;bottom:88px;z-index:96;max-width:460px;margin:auto;background:#fffdf9;color:#17130f;border:1px solid #dfd1c3;border-radius:19px;box-shadow:0 18px 50px rgba(30,20,12,.22);padding:14px;display:grid;grid-template-columns:44px 1fr auto;gap:11px;align-items:center;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}',
      '.padoka-pwa-card[hidden]{display:none!important}',
      '.padoka-pwa-icon{width:44px;height:44px;border-radius:13px;background:#15120f;display:grid;place-items:center;overflow:hidden}',
      '.padoka-pwa-icon img{width:38px;height:38px;object-fit:contain}',
      '.padoka-pwa-copy strong{display:block;font-size:12px;line-height:1.25}',
      '.padoka-pwa-copy span{display:block;margin-top:3px;color:#776e65;font-size:9.5px;line-height:1.35}',
      '.padoka-pwa-actions{display:flex;gap:6px;align-items:center}',
      '.padoka-pwa-btn{border:0;border-radius:11px;padding:9px 10px;font:800 9.5px/1 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap;background:#15120f;color:#fff}',
      '.padoka-pwa-close{border:0;background:transparent;color:#776e65;font-size:18px;line-height:1;padding:5px;cursor:pointer}',
      '@media(min-width:700px){.padoka-pwa-card{left:auto;right:18px;bottom:18px;margin:0;width:min(440px,calc(100% - 36px))}}',
      '@media(max-width:410px){.padoka-pwa-card{grid-template-columns:40px 1fr}.padoka-pwa-actions{grid-column:1/-1;justify-content:flex-end}.padoka-pwa-icon{width:40px;height:40px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function makeCard({ id, title, text, actionLabel, onAction, onClose }) {
    injectStyles();
    const card = document.createElement('aside');
    card.className = 'padoka-pwa-card';
    card.id = id;
    card.setAttribute('role', 'status');
    card.innerHTML =
      '<div class="padoka-pwa-icon"><img src="assets/logo-padoka.svg" alt=""></div>' +
      '<div class="padoka-pwa-copy"><strong></strong><span></span></div>' +
      '<div class="padoka-pwa-actions"><button class="padoka-pwa-btn" type="button"></button><button class="padoka-pwa-close" type="button" aria-label="Fechar">×</button></div>';
    card.querySelector('strong').textContent = title;
    card.querySelector('.padoka-pwa-copy span').textContent = text;
    const action = card.querySelector('.padoka-pwa-btn');
    action.textContent = actionLabel;
    action.addEventListener('click', onAction);
    card.querySelector('.padoka-pwa-close').addEventListener('click', () => {
      card.hidden = true;
      if (onClose) onClose();
    });
    document.body.appendChild(card);
    return card;
  }

  function installDismissedRecently() {
    const stamp = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
    return stamp > 0 && Date.now() - stamp < INSTALL_DISMISS_MS;
  }

  function hideInstallBanner() {
    if (installBanner) installBanner.hidden = true;
  }

  function showInstallBanner(force = false) {
    if (isStandalone() || (!force && installDismissedRecently())) return;
    if (!installBanner) {
      installBanner = makeCard({
        id: 'padokaInstallCard',
        title: 'Tenha a PADOKA no celular',
        text: 'Instale o app para abrir mais rápido e receber avisos do andamento do pedido.',
        actionLabel: 'Instalar app',
        onAction: installApp,
        onClose: () => { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); window.setTimeout(() => showPushBanner(), 250); }
      });
    }
    installBanner.hidden = false;
  }

  async function installApp() {
    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await promptEvent.prompt();
      try {
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') hideInstallBanner();
      } catch {}
      return;
    }
    const text = installBanner && installBanner.querySelector('.padoka-pwa-copy span');
    if (!text) return;
    text.textContent = isIos()
      ? 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.'
      : 'Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.';
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      return serviceWorkerRegistration;
    } catch (error) {
      console.error('Falha ao registrar o app da PADOKA', error);
      return null;
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
  }

  async function fetchPushConfig() {
    const response = await fetch(PUSH_URL + '?action=config', { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('push_config_unavailable');
    const data = await response.json();
    if (!data || typeof data.publicKey !== 'string') throw new Error('push_config_invalid');
    return data;
  }

  async function postPush(action, payload, session) {
    if (!session || !session.access_token) throw new Error('missing_session');
    const response = await fetch(PUSH_URL, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + session.access_token
      },
      body: JSON.stringify({ action, ...payload })
    });
    if (!response.ok) throw new Error('push_backend_' + response.status);
    return response.json();
  }

  async function currentRegistration() {
    if (serviceWorkerRegistration) return serviceWorkerRegistration;
    const registered = await registerServiceWorker();
    if (registered) return registered;
    return navigator.serviceWorker.ready;
  }

  function hidePushBanner() {
    if (pushBanner) pushBanner.hidden = true;
  }

  async function syncExistingSubscription(session) {
    if (!pushSupported() || !session || Notification.permission !== 'granted') return false;
    try {
      const registration = await currentRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;
      await postPush('subscribe', { subscription: subscription.toJSON() }, session);
      hidePushBanner();
      return true;
    } catch (error) {
      console.error('Falha ao sincronizar notificações da PADOKA', error);
      return false;
    }
  }

  async function enablePush() {
    if (!lastSession) {
      location.href = 'conta.html';
      return false;
    }
    if (!pushSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        if (pushBanner) pushBanner.querySelector('.padoka-pwa-copy span').textContent =
          'As notificações estão bloqueadas. Libere a permissão nas configurações do navegador.';
        return false;
      }
      const [registration, config] = await Promise.all([currentRegistration(), fetchPushConfig()]);
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey)
        });
      }
      await postPush('subscribe', { subscription: subscription.toJSON() }, lastSession);
      hidePushBanner();
      return true;
    } catch (error) {
      console.error('Falha ao ativar notificações da PADOKA', error);
      if (pushBanner) pushBanner.querySelector('.padoka-pwa-copy span').textContent =
        'Não foi possível ativar agora. Tente novamente em instantes.';
      return false;
    }
  }

  async function disablePush(session = lastSession) {
    if (!pushSupported()) return false;
    try {
      const registration = await currentRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;
      if (session && session.access_token) {
        try {
          await postPush('unsubscribe', { endpoint: subscription.endpoint }, session);
        } catch (error) {
          console.error('Falha ao remover assinatura no servidor', error);
        }
      }
      await subscription.unsubscribe();
      return true;
    } catch (error) {
      console.error('Falha ao desativar notificações da PADOKA', error);
      return false;
    }
  }

  function showPushBanner() {
    if (!lastSession || !pushSupported() || Notification.permission === 'granted') return;
    if (!pushBanner) {
      const iosNeedsInstall = isIos() && !isStandalone();
      pushBanner = makeCard({
        id: 'padokaPushCard',
        title: 'Acompanhe seu pedido sem ficar olhando a tela',
        text: iosNeedsInstall
          ? 'Instale o app primeiro. Depois abra a PADOKA pela tela inicial para ativar os avisos.'
          : 'Ative as notificações para saber quando o pedido for confirmado, entrar em preparo e ficar pronto.',
        actionLabel: iosNeedsInstall ? 'Instalar app' : 'Ativar avisos',
        onAction: () => iosNeedsInstall ? showInstallBanner(true) : enablePush()
      });
    }
    pushBanner.hidden = false;
  }

  async function handleSession(session) {
    const previous = lastSession;
    lastSession = session || null;
    if (!lastSession) {
      hidePushBanner();
      if (previous) await disablePush(previous);
      return;
    }
    const synced = await syncExistingSubscription(lastSession);
    if (!synced && Notification.permission !== 'denied') showPushBanner();
  }

  async function bindSupabase(client) {
    if (!client || client[BOUND]) return;
    client[BOUND] = true;
    try {
      const { data: { session } } = await client.auth.getSession();
      await handleSession(session);
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => handleSession(session), 0);
      });
      authSubscription = data && data.subscription;
    } catch (error) {
      console.error('Falha ao conectar notificações à conta da PADOKA', error);
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    localStorage.removeItem(INSTALL_DISMISS_KEY);
    hideInstallBanner();
  });

  window.addEventListener('padoka:supabase-ready', (event) => {
    bindSupabase(event.detail && event.detail.client ? event.detail.client : window.padokaSupabase);
  });

  window.PADOKA_PWA = {
    install: installApp,
    enablePush,
    disablePush,
    syncPush: () => syncExistingSubscription(lastSession)
  };

  document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    if (!isStandalone()) window.setTimeout(() => showInstallBanner(), 1200);
    if (window.padokaSupabase) bindSupabase(window.padokaSupabase);
  });

  window.addEventListener('pagehide', () => {
    if (authSubscription && typeof authSubscription.unsubscribe === 'function') authSubscription.unsubscribe();
  });
})();