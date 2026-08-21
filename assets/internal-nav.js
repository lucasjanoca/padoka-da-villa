(()=>{
  const root=document.getElementById('padokaInternalNav');
  if(!root)return;

  let current=root.dataset.current||'';
  const params=new URLSearchParams(location.search);
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  const isPdv=location.pathname.endsWith('/pdv.html')||location.pathname.endsWith('pdv.html');
  const isAdmin=location.pathname.endsWith('/internal.html')||location.pathname.endsWith('internal.html');
  if(isGestao)current=params.get('tab')||'produtos';

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
    ['gestao.html?tab=configuracoes','configuracoes','⚙','Configurações']
  ];

  const allowed=(id,role)=>{
    const roles=roleAccess[id];
    return !roles||!!role&&roles.includes(role);
  };
  const targetNeedsRole=Array.isArray(roleAccess[current]);

  if(targetNeedsRole){
    const style=document.createElement('style');
    style.id='padokaRoleGuardStyle';
    style.textContent='.padoka-role-pending #app{visibility:hidden!important}';
    document.head.appendChild(style);
    document.documentElement.classList.add('padoka-role-pending');
  }

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
    document.body.style.overflow=open?'hidden':'';
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

  async function waitForClient(){
    for(let i=0;i<80;i++){
      if(window.padokaSupabase)return window.padokaSupabase;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  }
  async function applyStaffRole(){
    try{
      const client=await waitForClient();
      if(!client)throw new Error('staff client unavailable');
      const {data:{session}}=await client.auth.getSession();
      if(!session)throw new Error('staff session unavailable');
      const {data:staff,error}=await client.from('padoka_staff_users').select('role,active').eq('user_id',session.user.id).maybeSingle();
      if(error||!staff?.active)throw new Error('staff permission unavailable');
      const role=String(staff.role||'').toLowerCase();
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
      document.documentElement.classList.remove('padoka-role-pending');
    }catch(error){
      console.warn('PADOKA internal permissions:',error);
      if(targetNeedsRole){
        location.replace('internal.html');
      }
    }
  }
  applyStaffRole();

  if(isAdmin&&!document.querySelector('script[data-padoka-admin-dashboard]')){
    const s=document.createElement('script');
    s.src='assets/admin-dashboard-live.js';
    s.defer=true;
    s.dataset.padokaAdminDashboard='1';
    document.head.appendChild(s);
  }
  if(isPdv&&!document.querySelector('script[data-padoka-pdv-idempotency]')){
    const s=document.createElement('script');
    s.src='assets/pdv-idempotency.js';
    s.defer=true;
    s.dataset.padokaPdvIdempotency='1';
    document.head.appendChild(s);
  }
  if(isPdv&&!document.querySelector('script[data-padoka-pdv-sale-void]')){
    const s=document.createElement('script');
    s.src='assets/pdv-sale-void.js';
    s.defer=true;
    s.dataset.padokaPdvSaleVoid='1';
    document.head.appendChild(s);
  }
  if(isGestao){
    if(!document.querySelector('script[data-padoka-ops]')){
      const s=document.createElement('script');
      s.src='assets/operational-sync.js';
      s.defer=true;
      s.dataset.padokaOps='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-production]')){
      const s=document.createElement('script');
      s.src='assets/production-completion.js';
      s.defer=true;
      s.dataset.padokaProduction='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-loss]')){
      const s=document.createElement('script');
      s.src='assets/loss-registration.js';
      s.defer=true;
      s.dataset.padokaLoss='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-reporting]')){
      const s=document.createElement('script');
      s.src='assets/reporting-sync.js';
      s.defer=true;
      s.dataset.padokaReporting='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-settings]')){
      const s=document.createElement('script');
      s.src='assets/settings-sync.js';
      s.defer=true;
      s.dataset.padokaSettings='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-staff-management]')){
      const s=document.createElement('script');
      s.src='assets/staff-management.js';
      s.defer=true;
      s.dataset.padokaStaffManagement='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-padoka-staff-audit]')){
      const s=document.createElement('script');
      s.src='assets/staff-audit.js';
      s.defer=true;
      s.dataset.padokaStaffAudit='1';
      document.head.appendChild(s);
    }
  }
})();