(()=>{
const TZ='America/Sao_Paulo';
let orderChannel=null,inventoryChannel=null,productionChannel=null,orderBusy=false,opsBusy=false,orderTimer=null,opsTimer=null;
const get=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qty=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const labels={received:'Recebido',seen:'Visto',confirmed:'Confirmado',preparing:'Em preparo',ready:'Pronto',completed:'Concluído',cancelled:'Cancelado'};
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
function missingOperationalLayer(error){
  const code=String(error?.code||'');
  const message=String(error?.message||'');
  return ['42P01','PGRST204','PGRST205'].includes(code)||/does not exist|schema cache|could not find the table/i.test(message);
}
function ensureOperationalPanel(){
  let panel=get('adminOperationalHealth');
  if(panel)return panel;
  const anchor=document.querySelector('#panelView .grid');
  if(!anchor)return null;
  if(!get('adminOperationalStyles')){
    const style=document.createElement('style');
    style.id='adminOperationalStyles';
    style.textContent='.ops-health{margin-top:14px}.ops-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.ops-head h3{margin:0}.ops-badge{font-size:8px;font-weight:950;padding:6px 8px;border-radius:999px;background:#e7f2eb;color:#275b3d}.ops-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.ops-stat{background:#f8f4ef;border:1px solid var(--line);border-radius:14px;padding:11px}.ops-stat small{display:block;color:var(--muted);font-size:8px;font-weight:900}.ops-stat strong{display:block;font-size:22px;margin-top:4px}.ops-list{margin-top:10px}.ops-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line);font-size:9.5px}.ops-row span{color:var(--muted);text-align:right}.ops-links{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.ops-links a{background:var(--dark);color:#fff;border-radius:10px;padding:8px 10px;text-decoration:none;font-size:9px;font-weight:900}@media(max-width:520px){.ops-stats{grid-template-columns:1fr}.ops-head{align-items:flex-start;flex-direction:column}}';
    document.head.appendChild(style);
  }
  panel=document.createElement('section');
  panel.id='adminOperationalHealth';
  panel.className='card ops-health';
  panel.innerHTML='<div class="ops-head"><div><h3>Alertas operacionais</h3><div class="notice" style="margin-top:5px;padding:0;border:0;background:transparent">Dados sincronizados do estoque e da produção.</div></div><span class="ops-badge">ATUALIZAÇÃO EM TEMPO REAL</span></div><div class="ops-stats"><div class="ops-stat"><small>ESTOQUE BAIXO</small><strong id="adminLowStockCount">0</strong></div><div class="ops-stat"><small>PRODUÇÃO PENDENTE HOJE</small><strong id="adminProductionPendingCount">0</strong></div></div><div class="ops-list" id="adminLowStockList"></div><div class="ops-links"><a href="gestao.html?tab=estoque">Abrir estoque</a><a href="gestao.html?tab=producao">Abrir produção</a></div>';
  anchor.insertAdjacentElement('afterend',panel);
  return panel;
}
function renderOperational(inventory,plans){
  const panel=ensureOperationalPanel();
  if(!panel)return;
  const low=(inventory||[]).filter(row=>Number(row.min_quantity||0)>0&&Number(row.quantity||0)<=Number(row.min_quantity||0));
  const pending=(plans||[]).filter(row=>row.plan_date===dayKey()&&!['completed','cancelled'].includes(row.status)&&Number(row.produced_quantity||0)<Number(row.planned_quantity||0));
  get('adminLowStockCount').textContent=low.length;
  get('adminProductionPendingCount').textContent=pending.length;
  const list=get('adminLowStockList');
  if(list)list.innerHTML=low.length?low.slice(0,5).map(row=>{const name=row.padoka_products?.name||row.product_id;return `<div class="ops-row"><strong>${esc(name)}</strong><span>${qty(row.quantity)} / mínimo ${qty(row.min_quantity)}</span></div>`}).join(''):'<div class="notice" style="margin-top:10px">Nenhum item abaixo do estoque mínimo.</div>';
}
async function refreshOrders(){
  if(orderBusy||!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return;
  orderBusy=true;
  try{
    const since=new Date(Date.now()-36*60*60*1000).toISOString();
    const {data,error}=await window.padokaSupabase.from('padoka_orders').select('code,status,pickup_name,total,created_at').gte('created_at',since).order('created_at',{ascending:false});
    if(error)throw error;
    const today=dayKey();
    render((data||[]).filter(o=>o.created_at&&dayKey(new Date(o.created_at))===today));
  }catch(e){console.error('Falha ao atualizar visão geral PADOKA',e)}finally{orderBusy=false}
}
async function refreshOperational(){
  if(opsBusy||!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return false;
  opsBusy=true;
  try{
    const today=dayKey();
    const [inventoryResult,productionResult]=await Promise.all([
      window.padokaSupabase.from('padoka_inventory').select('product_id,quantity,min_quantity,padoka_products(name)').order('quantity',{ascending:true}),
      window.padokaSupabase.from('padoka_production_plans').select('id,plan_date,status,planned_quantity,produced_quantity').eq('plan_date',today)
    ]);
    if(inventoryResult.error){
      if(missingOperationalLayer(inventoryResult.error)){get('adminOperationalHealth')?.remove();return false}
      throw inventoryResult.error;
    }
    if(productionResult.error){
      if(missingOperationalLayer(productionResult.error)){get('adminOperationalHealth')?.remove();return false}
      throw productionResult.error;
    }
    renderOperational(inventoryResult.data||[],productionResult.data||[]);
    return true;
  }catch(e){console.error('Falha ao atualizar alertas operacionais PADOKA',e);return false}finally{opsBusy=false}
}
function scheduleOrders(){clearTimeout(orderTimer);orderTimer=setTimeout(refreshOrders,180)}
function scheduleOperational(){clearTimeout(opsTimer);opsTimer=setTimeout(refreshOperational,180)}
function enableOperationalRealtime(){
  if(!inventoryChannel)inventoryChannel=window.padokaSupabase.channel('padoka-admin-inventory-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_inventory'},scheduleOperational).subscribe();
  if(!productionChannel)productionChannel=window.padokaSupabase.channel('padoka-admin-production-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},scheduleOperational).subscribe();
}
async function init(){
  if(!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return setTimeout(init,180);
  await refreshOrders();
  const operationalReady=await refreshOperational();
  if(!orderChannel)orderChannel=window.padokaSupabase.channel('padoka-admin-dashboard-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_orders'},scheduleOrders).subscribe();
  if(operationalReady)enableOperationalRealtime();
  setInterval(refreshOrders,60000);
  setInterval(async()=>{if(await refreshOperational())enableOperationalRealtime()},60000);
}
setTimeout(init,0);
})();
