(()=>{
const TZ='America/Sao_Paulo';
let channel=null,busy=false,timer=null;
const get=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
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
async function refresh(){
  if(busy||!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return;
  busy=true;
  try{
    const since=new Date(Date.now()-36*60*60*1000).toISOString();
    const {data,error}=await window.padokaSupabase.from('padoka_orders').select('code,status,pickup_name,total,created_at').gte('created_at',since).order('created_at',{ascending:false});
    if(error)throw error;
    const today=dayKey();
    render((data||[]).filter(o=>o.created_at&&dayKey(new Date(o.created_at))===today));
  }catch(e){console.error('Falha ao atualizar visão geral PADOKA',e)}finally{busy=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(refresh,180)}
async function init(){
  if(!window.padokaSupabase||get('panelView')?.classList.contains('hidden'))return setTimeout(init,180);
  await refresh();
  if(!channel){
    channel=window.padokaSupabase.channel('padoka-admin-dashboard-live').on('postgres_changes',{event:'*',schema:'public',table:'padoka_orders'},schedule).subscribe();
  }
  setInterval(refresh,60000);
}
setTimeout(init,0);
})();
