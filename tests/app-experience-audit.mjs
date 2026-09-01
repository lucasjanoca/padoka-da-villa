import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

const accountPage=read('conta.html');
const account=read('assets/account.js');
const runtime=read('assets/app-runtime.js');
const appCss=read('assets/app-shell.css');
const sw=read('service-worker.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const publicPages=['index.html','produto.html','pagamento.html','acompanhamento.html','conta.html','club.html'];

need(/id="loginView"[^>]*class="[^"]*hidden|class="[^"]*hidden[^"]*"[^>]*id="loginView"/.test(accountPage),'Conta: login não deve piscar antes da restauração da sessão');
need(accountPage.includes('id="sessionBoot"'),'Conta: estado de restauração de sessão ausente');
need(accountPage.includes('assets/account.js'),'Conta: controlador externo de sessão ausente');
need(accountPage.includes('assets/app-runtime.js'),'Conta: runtime do app ausente');

need(account.includes('persistSession:true'),'Conta: sessão persistente deve permanecer habilitada');
need(account.includes('autoRefreshToken:true'),'Conta: refresh automático do token deve permanecer habilitado');
need(account.includes("event==='INITIAL_SESSION'"),'Conta: evento INITIAL_SESSION deve ser deduplicado');
const googleCheck=account.indexOf('checkGoogle();');
const sessionLoad=Math.max(account.indexOf('await load(session);'),account.indexOf('await loadPrepared(session,lifecycle);'));
need(sessionLoad>=0&&googleCheck>sessionLoad,'Conta: sessão deve ser resolvida antes da verificação não crítica do Google');
need(!account.includes('await checkGoogle();'),'Conta: verificação do Google voltou a bloquear a restauração da sessão');

need(runtime.includes("padoka-auth-booting"),'Runtime: proteção contra flicker de autenticação ausente');
need(runtime.includes("sb-.*-auth-token"),'Runtime: dica visual de sessão persistida ausente');
need(runtime.includes('getPublicConfig'),'Runtime: cache da configuração pública ausente');
need(runtime.includes('nativeFetch'),'Runtime: fast-path de config deve preservar fetch nativo');
need(runtime.includes("url===PUBLIC_CONFIG_URL&&method==='GET'"),'Runtime: interceptação de fetch deve ficar limitada à config pública');
need(runtime.includes('padoka-standalone'),'Runtime: detecção de modo instalado ausente');

need(appCss.includes('overscroll-behavior-y:none'),'App shell: comportamento nativo de rolagem ausente');
need(appCss.includes('touch-action:manipulation'),'App shell: resposta rápida de toque ausente');

for(const page of publicPages){
  const source=read(page);
  need(source.includes('assets/app-shell.css'),page+': shell visual do app ausente');
  need(source.includes('assets/app-runtime.js'),page+': runtime do app ausente');
  need(source.includes('assets/padoka-pwa.js?v=4'),page+': cliente PWA v4 ausente');
}

need(sw.includes("const CACHE_NAME = 'padoka-pwa-v8'"),'Service Worker: cache v8 ausente');
need(sw.includes('navigationPreload.enable()'),'Service Worker: navigation preload ausente');
need(sw.includes('event.waitUntil(refresh)'),'Service Worker: stale-while-revalidate ausente');
need(sw.includes('isCacheableRemoteRequest'),'Service Worker: cache remoto público controlado ausente');
need(sw.includes("request.headers.has('authorization')"),'Service Worker: cache remoto não bloqueia requisições autenticadas');

need(manifest.display==='standalone','Manifest: app deve abrir em standalone');
need(manifest.launch_handler?.client_mode?.includes('navigate-existing'),'Manifest: deve reaproveitar a janela instalada');

if(!process.exitCode)console.log('PADOKA app experience audit: OK');
