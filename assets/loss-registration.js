(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;
  const $=id=>document.getElementById(id),KEY='padoka_pending_loss_v1';
  let sb=null,enabled=false,pending=null;
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaLossToast);window.__padokaLossToast=setTimeout(()=>el.classList.add('hidden'),2200)}
  function missing(error){return ['42P01','42703','PGRST204','PGRST205'].includes(error?.code)||/does not exist|schema cache|request_id/i.test(error?.message||'')}
  function networkish(error){return /fetch|network|timeout|load failed|connection|failed to fetch/i.test(String(error?.message||''))}
  function friendly(error){const m=String(error?.message||'').toLowerCase();if(m.includes('request id conflict'))return 'A tentativa anterior usa outros dados. Atualize a tela antes de registrar novamente.';if(m.includes('insufficient'))return 'Estoque insuficiente para registrar essa perda.';if(m.includes('permission'))return 'Seu perfil não tem permissão para registrar perdas.';if(m.includes('not initialized'))return 'O estoque deste produto ainda não foi inicializado.';if(m.includes('inactive'))return 'Este produto não está ativo no catálogo.';return 'Não foi possível registrar a perda.'}
  function uuid(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
  function savePending(v){pending=v;try{if(v)sessionStorage.setItem(KEY,JSON.stringify(v));else sessionStorage.removeItem(KEY)}catch{}}
  function restorePending(){try{const v=JSON.parse(sessionStorage.getItem(KEY)||'null');if(v?.requestId&&v?.productId&&Number(v?.quantity)>0)pending=v}catch{}}
  function detachLegacyHandler(){const btn=$('lossSave');if(btn)btn.onclick=null}
  function lockForm(lock){['lossProduct','lossQty','lossReason','lossNote'].forEach(id=>{const el=$(id);if(el)el.disabled=lock});const btn=$('lossSave');if(btn){btn.disabled=false;btn.textContent=lock?'Tentar novamente':'Registrar perda'}}
  function blockCapability(message='Registro seguro de perdas indisponível no momento.'){
    enabled=false;detachLegacyHandler();
    ['lossProduct','lossQty','lossReason','lossNote'].forEach(id=>{const el=$(id);if(el)el.disabled=true});
    const btn=$('lossSave');if(btn){btn.disabled=true;btn.textContent='Registro indisponível';btn.title=message}
  }
  function applyPending(){if(!pending)return;const product=$('lossProduct'),qty=$('lossQty'),reason=$('lossReason'),note=$('lossNote');if(product)product.value=pending.productId;if(qty)qty.value=String(pending.quantity);if(reason)reason.value=pending.reason;if(note)note.value=pending.note||'';lockForm(true);toast('Há um registro pendente. Tente novamente para confirmar sem duplicar a perda.')}
  function currentOperation(){const productId=$('lossProduct')?.value,quantity=Number($('lossQty')?.value||0),reason=$('lossReason')?.value,note=$('lossNote')?.value?.trim()||null;if(!productId||!Number.isFinite(quantity)||quantity<=0)return null;return {requestId:uuid(),productId,quantity,reason,note}}
  async function submit(){
    const btn=$('lossSave');if(!btn||!enabled)return;
    const op=pending||currentOperation();if(!op)return toast('Informe produto e quantidade válida.');
    if(!pending)savePending(op);
    lockForm(true);btn.disabled=true;btn.textContent='Registrando…';
    const {error}=await sb.rpc('padoka_register_loss_once',{p_product_id:op.productId,p_quantity:op.quantity,p_reason:op.reason,p_note:op.note,p_request_id:op.requestId});
    if(error){btn.disabled=false;if(networkish(error)){lockForm(true);toast('Não foi possível confirmar a resposta. Tente novamente com os mesmos dados.');return}savePending(null);lockForm(false);toast(friendly(error));return}
    savePending(null);lockForm(false);if($('lossNote'))$('lossNote').value='';toast('Perda registrada e estoque atualizado.');
  }
  function intercept(e){
    const btn=e.target.closest?.('#lossSave');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();detachLegacyHandler();
    if(!enabled){toast('Registro seguro de perdas indisponível no momento.');return}
    submit();
  }
  document.addEventListener('click',intercept,true);
  blockCapability();
  async function start(){
    for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));sb=window.padokaSupabase;if(!sb)return blockCapability();
    for(let n=0;n<100&&$('app')?.classList.contains('hidden');n++)await new Promise(r=>setTimeout(r,100));if($('app')?.classList.contains('hidden'))return blockCapability();
    const probe=await sb.from('padoka_losses').select('request_id').limit(1);
    if(probe.error){if(!missing(probe.error))console.error('PADOKA loss capability:',probe.error);blockCapability();return}
    enabled=true;detachLegacyHandler();restorePending();
    if(pending)setTimeout(applyPending,120);else lockForm(false);
  }
  start();
})();