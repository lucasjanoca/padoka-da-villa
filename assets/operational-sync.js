(()=>{
  if(!(location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html')))return;
  const $=id=>document.getElementById(id), catalog=window.PADOKA_CATALOG||[];
  const productById=id=>catalog.find(p=>p.id===id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const ADJUST_KEY_PREFIX='padoka_pending_inventory_adjustment_v2:', LEGACY_ADJUST_KEY='padoka_pending_inventory_adjustment_v1', PADOKA_TIME_ZONE='America/Sao_Paulo';
  let sb,inventory=[],plans=[],losses=[],channel=null,active=false,lifecycleEpoch=0,activeUserId='',authSubscription=null;
  const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:PADOKA_TIME_ZONE});
  const pendingAdjustmentKey=(userId=activeUserId)=>userId?`${ADJUST_KEY_PREFIX}${userId}`:'';
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaOpsToast);window.__padokaOpsToast=setTimeout(()=>el.classList.add('hidden'),2600)}
  function relationMissing(error){return ['42P01','PGRST205','PGRST204'].includes(error?.code)||/does not exist|schema cache/i.test(error?.message||'')}
  function readPendingAdjustment(userId=activeUserId){const key=pendingAdjustmentKey(userId);if(!key)return null;try{const raw=sessionStorage.getItem(key);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed?.user_id!==userId||!parsed?.request_id||!parsed?.product_id||!Number.isFinite(Number(parsed.delta))||!Number.isFinite(Number(parsed.target_quantity)))throw new Error('invalid');return parsed}catch{sessionStorage.removeItem(key);return null}}
  function writePendingAdjustment(value,userId=activeUserId){const key=pendingAdjustmentKey(userId);if(!key||!value)return false;sessionStorage.setItem(key,JSON.stringify({...value,user_id:userId}));return true}
  function clearPendingAdjustment(requestId,userId=activeUserId){const key=pendingAdjustmentKey(userId);if(!key)return;const pending=readPendingAdjustment(userId);if(!pending||!requestId||pending.request_id===requestId)sessionStorage.removeItem(key)}
  function ambiguousAdjustmentError(error){return !error?.code||error.code==='23505'||/fetch|network|timeout|connection|abort/i.test(error?.message||'')}
  function lockOperationalUi(message){
    active=false;
    const notice=`<div class="notice">${esc(message)}</div>`;
    if($('stockTable'))$('stockTable').innerHTML=notice;
    if($('productionTable'))$('productionTable').innerHTML=notice;
    if($('lossList'))$('lossList').innerHTML=notice;
    const report=$('opsReportDetails');if(report)report.innerHTML=notice;
    document.querySelectorAll('[data-panel="perdas"] input,[data-panel="perdas"] select,[data-panel="perdas"] button').forEach(el=>el.disabled=true);
    for(const id of ['stockProducts','stockCodes','stockLow','stockPending','rWeight','rLoss','rCodes'])if($(id))$(id).textContent='—';
    const badge=$('staffBadge');if(badge&&!badge.textContent.includes('SERVIDOR'))badge.textContent+=' • SERVIDOR PENDENTE';
  }
  function clearOperationalState(message='Validando novamente o acesso interno…'){
    lifecycleEpoch+=1;active=false;inventory=[];plans=[];losses=[];
    if(channel&&sb){try{sb.removeChannel(channel)}catch{}}channel=null;
    lockOperationalUi(message);
  }
  function showUnavailable(){
    lockOperationalUi('Dados operacionais do servidor indisponíveis. Estoque, produção e perdas ficam bloqueados para evitar salvar informações apenas neste navegador.');
    const badge=$('staffBadge');if(badge)badge.textContent=badge.textContent.replace('SERVIDOR PENDENTE','SERVIDOR INDISPONÍVEL');
  }
  function unlockLossForm(){document.querySelectorAll('[data-panel="perdas"] input,[data-panel="perdas"] select,[data-panel="perdas"] button').forEach(el=>el.disabled=false)}
  async function safeSession(){
    try{
      const {data,error}=await sb.auth.getSession();
      if(error){console.error('Falha ao confirmar sessão operacional PADOKA',error);return null}
      return data?.session||null;
    }catch(error){
      console.error('Falha de rede ao confirmar sessão operacional PADOKA',error);
      return null;
    }
  }
  async function sessionStillMatches(expectedUserId,epoch=lifecycleEpoch){
    if(epoch!==lifecycleEpoch||!expectedUserId)return false;
    const session=await safeSession();
    return epoch===lifecycleEpoch&&session?.user?.id===expectedUserId;
  }
  async function waitForStaffGuard(expectedUserId){
    for(let n=0;n<100;n++){
      const pending=document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending');
      const role=String(window.padokaStaffRole||'').toLowerCase();
      const session=await safeSession();
      if(session?.user?.id!==expectedUserId)return false;
      if(!pending&&role)return true;
      await new Promise(r=>setTimeout(r,100));
    }
    return false;
  }
  async function reconcilePendingAdjustment(epoch=lifecycleEpoch,expectedUserId=activeUserId){
    const pending=readPendingAdjustment(expectedUserId);if(!pending)return true;
    if(!await sessionStillMatches(expectedUserId,epoch))return false;
    const {error}=await sb.rpc('padoka_adjust_inventory_once',{p_product_id:pending.product_id,p_delta:Number(pending.delta),p_reason:pending.reason||'Ajuste pela gestão',p_request_id:pending.request_id});
    if(!await sessionStillMatches(expectedUserId,epoch))return false;
    if(!error){clearPendingAdjustment(pending.request_id,expectedUserId);return true}
    if(!ambiguousAdjustmentError(error)){clearPendingAdjustment(pending.request_id,expectedUserId);toast(error.message?.includes('permission')?'Sem permissão para reconciliar o ajuste de estoque.':'O ajuste pendente foi rejeitado pelo servidor.');return true}
    toast('Ainda há um ajuste de estoque com resposta incerta. A mesma operação será reutilizada na próxima tentativa.');
    return false;
  }
  async function loadAll(epoch=lifecycleEpoch,expectedUserId=activeUserId){
    if(!await sessionStillMatches(expectedUserId,epoch))return false;
    const [i,p,l]=await Promise.all([
      sb.from('padoka_inventory').select('product_id,barcode,quantity,min_quantity,updated_at').order('product_id'),
      sb.from('padoka_production_plans').select('id,plan_date,product_id,planned_quantity,produced_quantity,status,note,updated_at').eq('plan_date',today()).order('product_id'),
      sb.from('padoka_losses').select('id,product_id,quantity,reason,note,created_at').order('created_at',{ascending:false}).limit(100)
    ]);
    if(!await sessionStillMatches(expectedUserId,epoch))return false;
    if(i.error){if(relationMissing(i.error))return false;throw i.error}
    if(p.error){if(relationMissing(p.error))return false;throw p.error}
    if(l.error){if(relationMissing(l.error))return false;throw l.error}
    inventory=i.data||[];plans=p.data||[];losses=l.data||[];active=true;unlockLossForm();render();return true;
  }
  function render(){if(!active)return;renderStock();renderProduction();renderLosses();renderReports();const badge=$('staffBadge');if(badge){badge.textContent=badge.textContent.replace(/ • SERVIDOR (?:PENDENTE|INDISPONÍVEL)/g,'');if(!badge.textContent.includes('SINCRONIZADO'))badge.textContent+=' • SINCRONIZADO'}}
  function renderStock(){
    const host=$('stockTable');if(!host)return;
    const inv=Object.fromEntries(inventory.map(x=>[x.product_id,x]));
    const pending=readPendingAdjustment(activeUserId);
    const rows=catalog.map(p=>{const s=inv[p.id]||{quantity:0,min_quantity:0,barcode:''},quantity=pending?.product_id===p.id?Number(pending.target_quantity):Number(s.quantity||0);return `<tr><td><strong>${esc(p.name)}</strong><br><small>${esc(p.id)}</small></td><td>${esc(p.unit)}</td><td><input data-srv-code="${esc(p.id)}" value="${esc(s.barcode||'')}" placeholder="Bipe o EAN"></td><td><input data-srv-qty="${esc(p.id)}" type="number" step="0.001" min="0" value="${quantity}"></td><td><input data-srv-min="${esc(p.id)}" type="number" step="0.001" min="0" value="${Number(s.min_quantity||0)}"></td><td><span class="status ${s.barcode?'ok':''}">${s.barcode?'Cadastrado':'Pendente'}</span></td></tr>`}).join('');
    host.innerHTML=`<table class="table"><thead><tr><th>Produto</th><th>Unidade</th><th>Código/EAN</th><th>Saldo</th><th>Mínimo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.querySelectorAll('[data-srv-code]').forEach(i=>i.onchange=()=>saveMeta(i.dataset.srvCode,{barcode:i.value.trim()||null}));
    document.querySelectorAll('[data-srv-min]').forEach(i=>i.onchange=()=>saveMeta(i.dataset.srvMin,{min_quantity:Math.max(0,Number(i.value||0))}));
    document.querySelectorAll('[data-srv-qty]').forEach(i=>{i.onchange=()=>adjustQty(i);i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();adjustQty(i)}}});
    if($('stockProducts'))$('stockProducts').textContent=catalog.length;
    if($('stockCodes'))$('stockCodes').textContent=inventory.filter(x=>x.barcode).length;
    if($('stockLow'))$('stockLow').textContent=inventory.filter(x=>Number(x.min_quantity)>0&&Number(x.quantity)<=Number(x.min_quantity)).length;
    if($('stockPending'))$('stockPending').textContent=catalog.filter(p=>!inv[p.id]?.barcode).length;
  }
  async function saveMeta(id,patch){
    if(!active||!activeUserId)return;
    const epoch=lifecycleEpoch,userId=activeUserId,current=inventory.find(x=>x.product_id===id)||{};
    const barcode=Object.prototype.hasOwnProperty.call(patch,'barcode')?patch.barcode:(current.barcode||null);
    const minQuantity=Object.prototype.hasOwnProperty.call(patch,'min_quantity')?Math.max(0,Number(patch.min_quantity||0)):Math.max(0,Number(current.min_quantity||0));
    if(!await sessionStillMatches(userId,epoch))return;
    let error=null;
    try{
      const result=await sb.rpc('padoka_update_inventory_metadata',{p_product_id:id,p_barcode:barcode,p_min_quantity:minQuantity});
      error=result?.error||null;
    }catch(requestError){
      error=requestError instanceof Error?requestError:new Error('inventory metadata network failure');
    }
    if(!await sessionStillMatches(userId,epoch))return;
    if(error){toast(error.message?.includes('permission')?'Sem permissão para alterar o estoque.':!error.code?'Falha de conexão ao salvar o estoque. Confira a rede e tente novamente.':'Não foi possível salvar os dados do estoque.');try{await loadAll(epoch,userId)}catch{if(epoch===lifecycleEpoch&&activeUserId===userId)showUnavailable()}return}
    toast('Estoque atualizado');try{await loadAll(epoch,userId)}catch{if(epoch===lifecycleEpoch&&activeUserId===userId)showUnavailable()}
  }
  async function adjustQty(input){
    if(!active||!activeUserId)return;
    const epoch=lifecycleEpoch,userId=activeUserId,id=input.dataset.srvQty,current=Number(inventory.find(x=>x.product_id===id)?.quantity||0),next=Math.max(0,Number(input.value||0)),delta=Number((next-current).toFixed(3)),existing=readPendingAdjustment(userId);
    if(existing&&(existing.product_id!==id||Number(existing.target_quantity)!==next)){
      if(existing.product_id===id)input.value=existing.target_quantity;
      toast('Existe um ajuste de estoque pendente. Confirme a mesma tentativa antes de iniciar outro ajuste.');
      return;
    }
    if(!delta&&!existing)return;
    if(!await sessionStillMatches(userId,epoch))return;
    const pending=existing||{product_id:id,target_quantity:next,delta,reason:'Ajuste pela gestão',request_id:crypto.randomUUID()};
    if(!existing&&!writePendingAdjustment(pending,userId))return;
    input.disabled=true;
    let error=null;
    try{
      const result=await sb.rpc('padoka_adjust_inventory_once',{p_product_id:pending.product_id,p_delta:Number(pending.delta),p_reason:pending.reason,p_request_id:pending.request_id});
      error=result?.error||null;
    }catch(requestError){
      error=requestError instanceof Error?requestError:new Error('inventory adjustment network failure');
    }
    if(!await sessionStillMatches(userId,epoch))return;
    input.disabled=false;
    if(error){
      const ambiguous=ambiguousAdjustmentError(error);
      if(!ambiguous)clearPendingAdjustment(pending.request_id,userId);
      toast(ambiguous?'Resposta incerta do servidor. Pressione Enter para repetir a mesma operação com segurança.':error.message?.includes('permission')?'Sem permissão para ajustar estoque.':error.message?.includes('insufficient')?'Saldo insuficiente para esse ajuste.':'Não foi possível ajustar o estoque.');
      if(!ambiguous)await loadAll(epoch,userId);
      return;
    }
    clearPendingAdjustment(pending.request_id,userId);toast('Saldo atualizado');await loadAll(epoch,userId)
  }
  function renderProduction(){
    const host=$('productionTable');if(!host)return;const map=Object.fromEntries(plans.map(x=>[x.product_id,x]));
    const eligible=catalog.filter(p=>['Pães','Salgados','Doces','paes','salgados','doces'].includes(p.category));
    host.innerHTML=`<table class="table"><thead><tr><th>Produto</th><th>Unidade</th><th>Planejado hoje</th><th>Produzido</th><th>Status</th></tr></thead><tbody>${eligible.map(p=>{const x=map[p.id]||{};return `<tr><td>${esc(p.name)}</td><td>${esc(p.unit)}</td><td><input data-plan="${esc(p.id)}" type="number" min="0" step="0.001" value="${Number(x.planned_quantity||0)}"></td><td>${Number(x.produced_quantity||0)}</td><td><span class="status ${x.status==='completed'?'ok':''}">${esc(x.status==='in_progress'?'Em produção':x.status==='completed'?'Concluído':x.status==='cancelled'?'Cancelado':'Planejado')}</span></td></tr>`}).join('')}</tbody></table>`;
    document.querySelectorAll('[data-plan]').forEach(i=>i.onchange=()=>savePlan(i));
  }
  async function savePlan(input){
    if(!active||!activeUserId)return;
    const epoch=lifecycleEpoch,userId=activeUserId,quantity=Math.max(0,Number(input.value||0));
    if(!await sessionStillMatches(userId,epoch))return;
    input.disabled=true;
    let error=null;
    try{
      const result=await sb.rpc('padoka_upsert_production_plan',{p_plan_date:today(),p_product_id:input.dataset.plan,p_planned_quantity:quantity,p_note:null});
      error=result?.error||null;
    }catch(requestError){
      error=requestError instanceof Error?requestError:new Error('production planning network failure');
    }
    if(!await sessionStillMatches(userId,epoch))return;
    input.disabled=false;
    if(error){toast(error.message?.includes('permission')?'Sem permissão para planejar produção.':!error.code?'Falha de conexão ao salvar o planejamento. Confira a rede e tente novamente.':'Não foi possível salvar o planejamento.');try{await loadAll(epoch,userId)}catch{if(epoch===lifecycleEpoch&&activeUserId===userId)showUnavailable()}return}
    toast('Planejamento atualizado');try{await loadAll(epoch,userId)}catch{if(epoch===lifecycleEpoch&&activeUserId===userId)showUnavailable()}
  }
  function renderLosses(){
    const select=$('lossProduct');if(select)select.innerHTML=catalog.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const host=$('lossList');if(host)host.innerHTML=losses.length?losses.map(x=>{const p=productById(x.product_id);return `<div class="notice"><strong>${esc(p?.name||x.product_id)}</strong> • ${Number(x.quantity||0)} • ${esc(x.reason)}<br>${esc(x.note||'')}<br><small>${new Date(x.created_at).toLocaleString('pt-BR')}</small></div>`}).join(''):'<div class="notice">Nenhuma perda registrada.</div>';
  }
  function setReportLabel(id,label){const el=$(id);const small=el?.parentElement?.querySelector('small');if(small)small.textContent=label}
  function renderReports(){
    const low=inventory.filter(x=>Number(x.min_quantity)>0&&Number(x.quantity)<=Number(x.min_quantity));
    const lossQty=losses.reduce((sum,x)=>sum+Number(x.quantity||0),0);
    const planned=plans.reduce((sum,x)=>sum+Number(x.planned_quantity||0),0);
    const produced=plans.reduce((sum,x)=>sum+Number(x.produced_quantity||0),0);
    if($('rProducts'))$('rProducts').textContent=catalog.length;
    if($('rWeight'))$('rWeight').textContent=low.length;
    if($('rLoss'))$('rLoss').textContent=Number(lossQty.toFixed(3));
    if($('rCodes'))$('rCodes').textContent=inventory.filter(x=>x.barcode).length;
    setReportLabel('rProducts','CATÁLOGO');setReportLabel('rWeight','ESTOQUE BAIXO');setReportLabel('rLoss','QTD. PERDIDA');setReportLabel('rCodes','COM CÓDIGO');
    const panel=document.querySelector('[data-panel="relatorios"]');if(!panel)return;
    let host=$('opsReportDetails');if(!host){host=document.createElement('div');host.id='opsReportDetails';host.className='card';panel.appendChild(host)}
    const invMap=Object.fromEntries(inventory.map(x=>[x.product_id,x]));
    const lowRows=low.map(x=>`<tr><td>${esc(productById(x.product_id)?.name||x.product_id)}</td><td>${Number(x.quantity||0)}</td><td>${Number(x.min_quantity||0)}</td></tr>`).join('');
    const recentLoss=losses.slice(0,8).map(x=>`<tr><td>${esc(productById(x.product_id)?.name||x.product_id)}</td><td>${Number(x.quantity||0)}</td><td>${esc(x.reason)}</td><td>${new Date(x.created_at).toLocaleDateString('pt-BR')}</td></tr>`).join('');
    host.innerHTML=`<h3 style="margin-top:0">Resumo operacional de hoje</h3><div class="stats" style="margin-bottom:12px"><div class="stat"><small>PRODUÇÃO PLANEJADA</small><strong>${Number(planned.toFixed(3))}</strong></div><div class="stat"><small>PRODUZIDO</small><strong>${Number(produced.toFixed(3))}</strong></div><div class="stat"><small>ITENS COM SALDO</small><strong>${inventory.filter(x=>Number(x.quantity)>0).length}</strong></div><div class="stat"><small>SEM CÓDIGO</small><strong>${catalog.filter(p=>!invMap[p.id]?.barcode).length}</strong></div></div><h3>Estoque que pede atenção</h3><div class="tablewrap"><table class="table"><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th></tr></thead><tbody>${lowRows||'<tr><td colspan="3">Nenhum item abaixo do mínimo.</td></tr>'}</tbody></table></div><h3 style="margin-top:18px">Perdas recentes</h3><div class="tablewrap"><table class="table"><thead><tr><th>Produto</th><th>Quantidade</th><th>Motivo</th><th>Data</th></tr></thead><tbody>${recentLoss||'<tr><td colspan="4">Nenhuma perda registrada.</td></tr>'}</tbody></table></div>`;
  }
  function scheduleLoad(){if(!active||!activeUserId)return;const epoch=lifecycleEpoch,userId=activeUserId;setTimeout(()=>{if(epoch===lifecycleEpoch&&activeUserId===userId)loadAll(epoch,userId).catch(e=>{if(epoch===lifecycleEpoch)console.error('PADOKA operational realtime:',e)})},80)}
  function subscribe(){if(channel||!active)return;channel=sb.channel('padoka-operational-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_inventory'},scheduleLoad).on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},scheduleLoad).on('postgres_changes',{event:'*',schema:'public',table:'padoka_losses'},scheduleLoad).subscribe()}
  async function activate(expectedUserId){
    const epoch=lifecycleEpoch;if(!expectedUserId||!sb)return;
    if(!await waitForStaffGuard(expectedUserId)||epoch!==lifecycleEpoch)return;
    if(!await sessionStillMatches(expectedUserId,epoch))return;
    activeUserId=expectedUserId;
    lockOperationalUi('Carregando dados operacionais seguros do servidor…');
    try{await reconcilePendingAdjustment(epoch,expectedUserId);if(epoch!==lifecycleEpoch)return;if(await loadAll(epoch,expectedUserId))subscribe();else if(epoch===lifecycleEpoch)showUnavailable()}catch(e){if(epoch===lifecycleEpoch){console.error('PADOKA operational sync:',e);showUnavailable()}}
  }
  function watchAuth(){
    const result=sb.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId===activeUserId&&event==='SIGNED_IN')return;
      activeUserId=nextUserId;clearOperationalState('Validando novamente o acesso interno…');
      if(nextUserId)setTimeout(()=>activate(nextUserId),0);
    });
    authSubscription=result?.data?.subscription||null;
  }
  async function start(){
    for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));
    sb=window.padokaSupabase;if(!sb)return;
    sessionStorage.removeItem(LEGACY_ADJUST_KEY);
    watchAuth();
    const session=await safeSession();activeUserId=session?.user?.id||'';
    if(activeUserId)await activate(activeUserId);else clearOperationalState('Entre com uma conta interna autorizada para acessar os dados operacionais.');
  }
  window.addEventListener('padoka:catalog-updated',()=>{if(active)render()});
  window.addEventListener('pagehide',()=>{clearOperationalState('Encerrando sessão operacional…');try{authSubscription?.unsubscribe()}catch{}},{once:true});
  start().catch(error=>{console.error('Falha ao iniciar sincronização operacional PADOKA',error);clearOperationalState('Não foi possível confirmar a sessão interna. Tente novamente quando a conexão estiver estável.')});
})();