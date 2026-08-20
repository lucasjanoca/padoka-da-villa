(()=>{
  if(!(location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html')))return;
  const $=id=>document.getElementById(id), catalog=window.PADOKA_CATALOG||[], byId=Object.fromEntries(catalog.map(p=>[p.id,p]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let sb,inventory=[],plans=[],losses=[],channel=null,active=false;
  const today=()=>new Date().toLocaleDateString('en-CA');
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaOpsToast);window.__padokaOpsToast=setTimeout(()=>el.classList.add('hidden'),1800)}
  function relationMissing(error){return ['42P01','PGRST205','PGRST204'].includes(error?.code)||/does not exist|schema cache/i.test(error?.message||'')}
  async function loadAll(){
    const [i,p,l]=await Promise.all([
      sb.from('padoka_inventory').select('product_id,barcode,quantity,min_quantity,updated_at').order('product_id'),
      sb.from('padoka_production_plans').select('id,plan_date,product_id,planned_quantity,produced_quantity,status,note,updated_at').eq('plan_date',today()).order('product_id'),
      sb.from('padoka_losses').select('id,product_id,quantity,reason,note,created_at').order('created_at',{ascending:false}).limit(100)
    ]);
    if(i.error){if(relationMissing(i.error))return false;throw i.error}
    if(p.error&&!relationMissing(p.error))throw p.error;
    if(l.error&&!relationMissing(l.error))throw l.error;
    inventory=i.data||[];plans=p.data||[];losses=l.data||[];active=true;render();return true;
  }
  function render(){if(!active)return;renderStock();renderProduction();renderLosses();renderReports();const badge=$('staffBadge');if(badge&&!badge.textContent.includes('SINCRONIZADO'))badge.textContent+=' • SINCRONIZADO'}
  function renderStock(){
    const host=$('stockTable');if(!host)return;
    const inv=Object.fromEntries(inventory.map(x=>[x.product_id,x]));
    const rows=catalog.map(p=>{const s=inv[p.id]||{quantity:0,min_quantity:0,barcode:''};return `<tr><td><strong>${esc(p.name)}</strong><br><small>${esc(p.id)}</small></td><td>${esc(p.unit)}</td><td><input data-srv-code="${esc(p.id)}" value="${esc(s.barcode||'')}" placeholder="Bipe o EAN"></td><td><input data-srv-qty="${esc(p.id)}" type="number" step="0.001" min="0" value="${Number(s.quantity||0)}"></td><td><input data-srv-min="${esc(p.id)}" type="number" step="0.001" min="0" value="${Number(s.min_quantity||0)}"></td><td><span class="status ${s.barcode?'ok':''}">${s.barcode?'Cadastrado':'Pendente'}</span></td></tr>`}).join('');
    host.innerHTML=`<table class="table"><thead><tr><th>Produto</th><th>Unidade</th><th>Código/EAN</th><th>Saldo</th><th>Mínimo</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    document.querySelectorAll('[data-srv-code]').forEach(i=>i.onchange=()=>saveMeta(i.dataset.srvCode,{barcode:i.value.trim()||null}));
    document.querySelectorAll('[data-srv-min]').forEach(i=>i.onchange=()=>saveMeta(i.dataset.srvMin,{min_quantity:Math.max(0,Number(i.value||0))}));
    document.querySelectorAll('[data-srv-qty]').forEach(i=>i.onchange=()=>adjustQty(i));
    if($('stockProducts'))$('stockProducts').textContent=catalog.length;
    if($('stockCodes'))$('stockCodes').textContent=inventory.filter(x=>x.barcode).length;
    if($('stockLow'))$('stockLow').textContent=inventory.filter(x=>Number(x.min_quantity)>0&&Number(x.quantity)<=Number(x.min_quantity)).length;
    if($('stockPending'))$('stockPending').textContent=catalog.filter(p=>!inv[p.id]?.barcode).length;
  }
  async function saveMeta(id,patch){const {error}=await sb.from('padoka_inventory').update(patch).eq('product_id',id);if(error){toast('Sem permissão ou não foi possível salvar.');await loadAll();return}toast('Estoque atualizado');await loadAll()}
  async function adjustQty(input){const id=input.dataset.srvQty,current=Number(inventory.find(x=>x.product_id===id)?.quantity||0),next=Math.max(0,Number(input.value||0)),delta=Number((next-current).toFixed(3));if(!delta)return;input.disabled=true;const {error}=await sb.rpc('padoka_adjust_inventory',{p_product_id:id,p_delta:delta,p_reason:'Ajuste pela gestão',p_source:'adjustment',p_reference_id:null});input.disabled=false;if(error){toast(error.message?.includes('permission')?'Sem permissão para ajustar estoque.':'Não foi possível ajustar o estoque.');await loadAll();return}toast('Saldo atualizado');await loadAll()}
  function renderProduction(){
    const host=$('productionTable');if(!host)return;const map=Object.fromEntries(plans.map(x=>[x.product_id,x]));
    const eligible=catalog.filter(p=>['Pães','Salgados','Doces','paes','salgados','doces'].includes(p.category));
    host.innerHTML=`<table class="table"><thead><tr><th>Produto</th><th>Unidade</th><th>Planejado hoje</th><th>Produzido</th><th>Status</th></tr></thead><tbody>${eligible.map(p=>{const x=map[p.id]||{};return `<tr><td>${esc(p.name)}</td><td>${esc(p.unit)}</td><td><input data-plan="${esc(p.id)}" type="number" min="0" step="0.001" value="${Number(x.planned_quantity||0)}"></td><td>${Number(x.produced_quantity||0)}</td><td><span class="status ${x.status==='completed'?'ok':''}">${esc(x.status==='in_progress'?'Em produção':x.status==='completed'?'Concluído':x.status==='cancelled'?'Cancelado':'Planejado')}</span></td></tr>`}).join('')}</tbody></table>`;
    document.querySelectorAll('[data-plan]').forEach(i=>i.onchange=()=>savePlan(i));
  }
  async function savePlan(input){const quantity=Math.max(0,Number(input.value||0));input.disabled=true;const payload={plan_date:today(),product_id:input.dataset.plan,planned_quantity:quantity};const {error}=await sb.from('padoka_production_plans').upsert(payload,{onConflict:'plan_date,product_id'});input.disabled=false;if(error){toast('Sem permissão ou não foi possível salvar a produção.');await loadAll();return}toast('Planejamento atualizado');await loadAll()}
  function renderLosses(){
    const select=$('lossProduct');if(select)select.innerHTML=catalog.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const host=$('lossList');if(host)host.innerHTML=losses.length?losses.map(x=>{const p=byId[x.product_id];return `<div class="notice"><strong>${esc(p?.name||x.product_id)}</strong> • ${Number(x.quantity||0)} • ${esc(x.reason)}<br>${esc(x.note||'')}<br><small>${new Date(x.created_at).toLocaleString('pt-BR')}</small></div>`}).join(''):'<div class="notice">Nenhuma perda registrada.</div>';
    const btn=$('lossSave');if(btn)btn.onclick=registerLoss;
  }
  async function registerLoss(){const btn=$('lossSave'),product_id=$('lossProduct')?.value,quantity=Number($('lossQty')?.value||0),reason=$('lossReason')?.value,note=$('lossNote')?.value?.trim()||null;if(!product_id||quantity<=0)return toast('Informe produto e quantidade válida.');btn.disabled=true;const {error}=await sb.rpc('padoka_register_loss',{p_product_id:product_id,p_quantity:quantity,p_reason:reason,p_note:note});btn.disabled=false;if(error){toast(error.message?.includes('insufficient')?'Estoque insuficiente para registrar a perda.':error.message?.includes('permission')?'Sem permissão para registrar perdas.':'Não foi possível registrar a perda.');return}if($('lossNote'))$('lossNote').value='';toast('Perda registrada e estoque atualizado');await loadAll()}
  function renderReports(){if($('rProducts'))$('rProducts').textContent=catalog.length;if($('rWeight'))$('rWeight').textContent=catalog.filter(p=>String(p.unit).includes('100')).length;if($('rLoss'))$('rLoss').textContent=losses.length;if($('rCodes'))$('rCodes').textContent=inventory.filter(x=>x.barcode).length}
  function subscribe(){if(channel)return;channel=sb.channel('padoka-operational-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_inventory'},()=>loadAll()).on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},()=>loadAll()).on('postgres_changes',{event:'*',schema:'public',table:'padoka_losses'},()=>loadAll()).subscribe()}
  async function start(){for(let n=0;n<80&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));sb=window.padokaSupabase;if(!sb)return;for(let n=0;n<80&&$('app')?.classList.contains('hidden');n++)await new Promise(r=>setTimeout(r,100));if($('app')?.classList.contains('hidden'))return;try{if(await loadAll())subscribe()}catch(e){console.error('PADOKA operational sync:',e)}}
  start();
})();