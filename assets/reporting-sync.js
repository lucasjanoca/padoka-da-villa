(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;
  const $=id=>document.getElementById(id),money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),num=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3}),esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  let sb=null,enabled=false,channel=null,refreshTimer=null,lifecycleEpoch=0,activeUserId='',authSubscription=null;
  const allowedRoles=new Set(['owner','manager']);
  const REPORT_TZ='America/Sao_Paulo';
  const today=()=>{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:REPORT_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const pick=type=>parts.find(part=>part.type===type)?.value||'';
    return `${pick('year')}-${pick('month')}-${pick('day')}`;
  };
  function missing(error){return ['42883','PGRST202','PGRST204','PGRST205'].includes(error?.code)||/could not find the function|does not exist|schema cache/i.test(String(error?.message||''))}
  function denied(error){return /permission|required|not allowed/i.test(String(error?.message||''))}
  function panel(){return document.querySelector('[data-panel="relatorios"]')}
  function ensureShell(){
    const p=panel();if(!p)return null;
    let shell=$('serverReport');if(shell)return shell;
    shell=document.createElement('section');shell.id='serverReport';shell.className='card';
    shell.innerHTML=`<div class="toolbar" style="align-items:end"><label style="font-size:9px;font-weight:900">De<input id="reportFrom" type="date" style="display:block;margin-top:4px;border:1px solid var(--line);border-radius:11px;padding:9px;background:#fff"></label><label style="font-size:9px;font-weight:900">Até<input id="reportTo" type="date" style="display:block;margin-top:4px;border:1px solid var(--line);border-radius:11px;padding:9px;background:#fff"></label><button class="btn" id="reportLoad" type="button">Atualizar relatório</button></div><div id="reportState" class="notice" style="margin-top:12px">Carregando relatório consolidado…</div><div id="reportBody"></div>`;
    p.prepend(shell);const d=today();$('reportFrom').value=d;$('reportTo').value=d;$('reportLoad').onclick=()=>load();return shell
  }
  function validRange(from,to){if(!from||!to||to<from)return 'Escolha um período válido.';const a=new Date(from+'T12:00:00'),b=new Date(to+'T12:00:00'),days=Math.round((b-a)/86400000);if(days>31)return 'O período máximo do relatório é de 31 dias.';return ''}
  function render(data){
    const state=$('reportState'),body=$('reportBody');if(!state||!body)return;
    state.className=data.has_provisional_data?'notice':'notice hidden';state.innerHTML=data.has_provisional_data?'<strong>Dados provisórios.</strong> Há pedidos ou vendas ligados ao catálogo ainda demonstrativo.':'';
    const s=data.sales||{},o=data.orders||{},l=data.losses||{},p=data.production||{},i=data.inventory||{},top=Array.isArray(data.top_products)?data.top_products:[];
    body.innerHTML=`<div class="stats" style="margin-top:12px"><div class="stat"><small>VENDAS CONCLUÍDAS</small><strong>${Number(s.count||0)}</strong><span style="font-size:9px;color:var(--muted)">${money(s.total)}</span></div><div class="stat"><small>PEDIDOS</small><strong>${Number(o.count||0)}</strong><span style="font-size:9px;color:var(--muted)">${Number(o.open||0)} em andamento • ${Number(o.ready||0)} prontos</span></div><div class="stat"><small>QTD. PERDIDA</small><strong>${num(l.quantity)}</strong><span style="font-size:9px;color:var(--muted)">${Number(l.count||0)} registros</span></div><div class="stat"><small>PRODUÇÃO</small><strong>${num(p.produced)}</strong><span style="font-size:9px;color:var(--muted)">${num(p.planned)} planejado</span></div></div><div class="stats" style="margin-top:10px"><div class="stat"><small>ESTOQUE BAIXO</small><strong>${Number(i.low_stock||0)}</strong></div><div class="stat"><small>ITENS COM SALDO</small><strong>${Number(i.with_stock||0)}</strong></div><div class="stat"><small>SEM CÓDIGO</small><strong>${Number(i.missing_barcode||0)}</strong></div><div class="stat"><small>PEDIDOS CANCELADOS</small><strong>${Number(o.cancelled||0)}</strong></div></div><h3 style="margin:18px 0 8px">Produtos mais vendidos</h3><div class="tablewrap"><table class="table"><thead><tr><th>Produto</th><th>Quantidade</th><th>Faturamento</th></tr></thead><tbody>${top.length?top.map(x=>`<tr><td>${esc(x.product_name||x.product_id)}</td><td>${num(x.quantity)}</td><td>${money(x.revenue)}</td></tr>`).join(''):'<tr><td colspan="3">Sem vendas concluídas no período.</td></tr>'}</tbody></table></div><p style="font-size:9px;color:var(--muted);margin:10px 0 0">Período: ${esc(data.from)} até ${esc(data.to)} • horário da padaria: São Paulo</p>`;
  }
  function clearReporting(removeUi=true){
    lifecycleEpoch+=1;enabled=false;clearTimeout(refreshTimer);refreshTimer=null;
    if(channel&&sb){try{sb.removeChannel(channel)}catch{}}channel=null;
    if(removeUi)$('serverReport')?.remove();
  }
  async function load(){
    const epoch=lifecycleEpoch,from=$('reportFrom')?.value||today(),to=$('reportTo')?.value||today(),problem=validRange(from,to),state=$('reportState'),btn=$('reportLoad');if(problem){if(state){state.className='notice';state.textContent=problem}return}
    if(!enabled||!sb)return;
    if(btn){btn.disabled=true;btn.textContent='Atualizando…'}
    const {data,error}=await sb.rpc('padoka_report_summary',{p_from:from,p_to:to});
    if(epoch!==lifecycleEpoch)return;
    if(btn){btn.disabled=false;btn.textContent='Atualizar relatório'}
    if(error){if(missing(error)){clearReporting();return}if(state){state.className='notice';state.textContent=denied(error)?'Relatórios consolidados financeiros são restritos à gerência.':'Não foi possível carregar o relatório agora.'}return}
    render(data||{});subscribe()
  }
  function schedule(){if(!enabled)return;clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{const to=$('reportTo')?.value;if(to===today())load()},350)}
  function subscribe(){if(channel||!enabled)return;channel=sb.channel('padoka-reporting-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_sales'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'padoka_orders'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'padoka_losses'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'padoka_inventory'},schedule).subscribe()}
  async function waitForRole(expectedUserId){
    for(let n=0;n<100;n++){
      const role=String(window.padokaStaffRole||'').toLowerCase();
      const pending=document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending');
      const {data:{session}}=await sb.auth.getSession();
      if(session?.user?.id!==expectedUserId)return '';
      if(!pending&&role)return role;
      await new Promise(r=>setTimeout(r,100));
    }
    return '';
  }
  async function activate(expectedUserId){
    const epoch=lifecycleEpoch;
    if(!expectedUserId||!sb)return;
    const role=await waitForRole(expectedUserId);
    if(epoch!==lifecycleEpoch)return;
    if(!allowedRoles.has(role))return;
    const {data:{session}}=await sb.auth.getSession();
    if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId)return;
    activeUserId=expectedUserId;enabled=true;ensureShell();await load();
  }
  function watchAuth(){
    const result=sb.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId===activeUserId&&event==='SIGNED_IN')return;
      activeUserId=nextUserId;clearReporting();
      if(nextUserId)setTimeout(()=>activate(nextUserId),0);
    });
    authSubscription=result?.data?.subscription||null;
  }
  async function start(){
    for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));
    sb=window.padokaSupabase;if(!sb)return;
    watchAuth();
    const {data:{session}}=await sb.auth.getSession();
    activeUserId=session?.user?.id||'';
    if(activeUserId)await activate(activeUserId);
  }
  window.addEventListener('pagehide',()=>{clearReporting(false);try{authSubscription?.unsubscribe()}catch{}},{once:true});
  start();
})();