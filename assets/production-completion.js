(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;
  const $=id=>document.getElementById(id),today=()=>new Date().toLocaleDateString('en-CA');
  const PENDING_KEY='padoka_pending_production_v1';
  let sb=null,plans=[],observer=null,channel=null,enabled=false,refreshTimer=null;
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaProdToast);window.__padokaProdToast=setTimeout(()=>el.classList.add('hidden'),1900)}
  function missing(error){return ['42P01','PGRST205','PGRST204'].includes(error?.code)||/does not exist|schema cache/i.test(error?.message||'')}
  function friendly(error){const m=String(error?.message||'').toLowerCase();if(m.includes('request id conflict'))return 'A tentativa anterior usa outra quantidade. Atualize a tela antes de registrar novamente.';if(m.includes('permission'))return 'Seu perfil não tem permissão para registrar produção.';if(m.includes('completed'))return 'Este plano já foi concluído.';if(m.includes('cancelled'))return 'Este plano foi cancelado.';if(m.includes('not found'))return 'Plano de produção não encontrado.';return 'Não foi possível confirmar o registro. Tente novamente com a mesma quantidade.'}
  function readPending(){try{const raw=sessionStorage.getItem(PENDING_KEY);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==='object'?parsed:{}}catch{return {}}}
  function writePending(map){try{const keys=Object.keys(map);if(keys.length)sessionStorage.setItem(PENDING_KEY,JSON.stringify(map));else sessionStorage.removeItem(PENDING_KEY)}catch{}}
  function pendingFor(planId){return readPending()[planId]||null}
  function savePending(planId,quantity,requestId){const map=readPending();map[planId]={planId,quantity:Number(quantity),requestId:String(requestId),createdAt:Date.now()};writePending(map);return map[planId]}
  function clearPending(planId){const map=readPending();if(Object.prototype.hasOwnProperty.call(map,planId)){delete map[planId];writePending(map)}}
  async function reconcilePending(){
    const map=readPending(),entries=Object.values(map).filter(x=>x?.planId&&x?.requestId);
    if(!entries.length)return;
    const ids=entries.map(x=>x.requestId);
    const {data,error}=await sb.from('padoka_production_batches').select('plan_id,quantity,request_id').in('request_id',ids);
    if(error)return;
    const byRequest=Object.fromEntries((data||[]).map(x=>[x.request_id,x]));
    let changed=false;
    for(const entry of entries){const batch=byRequest[entry.requestId];if(batch&&batch.plan_id===entry.planId&&Number(batch.quantity)===Number(entry.quantity)){delete map[entry.planId];changed=true}}
    if(changed)writePending(map);
  }
  async function loadPlans(){const {data,error}=await sb.from('padoka_production_plans').select('id,product_id,planned_quantity,produced_quantity,status').eq('plan_date',today()).order('product_id');if(error)throw error;plans=data||[]}
  function planMap(){return Object.fromEntries(plans.map(p=>[p.product_id,p]))}
  function signature(plan){if(!plan?.id)return 'missing';const pending=pendingFor(plan.id);return [plan.id,Number(plan.planned_quantity||0),Number(plan.produced_quantity||0),plan.status||'planned',pending?.requestId||'',pending?.quantity||''].join('|')}
  function renderCell(row,id,plan){
    let td=row.querySelector('[data-prod-cell]');if(!td){td=document.createElement('td');td.dataset.prodCell='1';row.appendChild(td)}
    const sig=signature(plan);if(td.dataset.prodSignature===sig)return;td.dataset.prodSignature=sig;td.replaceChildren();
    if(!plan?.id){const small=document.createElement('small');small.textContent='Defina o plano primeiro';td.appendChild(small);return}
    const remaining=Math.max(0,Number(plan.planned_quantity||0)-Number(plan.produced_quantity||0));
    const pending=pendingFor(plan.id);
    const disabled=plan.status==='completed'||plan.status==='cancelled';
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:6px;min-width:190px';
    const qty=document.createElement('input');qty.dataset.prodQty=id;qty.type='number';qty.min='0.001';qty.step='0.001';qty.value=String(pending?.quantity??(remaining>0?remaining:1));qty.style.minWidth='88px';qty.disabled=disabled||!!pending;
    const btn=document.createElement('button');btn.className='btn';btn.dataset.prodSave=id;btn.type='button';btn.disabled=disabled;btn.textContent=plan.status==='completed'?'Concluído':plan.status==='cancelled'?'Cancelado':pending?'Tentar novamente':'Registrar';
    if(pending){btn.dataset.requestId=pending.requestId;btn.dataset.requestQuantity=String(pending.quantity)}
    wrap.append(qty,btn);td.appendChild(wrap);if(!disabled)btn.onclick=()=>record(plan,qty,btn)
  }
  function enhance(){
    if(!enabled)return;const table=$('productionTable')?.querySelector('table');if(!table)return;
    const head=table.querySelector('thead tr');if(head&&!head.querySelector('[data-prod-head]')){const th=document.createElement('th');th.dataset.prodHead='1';th.textContent='Registrar produção';head.appendChild(th)}
    const map=planMap();table.querySelectorAll('tbody tr').forEach(row=>{const planInput=row.querySelector('[data-plan]');if(!planInput)return;const id=planInput.dataset.plan;renderCell(row,id,map[id])})
  }
  async function record(plan,input,btn){
    const stored=pendingFor(plan.id);
    const requested=Number(input?.value||0);
    const quantity=stored?Number(stored.quantity):requested;
    if(!Number.isFinite(quantity)||quantity<=0)return toast('Informe uma quantidade válida.');
    if(stored&&Number.isFinite(requested)&&requested!==Number(stored.quantity)){input.value=String(stored.quantity)}
    const operation=stored||savePending(plan.id,quantity,btn.dataset.requestId||crypto.randomUUID());
    btn.dataset.requestId=operation.requestId;btn.dataset.requestQuantity=String(operation.quantity);
    btn.disabled=true;input.disabled=true;btn.textContent='Registrando…';
    const {error}=await sb.rpc('padoka_record_production',{p_plan_id:plan.id,p_quantity:Number(operation.quantity),p_request_id:operation.requestId});
    if(error){btn.disabled=false;input.disabled=true;input.value=String(operation.quantity);btn.textContent='Tentar novamente';toast(friendly(error));return}
    clearPending(plan.id);delete btn.dataset.requestId;delete btn.dataset.requestQuantity;toast('Produção registrada e estoque atualizado.');await refresh()
  }
  async function refresh(){try{await reconcilePending();await loadPlans();enhance()}catch(e){console.error('PADOKA production refresh:',e)}}
  function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120)}
  function observe(){const host=$('productionTable');if(!host||observer)return;observer=new MutationObserver(()=>setTimeout(enhance,40));observer.observe(host,{childList:true,subtree:true});enhance()}
  function subscribe(){if(channel)return;channel=sb.channel('padoka-production-completion-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},scheduleRefresh).on('postgres_changes',{event:'INSERT',schema:'public',table:'padoka_production_batches'},scheduleRefresh).subscribe()}
  async function start(){for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));sb=window.padokaSupabase;if(!sb)return;for(let n=0;n<100&&$('app')?.classList.contains('hidden');n++)await new Promise(r=>setTimeout(r,100));if($('app')?.classList.contains('hidden'))return;const probe=await sb.from('padoka_production_batches').select('id').limit(1);if(probe.error){if(!missing(probe.error))console.error('PADOKA production capability:',probe.error);return}enabled=true;try{await reconcilePending();await loadPlans();observe();subscribe()}catch(e){console.error('PADOKA production completion:',e)}}
  start();
})();