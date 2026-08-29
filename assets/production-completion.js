(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;
  const $=id=>document.getElementById(id),today=()=>new Date().toLocaleDateString('en-CA');
  const PENDING_KEY='padoka_pending_production_v2';
  const LEGACY_PENDING_KEY='padoka_pending_production_v1';
  const allowedRoles=new Set(['owner','manager','production']);
  let sb=null,plans=[],observer=null,channel=null,enabled=false,refreshTimer=null,lifecycleEpoch=0,activeUserId='',authSubscription=null;
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaProdToast);window.__padokaProdToast=setTimeout(()=>el.classList.add('hidden'),1900)}
  function missing(error){return ['42P01','PGRST205','PGRST204'].includes(error?.code)||/does not exist|schema cache/i.test(error?.message||'')}
  function friendly(error){const m=String(error?.message||'').toLowerCase();if(m.includes('request id conflict'))return 'A tentativa anterior usa outra quantidade. Atualize a tela antes de registrar novamente.';if(m.includes('permission'))return 'Seu perfil não tem permissão para registrar produção.';if(m.includes('completed'))return 'Este plano já foi concluído.';if(m.includes('cancelled'))return 'Este plano foi cancelado.';if(m.includes('not found'))return 'Plano de produção não encontrado.';return 'Não foi possível confirmar o registro. Tente novamente com a mesma quantidade.'}
  function scopedPendingKey(userId=activeUserId){return userId?`${PENDING_KEY}:${userId}`:''}
  function discardLegacyPending(){try{sessionStorage.removeItem(LEGACY_PENDING_KEY)}catch{}}
  function readPending(){
    const key=scopedPendingKey();if(!key)return {};
    try{const raw=sessionStorage.getItem(key);const parsed=raw?JSON.parse(raw):{};if(!parsed||typeof parsed!=='object')return {};const clean={};for(const [planId,entry] of Object.entries(parsed)){if(entry?.userId===activeUserId&&entry?.planId===planId&&entry?.requestId)clean[planId]=entry}return clean}catch{return {}}
  }
  function writePending(map){const key=scopedPendingKey();if(!key)return;try{const keys=Object.keys(map);if(keys.length)sessionStorage.setItem(key,JSON.stringify(map));else sessionStorage.removeItem(key)}catch{}}
  function pendingFor(planId){return readPending()[planId]||null}
  function savePending(planId,quantity,requestId){const map=readPending();map[planId]={userId:activeUserId,planId,quantity:Number(quantity),requestId:String(requestId),createdAt:Date.now()};writePending(map);return map[planId]}
  function clearPending(planId){const map=readPending();if(Object.prototype.hasOwnProperty.call(map,planId)){delete map[planId];writePending(map)}}
  function clearProduction(removeControls=true){
    lifecycleEpoch+=1;enabled=false;plans=[];clearTimeout(refreshTimer);refreshTimer=null;
    if(channel&&sb){try{sb.removeChannel(channel)}catch{}}channel=null;
    if(observer){try{observer.disconnect()}catch{}}observer=null;
    if(removeControls){document.querySelector('[data-prod-head]')?.remove();document.querySelectorAll('[data-prod-cell]').forEach(cell=>cell.remove())}
  }
  async function reconcilePending(epoch=lifecycleEpoch){
    const map=readPending(),entries=Object.values(map).filter(x=>x?.userId===activeUserId&&x?.planId&&x?.requestId);
    if(!entries.length)return;
    const ids=entries.map(x=>x.requestId);
    const {data,error}=await sb.from('padoka_production_batches').select('plan_id,quantity,request_id').in('request_id',ids);
    if(epoch!==lifecycleEpoch||error)return;
    const byRequest=Object.fromEntries((data||[]).map(x=>[x.request_id,x]));
    let changed=false;
    for(const entry of entries){const batch=byRequest[entry.requestId];if(batch&&batch.plan_id===entry.planId&&Number(batch.quantity)===Number(entry.quantity)){delete map[entry.planId];changed=true}}
    if(changed)writePending(map);
  }
  async function loadPlans(epoch=lifecycleEpoch){const {data,error}=await sb.from('padoka_production_plans').select('id,product_id,planned_quantity,produced_quantity,status').eq('plan_date',today()).order('product_id');if(epoch!==lifecycleEpoch)return false;if(error)throw error;plans=data||[];return true}
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
    if(!enabled||!activeUserId)return;
    const epoch=lifecycleEpoch,userId=activeUserId,stored=pendingFor(plan.id);
    const requested=Number(input?.value||0);
    const quantity=stored?Number(stored.quantity):requested;
    if(!Number.isFinite(quantity)||quantity<=0)return toast('Informe uma quantidade válida.');
    if(stored&&Number.isFinite(requested)&&requested!==Number(stored.quantity)){input.value=String(stored.quantity)}
    const operation=stored||savePending(plan.id,quantity,btn.dataset.requestId||crypto.randomUUID());
    btn.dataset.requestId=operation.requestId;btn.dataset.requestQuantity=String(operation.quantity);
    btn.disabled=true;input.disabled=true;btn.textContent='Registrando…';
    let error=null;
    try{
      const result=await sb.rpc('padoka_record_production',{p_plan_id:plan.id,p_quantity:Number(operation.quantity),p_request_id:operation.requestId});
      error=result?.error||null;
    }catch(networkError){error=networkError}
    if(epoch!==lifecycleEpoch||userId!==activeUserId)return;
    if(error){btn.disabled=false;input.disabled=true;input.value=String(operation.quantity);btn.textContent='Tentar novamente';toast(friendly(error));return}
    clearPending(plan.id);delete btn.dataset.requestId;delete btn.dataset.requestQuantity;toast('Produção registrada e estoque atualizado.');await refresh()
  }
  async function refresh(){const epoch=lifecycleEpoch;if(!enabled)return;try{await reconcilePending(epoch);if(epoch!==lifecycleEpoch)return;if(!await loadPlans(epoch))return;if(epoch!==lifecycleEpoch)return;enhance()}catch(e){if(epoch===lifecycleEpoch)console.error('PADOKA production refresh:',e)}}
  function scheduleRefresh(){if(!enabled)return;clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120)}
  function observe(){const host=$('productionTable');if(!host||observer||!enabled)return;observer=new MutationObserver(()=>setTimeout(()=>{if(enabled)enhance()},40));observer.observe(host,{childList:true,subtree:true});enhance()}
  function subscribe(){if(channel||!enabled)return;channel=sb.channel('padoka-production-completion-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_production_plans'},scheduleRefresh).on('postgres_changes',{event:'INSERT',schema:'public',table:'padoka_production_batches'},scheduleRefresh).subscribe()}
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
    const epoch=lifecycleEpoch;if(!expectedUserId||!sb)return;
    const role=await waitForRole(expectedUserId);
    if(epoch!==lifecycleEpoch||!allowedRoles.has(role))return;
    const {data:{session}}=await sb.auth.getSession();
    if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId)return;
    const probe=await sb.from('padoka_production_batches').select('id').limit(1);
    if(epoch!==lifecycleEpoch)return;
    if(probe.error){if(!missing(probe.error))console.error('PADOKA production capability:',probe.error);return}
    activeUserId=expectedUserId;enabled=true;
    try{await reconcilePending(epoch);if(epoch!==lifecycleEpoch)return;if(!await loadPlans(epoch))return;if(epoch!==lifecycleEpoch)return;observe();subscribe()}catch(e){if(epoch===lifecycleEpoch)console.error('PADOKA production completion:',e)}
  }
  function watchAuth(){
    const result=sb.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'',previousUserId=activeUserId;
      if(nextUserId===previousUserId&&event==='SIGNED_IN')return;
      activeUserId=nextUserId;clearProduction();
      if(nextUserId)setTimeout(()=>activate(nextUserId),0);
    });
    authSubscription=result?.data?.subscription||null;
  }
  async function start(){for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));sb=window.padokaSupabase;if(!sb)return;discardLegacyPending();watchAuth();const {data:{session}}=await sb.auth.getSession();activeUserId=session?.user?.id||'';if(activeUserId)await activate(activeUserId)}
  window.addEventListener('pagehide',()=>{clearProduction(false);try{authSubscription?.unsubscribe()}catch{}},{once:true});
  start();
})();