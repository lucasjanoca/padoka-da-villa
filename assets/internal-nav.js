(()=>{
  const root=document.getElementById('padokaInternalNav');
  if(!root)return;

  const PADOKA_SUPABASE_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';
  const supabaseLib=window.supabase;
  if(supabaseLib?.createClient&&!supabaseLib.__padokaBackendPinned){
    const originalCreateClient=supabaseLib.createClient.bind(supabaseLib);
    supabaseLib.createClient=(url,key,options)=>{
      let origin='';
      try{origin=new URL(String(url||'')).origin}catch{}
      if(origin!==PADOKA_SUPABASE_ORIGIN)throw new Error('PADOKA backend mismatch');
      return originalCreateClient(PADOKA_SUPABASE_ORIGIN,key,options);
    };
    Object.defineProperty(supabaseLib,'__padokaBackendPinned',{value:true,configurable:false,enumerable:false,writable:false});
  }

  let current=root.dataset.current||'';
  const params=new URLSearchParams(location.search);
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  const isPdv=location.pathname.endsWith('/pdv.html')||location.pathname.endsWith('pdv.html');
  const isAdmin=location.pathname.endsWith('/internal.html')||location.pathname.endsWith('internal.html');
  const isOrders=location.pathname.endsWith('/pedidos.html')||location.pathname.endsWith('pedidos.html');
  const isEnterprise=location.pathname.endsWith('/enterprise.html')||location.pathname.endsWith('enterprise.html');
  const isClub=location.pathname.endsWith('/club-admin.html')||location.pathname.endsWith('club-admin.html');
  if(isGestao)current=params.get('tab')||'produtos';
  if(isEnterprise)current='enterprise';
  if(isClub)current='club';

  const subtitle=root.dataset.subtitle||'GESTÃO INTERNA';
  const roleAccess={
    inicio:null,
    pedidos:null,
    produtos:null,
    pdv:['owner','manager','cashier','attendant'],
    estoque:['owner','manager','stock'],
    producao:['owner','manager','production'],
    perdas:['owner','manager','stock','production'],
    relatorios:['owner','manager'],
    enterprise:['owner','manager'],
    club:['owner','manager','cashier','attendant'],
    configuracoes:['owner','manager'],
    equipe:['owner']
  };
  const items=[
    ['internal.html','inicio','⌂','Visão geral'],
    ['pedidos.html','pedidos','▤','Pedidos'],
    ['pdv.html','pdv','▦','Caixa / PDV'],
    ['gestao.html?tab=produtos','produtos','◫','Produtos'],
    ['gestao.html?tab=estoque','estoque','▣','Estoque'],
    ['gestao.html?tab=producao','producao','◷','Produção'],
    ['gestao.html?tab=perdas','perdas','↘','Perdas'],
    ['gestao.html?tab=relatorios','relatorios','◒','Relatórios'],
    ['club-admin.html','club','★','PADOKA Club'],
    ['enterprise.html','enterprise','◉','Centro de Operações'],
    ['gestao.html?tab=configuracoes','configuracoes','⚙','Configurações']
  ];

  const allowed=(id,role)=>{
    const roles=roleAccess[id];
    return !roles||!!role&&roles.includes(role);
  };
  const targetNeedsRole=Array.isArray(roleAccess[current]);
  const privilegedMfaRoles=new Set(['owner','manager']);
  let staffValidationEpoch=0;
  let validatedStaffUserId='';

  document.documentElement.classList.add('padoka-staff-pending');
  if(targetNeedsRole)document.documentElement.classList.add('padoka-role-pending');

  root.innerHTML=`<header class="padoka-topbar"><div class="padoka-topbar-inner"><button class="padoka-menu-btn" id="padokaMenuBtn" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button><a class="padoka-brand-link" href="index.html#cardapio" aria-label="Ir para o cardápio"><img src="assets/logo-padoka.svg" alt="PADOKA DA VILLA"><span class="padoka-brand-copy"><strong>PADOKA DA VILLA</strong><small>${subtitle}</small></span></a><div class="padoka-top-actions"><a class="padoka-cardapio-link" href="index.html#cardapio">Cardápio</a></div></div></header><div class="padoka-nav-overlay" id="padokaNavOverlay"></div><aside class="padoka-drawer" id="padokaDrawer" aria-hidden="true"><div class="padoka-drawer-head"><img src="assets/logo-padoka.svg" alt=""><div><strong>PADOKA DA VILLA</strong><small>NAVEGAÇÃO INTERNA</small></div><button class="padoka-close-btn" id="padokaCloseBtn" type="button" aria-label="Fechar menu">×</button></div><nav class="padoka-nav-list">${items.map(([href,id,ico,label])=>`<a href="${href}" data-padoka-module="${id}" ${roleAccess[id]?'hidden':''} class="${current===id?'active':''}"><span class="nav-ico">${ico}</span>${label}</a>`).join('')}</nav><div class="padoka-drawer-foot"><a href="index.html#cardapio">Abrir cardápio do cliente</a><button type="button" id="padokaNavLogout">Sair da conta interna</button></div></aside>`;

  const drawer=document.getElementById('padokaDrawer');
  const overlay=document.getElementById('padokaNavOverlay');
  const openBtn=document.getElementById('padokaMenuBtn');
  const closeBtn=document.getElementById('padokaCloseBtn');
  function set(open){
    drawer.classList.toggle('open',open);
    overlay.classList.toggle('open',open);
    drawer.setAttribute('aria-hidden',String(!open));
    openBtn.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('padoka-body-lock',open);
  }
  openBtn.onclick=()=>set(true);
  closeBtn.onclick=()=>set(false);
  overlay.onclick=()=>set(false);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
  document.getElementById('padokaNavLogout').onclick=async()=>{
    try{if(window.padokaSupabase)await window.padokaSupabase.auth.signOut()}catch{}
    location.href='internal.html';
  };

  const moduleForHref=href=>{
    if(!href||href.startsWith('#'))return null;
    try{
      const url=new URL(href,location.href);
      if(url.pathname.endsWith('/internal.html'))return 'inicio';
      if(url.pathname.endsWith('/pedidos.html'))return 'pedidos';
      if(url.pathname.endsWith('/pdv.html'))return 'pdv';
      if(url.pathname.endsWith('/enterprise.html'))return 'enterprise';
      if(url.pathname.endsWith('/club-admin.html'))return 'club';
      if(url.pathname.endsWith('/gestao.html'))return url.searchParams.get('tab')||'produtos';
    }catch{}
    return null;
  };
  function filterPageShortcuts(role){
    document.querySelectorAll('a[href]').forEach(link=>{
      if(link.closest('#padokaInternalNav'))return;
      const module=moduleForHref(link.getAttribute('href'));
      if(module&&Object.prototype.hasOwnProperty.call(roleAccess,module))link.hidden=!allowed(module,role);
    });
  }
  function loadScript(src,dataKey){
    const attr=`data-${dataKey.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}`;
    if(document.querySelector(`script[${attr}]`))return;
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    s.dataset[dataKey]='1';
    document.head.appendChild(s);
  }
  function loadValidatedModuleScripts(role){
    if(!allowed(current,role))return;
    if(isAdmin)loadScript('assets/admin-dashboard-live.js','padokaAdminDashboard');
    if(isOrders)loadScript('assets/orders-auth-lifecycle.js','padokaOrdersAuthLifecycle');
    if(isPdv){
      loadScript('assets/pdv-scanner-fix.js','padokaPdvScanner');
      loadScript('assets/pdv-idempotency.js','padokaPdvIdempotency');
      loadScript('assets/pdv-sale-void.js','padokaPdvSaleVoid');
    }
    if(!isGestao)return;
    if(current==='produtos')loadScript('assets/product-management.js','padokaProductManagement');
    if(['estoque','producao','perdas','relatorios'].includes(current))loadScript('assets/operational-sync.js','padokaOps');
    if(current==='producao')loadScript('assets/production-completion.js','padokaProduction');
    if(current==='perdas')loadScript('assets/loss-registration.js','padokaLoss');
    if(current==='relatorios')loadScript('assets/reporting-sync.js','padokaReporting');
    if(current==='configuracoes')loadScript('assets/settings-sync.js','padokaSettings');
    if(current==='equipe'){
      loadScript('assets/staff-management-lifecycle.js','padokaStaffManagementLifecycle');
      loadScript('assets/staff-management.js','padokaStaffManagement');
      loadScript('assets/staff-audit.js','padokaStaffAudit');
    }
  }

  async function waitForClient(){
    for(let i=0;i<80;i++){
      if(window.padokaSupabase)return window.padokaSupabase;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  }
  async function safeSession(client){
    try{
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      return data?.session||null;
    }catch(error){
      console.warn('PADOKA internal session check:',error);
      return null;
    }
  }
  function mfaReturnTarget(){
    const name=location.pathname.split('/').pop()||'internal.html';
    return name==='gestao.html'?name+location.search:name;
  }
  async function ensurePrivilegedMfa(client,role,expectedUserId){
    if(!privilegedMfaRoles.has(role))return true;
    const session=await safeSession(client);
    if(!session||session.user.id!==expectedUserId)throw new Error('mfa session changed');
    const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if(error)throw error;
    if(data?.currentLevel==='aal2')return true;
    location.replace('mfa.html?return='+encodeURIComponent(mfaReturnTarget()));
    return false;
  }
  function clearResolvedStaff(){
    validatedStaffUserId='';
    delete window.padokaStaffRole;
    delete window.padokaCanAccess;
    delete root.dataset.staffRole;
    root.querySelectorAll('[data-padoka-module]').forEach(link=>{
      if(roleAccess[link.dataset.padokaModule])link.hidden=true;
    });
    document.documentElement.classList.add('padoka-staff-pending');
    if(targetNeedsRole)document.documentElement.classList.add('padoka-role-pending');
  }
  async function applyStaffRole(expectedUserId=''){
    const epoch=++staffValidationEpoch;
    try{
      const client=await waitForClient();
      if(!client)throw new Error('staff client unavailable');
      const session=await safeSession(client);
      if(!session)throw new Error('staff session unavailable');
      if(expectedUserId&&session.user.id!==expectedUserId)throw new Error('staff session changed');
      const {data:staff,error}=await client.from('padoka_staff_users').select('role,active').eq('user_id',session.user.id).maybeSingle();
      if(error||!staff?.active)throw new Error('staff permission unavailable');
      const latestSession=await safeSession(client);
      if(epoch!==staffValidationEpoch||latestSession?.user?.id!==session.user.id)return;
      const role=String(staff.role||'').toLowerCase();
      if(!await ensurePrivilegedMfa(client,role,session.user.id))return;
      validatedStaffUserId=session.user.id;
      window.padokaStaffRole=role;
      window.padokaCanAccess=id=>allowed(id,role);
      root.dataset.staffRole=role;
      root.querySelectorAll('[data-padoka-module]').forEach(link=>{
        link.hidden=!allowed(link.dataset.padokaModule,role);
      });
      if(!allowed(current,role)){
        location.replace('internal.html');
        return;
      }
      filterPageShortcuts(role);
      [250,750,1500].forEach(delay=>setTimeout(()=>filterPageShortcuts(role),delay));
      loadValidatedModuleScripts(role);
      document.documentElement.classList.remove('padoka-role-pending');
      document.documentElement.classList.remove('padoka-staff-pending');
    }catch(error){
      if(epoch!==staffValidationEpoch)return;
      clearResolvedStaff();
      console.warn('PADOKA internal permissions:',error);
      if(targetNeedsRole){
        location.replace('internal.html');
      }
    }
  }
  async function watchStaffAuth(){
    const client=await waitForClient();
    if(!client)return;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId===validatedStaffUserId&&event==='SIGNED_IN')return;
      staffValidationEpoch+=1;
      clearResolvedStaff();
      if(!nextUserId){
        location.replace('internal.html');
        return;
      }
      setTimeout(()=>applyStaffRole(nextUserId),0);
    });
  }
  watchStaffAuth();
  applyStaffRole();
})();