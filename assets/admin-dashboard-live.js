(()=>{
const TZ='America/Sao_Paulo';
const INVENTORY_ROLES=new Set(['owner','manager','stock']);
const PRODUCTION_ROLES=new Set(['owner','manager','production']);
let orderChannel=null,inventoryChannel=null,productionChannel=null,orderBusy=false,opsBusy=false,orderTimer=null,opsTimer=null,orderInterval=null,opsInterval=null,lifecycleEpoch=0,activeUserId='';
const get=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qty=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const labels={received:'Recebido',seen:'Visto',confirmed:'Confirmado',preparing:'Em preparo',ready:'Pronto',completed:'Concluído',cancelled:'Cancelado'};
const staffRole=()=>String(window.padokaStaffRole||'').toLowerCase();
const operationalAccess=()=>{const role=staffRole();return {inventory:INVENTORY_ROLES.has(role),production:PRODUCTION_ROLES.has(role)}};
const staffGuardPending=()=>document.documentElement.classList.contains('padoka-staff-pending');
const currentEpoch=()=>lifecycleEpoch;
const lifecycleCurrent=(epoch,userId=activeUserId)=>epoch===lifecycleEpoch&&!!userId&&userId===activeUserId&&!staffGuardPending();
async function safeSession(){
  try{
    const {data,error}=await window.padokaSupabase.auth.getSession();
    if(error){console.error('Falha ao confirmar sessão do dashboard PADOKA',error);return null}
    return data?.session||null;
  }catch(error){
    console.error('Falha de rede ao confirmar sessão do dashboard PADOKA',error);
    return null;
  }
}
async function sessionStillCurrent(epoch,userId){
  if(!lifecycleCurrent(epoch,userId))return false;
  const session=await safeSession();
  return lifecycleCurrent(epoch,userId)&&session?.user?.id===userId;
}
function dayKey(value=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const pick=t=>parts.find(p=>p.type===t)?.value||'';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}
function render(list){
  const active=list.filter(o=>!['completed','cancelled'].includes(o.status));
  const validValue=list.filter(o=>o.status!=='cancelled');
  if(get('sOrders'))get('sOrders').textContent=list.length;
  if(get('sPending'))get('sPending').textContent=active.length;
  if(get('sReady'))get('sReady').textContent=list.filter(o=>o.status==='ready').length;
  if(get('sSales')){
    get('sSales').textContent=money(validValue.reduce((sum,o)=>sum+Number(o.total||0),0));
    const label=get('sSales').closest('.stat')?.querySelector('small');
    if(label)label.textContent='VALOR EM PEDIDOS';
  }
  const recent=get('recent');
  if(recent)recent.innerHTML=list.slice(0,5).map(o=>`<div class="order"><div><strong>${esc(o.code)} • ${esc(o.pickup_name||'Cliente')}</strong><small>${money(o.total)}</small></div><span class="pill">${esc(labels[o.status]||o.status)}</span></div>`).join('')||'<p class="notice">Sem pedidos hoje.</p>';
}
function clearDashboardState(){
  lifecycleEpoch+=1;
  activeUserId='';
  orderBusy=false;
  opsBusy=false;
  clearTimeout(orderTimer);orderTimer=null;
  clearTimeout(opsTimer);opsTimer=null;
  clearInterval(orderInterval);orderInterval=null;
  clearInterval(opsInterval);opsInterval=null;
  const client=window.padokaSupabase;
  for(const channel of [orderChannel,inventoryChannel,productionChannel]){
    if(channel&&client?.removeChannel)client.removeChannel(channel).catch(()=>undefined);
  }
  orderChannel=null;inventoryChannel=null;productionChannel=null;
  get('adminOperationalHealth')?.remove();
  for(const id of ['sOrders','sPending','sReady','sSales']){if(get(id))get(id).textContent='—'}
  if(get('recent'))get('recent').replaceChildren();
}
function failClosedAndRetry(userId){
  if(!userId)return clearDashboardState();
  clearDashboardState();
  const epoch=currentEpoch();
  setTimeout(()=>init(userId,epoch),1200);
}
function missingOperationalLayer(error){
  const code=String(error?.code||'');
  const message=String(error?.message||'');
  return ['42P01','PGRST204','PGRST205'].includes(code)||/does not exist|schema cache|could not find the table/i.test(message);
}
function ensureOperationalPanel(access=operationalAccess()){
  let panel=get('adminOperationalHealth');
  if(!access.inventory&&!access.production){panel?.remove();return null}
  if(panel)return panel;
  const anchor=document.querySelector('#panelView .grid');
  if(!anchor)return null;
  if(!get('adminOperationalStyles')){
    const style=document.createElement('style');
    style.id='adminOperationalStyles';
    style.textContent='.ops-health{margin-top:14px}.ops-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.ops-head h3{margin:0}.ops-badge{font-size:8px;font-weight:950;padding:6px 8px;border-radius:999px;background:#e7f2eb;color:#275b3d}.ops-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.ops-stats.single{grid-template-columns:1fr}.ops-stat{background:#f8f4ef;border:1px solid var(--line);border-radius:14px;padding:11px}.ops-stat small{display:block;color:var(--muted);font-size:8px;font-weight:900}.ops-stat strong{display:block;font-size:22px;margin-top:4px}.ops-list{margin-top:10px}.ops-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line);font-size:9.5px}.ops-row span{color:var(--muted);text-align:right}.ops-links{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.ops-links a{background:var(--dark);color:#fff;border-radius:10px;padding:8px 10px;text-decoration:none;font-size:9px;font-weight:900}@media(max-width:520px){.ops-stats{grid-template-columns:1fr}.ops-head{align-items:flex-start;flex-direction:column}}';
    document.head.appendChild(style);
  }
  const statBlocks=[access.inventory?'<div class="ops-stat"><small>ESTOQUE BAIXO</small><strong id="adminLowStockCount">0</strong></div>':'',access.production?'<div class="ops-stat"><small>PRODUÇÃO PENDENTE HOJE</small><strong id="adminProductionPendingCount">0</strong></div>':''].join('');
  const links=[access.inventory?'<a href="gestao.html?tab=estoque">Abrir estoque</a>':'',access.production?'<a href="gestao.html?tab=producao">Abrir produção</a>':''].join('');
  panel=document.createElement('section');
  panel.id='adminOperationalHealth';
  panel.className='card ops-health';
  panel.innerHTML=`<div class="ops-head"><div><h3>Alertas operacionais</h3><div class="notice" style="margin-top:5px;padding:0;border:0;background:transparent">Somente módulos permitidos para o seu perfil são consultados e exibidos.</div></div><span class="ops-badge">ATUALIZAÇÃO EM TEMPO REAL</span></div><div class="ops-stats ${access.inventory&&access.production?'':'single'}">${statBlocks}</div>${access.inventory?'<div class="ops-list" id="adminLowStockList"></div>':''}<div class="ops-links">${links}</div>`;
  anchor.insertAdjacentElement('afterend',panel);
  return panel;
}
function renderOperational(inventory,plans,access=operationalAccess()){
  const panel=ensureOperationalPanel(access);
  if(!panel)return;
  if(access.inventory){
    const low=(inventory||[]).filter(row=>Number(row.min_quantity||0)>0&&Number(row.quantity||0)<=Number(row.min_quantity||0));
    if(get('adminLowStockCount'))get('adminLowStockCount').textContent=low.length;
    const list=get('adminLowStockList');
    if(list)list.innerHTML=low.length?low.slice(0,5).map(row=>{const name=row.padoka_products?.name||row.product_id;return `<div class="ops-row"><strong>${esc(name)}</strong><span>${qty(row.quantity)} / mínimo ${qty(row.min_quantity)}</span></div>`}).join(''):'<div class="notice" style="margin-top:10px">Nenhum item abaixo do estoque mínimo.</div>';
  }
  if(access.production){
    const pending=(plans||[]).filter(row=>row.plan_date===dayKey()&&!['completed','cancelled'].includes(row.status)&&Number(row.produced_quantity||0)<Number(row.planned_quantity||0));
    if(get('adminProductionPendingCount'))get('adminProductionPendingCount').textContent=pending.length;
  }
}
async function refreshOrders(epoch=currentEpoch(),userId=activeUserId){
  if(orderBusy||!window.padokaSupabase||get('panelView')?.classList.contains('hidden')||!lifecycleCurrent(epoch,userId))return;
  if(!await sessionStillCurrent(epoch,userId)){if(epoch===lifecycleEpoch)failClosedAndRetry(userId);return}
  orderBusy=true;
  try{
    const since=new Date(Date.now()-36*60*60*1000).toISOString();
    const {data,error}=await window.padokaSupabase.from('padoka_orders').select('code,status,pickup_name,total,created_at').gte('created_at',since).order('created_at',{ascending:false});
    if(error)throw error;
    if(!lifecycleCurrent(epoch,userId))return;
    const today=dayKey();
    render((data||[]).filter(o=>o.created_at&&dayKey(new Date(o.created_at))===today));
  }catch(e){if(lifecycleCurrent(epoch,userId))console.error('Falha ao atualizar visão geral PADOKA',e)}finally{if(epoch===lifecycleEpoch)orderBusy=false}
}
async function refreshOperational(epoch=currentEpoch(),userId=activeUserId){
  if(opsBusy||!window.padokaSupabase||get('panelView')?.classList.contains('hidden')||!lifecycleCurrent(epoch,userId))return false;
  if(!await sessionStillCurrent(epoch,userId)){if(epoch===lifecycleEpoch)failClosedAndRetry(userId);return false}
  const access=operationalAccess();
  if(!access.inventory&&!access.production){get('adminOperationalHealth')?.remove();return false}
  opsBusy=true;
  try{
    const today=dayKey();
    let inventory=[],plans=[];
    if(access.inventory){
      const result=await window.padokaSupabase.from('padoka_inventory').select('product_id,quantity,min_quantity,padoka_products(name)').order('quantity',{ascending:true});
      if(result.error){if(missingOperationalLayer(result.error)){get('adminOperationalHealth')?.remove();return false}throw result.error}
      if(!lifecycleCurrent(epoch,userId))return false;
      inventory=result.data||[];
    }
    if(access.production){
      const result=await window.padokaSupabase.from('padoka_production_plans').select('id,plan_date,status,planned_quantity,produced_quantity').eq('plan_date',today);
      if(result.error){if(missingOperationalLayer(result.error)){get('adminOperationalHealth')?.remove();return false}throw result.error}
      if(!lifecycleCurrent(epoch,userId))return false;
      plans=result.data||[];
    }
    if(!lifecycleCurrent(epoch,userId))return false;
    renderOperational(inventory,plans,access);
    return true;
  }catch(e){if(lifecycleCurrent(epoch,userId))console.error('Falha ao atualizar alertas operacionais PADOKA',e);return false}finally{if(epoch===lifecycleEpoch)opsBusy=false}
}
function scheduleOrders(){const epoch=currentEpoch(),userId=activeUserId;clearTimeout(orderTimer);orderTimer=setTimeout(()=>refreshOrders(epoch,userId),180)}
function scheduleOperational(){const epoch=currentEpoch(),userId=activeUserId;clearTimeout(opsTimer);opsTimer=setTimeout(()=>refreshOperational(epoch,userId),180)}
function enableOperationalRealtime(epoch=currentEpoch(),userId=activeUserId){
  if(!lifecycleCurrent(epoch,userId))return;
  const access=operationalAccess();
  if(access.inventory&&!inventoryChannel)inventoryChannel=window.padokaSupabase.channel('padoka-admin-inventory-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_inventory'},scheduleOperational).subscribe();
  if(access.production&&!productionChannel)productionChannel=window.padokaSupabase.channel('padoka-admin-production-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},scheduleOperational).subscribe();
}
async function waitForValidatedStaff(expectedUserId='',expectedEpoch=currentEpoch()){
  for(let i=0;i<80;i++){
    if(expectedEpoch!==lifecycleEpoch)return '';
    if(!staffGuardPending()&&window.padokaStaffRole){
      const session=await safeSession();
      if(expectedEpoch!==lifecycleEpoch)return '';
      if(session?.user?.id&&(!expectedUserId||session.user.id===expectedUserId))return session.user.id;
      return '';
    }
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  return '';
}
async function init(expectedUserId='',expectedEpoch=currentEpoch()){
  if(expectedEpoch!==lifecycleEpoch)return;
  if(!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return setTimeout(()=>init(expectedUserId,expectedEpoch),180);
  const userId=await waitForValidatedStaff(expectedUserId,expectedEpoch);
  if(expectedEpoch!==lifecycleEpoch||!userId)return;
  if(expectedUserId&&userId!==expectedUserId)return;
  activeUserId=userId;
  const epoch=expectedEpoch;
  await refreshOrders(epoch,userId);
  if(!lifecycleCurrent(epoch,userId))return;
  const operationalReady=await refreshOperational(epoch,userId);
  if(!lifecycleCurrent(epoch,userId))return;
  if(!orderChannel)orderChannel=window.padokaSupabase.channel('padoka-admin-dashboard-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_orders'},scheduleOrders).subscribe();
  if(operationalReady)enableOperationalRealtime(epoch,userId);
  clearInterval(orderInterval);orderInterval=setInterval(()=>refreshOrders(epoch,userId),60000);
  clearInterval(opsInterval);opsInterval=setInterval(async()=>{if(await refreshOperational(epoch,userId))enableOperationalRealtime(epoch,userId)},60000);
}
async function watchAuth(){
  for(let i=0;i<80&&!window.padokaSupabase;i++)await new Promise(resolve=>setTimeout(resolve,100));
  const client=window.padokaSupabase;
  if(!client)return;
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
    const nextUserId=session?.user?.id||'';
    if(nextUserId===activeUserId&&event==='SIGNED_IN')return;
    clearDashboardState();
    const epoch=currentEpoch();
    if(nextUserId)setTimeout(()=>init(nextUserId,epoch),0);
  });
}
window.addEventListener('pagehide',clearDashboardState,{once:true});
watchAuth();
setTimeout(()=>init('',currentEpoch()),0);
})();