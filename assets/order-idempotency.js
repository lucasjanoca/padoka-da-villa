(()=>{
const KEY='padoka_pending_order_v1';
// Automatic Pix is intentionally fail-closed until a real provider adapter + authenticated webhook are deployed.
// Do not flip this flag just to enable checkout: provider integration must be implemented and audited first.
const AUTOMATIC_PIX_READY=false;
let active=false,detectAttempts=0,authLifecycleBound=false,activeUserId=null,lifecycleEpoch=0;
const el=id=>document.getElementById(id);
const parse=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}};
const store=v=>sessionStorage.setItem(KEY,JSON.stringify(v));
const clear=()=>sessionStorage.removeItem(KEY);
const initialButton=el('sendOrder');
if(initialButton){initialButton.onclick=null;initialButton.disabled=true;}
function notice(text,type='warn'){
  let box=el('orderRetryNotice');
  if(!box){
    box=document.createElement('div');
    box.id='orderRetryNotice';
    box.className=`notice ${type}`;
    box.style.marginTop='10px';
    el('accountCard')?.appendChild(box);
  }
  box.className=`notice ${type}`;
  box.textContent=text;
}
function disableCheckout(text='Sua sessão mudou. Entre novamente para continuar com segurança.'){
  active=false;
  lifecycleEpoch+=1;
  const btn=el('sendOrder');
  if(btn){btn.onclick=null;btn.disabled=true;btn.textContent='Entre novamente';}
  const account=el('accountCard');
  if(account)account.innerHTML='<div class="notice warn"><strong>Sessão encerrada ou alterada.</strong><br>Entre novamente na sua conta PADOKA antes de continuar.</div>';
  notice(text);
}
function bindAuthLifecycle(){
  if(authLifecycleBound||!sb?.auth?.onAuthStateChange)return;
  authLifecycleBound=true;
  activeUserId=user?.id||null;
  sb.auth.onAuthStateChange((event,session)=>{
    const nextUser=session?.user||null;
    const nextId=nextUser?.id||null;
    if(nextId===activeUserId)return;
    const previousId=activeUserId;
    activeUserId=nextId;
    disableCheckout();
    if(nextId&&previousId&&nextId!==previousId){
      const pending=parse();
      if(pending?.user_id===previousId)clear();
    }
    user=nextUser;
    profile=null;
    if(nextId){
      // Reload so profile/onboarding and server-authoritative catalog are resolved for the new identity.
      location.reload();
    }
  });
}
function enforceAutomaticPaymentOnly(){
  if(AUTOMATIC_PIX_READY)return false;
  const card=el('paymentCard');
  if(card){
    card.innerHTML='<div class="payment-title"><h2>Forma de pagamento</h2><span class="payment-badge">PIX AUTOMÁTICO</span></div><div class="notice warn"><strong>Pagamento automático em configuração.</strong><br>O checkout está temporariamente bloqueado até a integração com um provedor Pix real confirmar pagamentos automaticamente. Nenhum comprovante ou confirmação manual libera pedido.</div>';
  }
  const btn=el('sendOrder');
  if(btn){btn.onclick=null;btn.disabled=true;btn.textContent='Pagamento em configuração';}
  return true;
}
function lockPending(){
  const btn=el('sendOrder');
  if(btn){btn.disabled=false;btn.textContent='Tentar novamente';}
  const edit=document.querySelector('.actions a[href="index.html#cardapio"]');
  if(edit){edit.setAttribute('aria-disabled','true');edit.style.pointerEvents='none';edit.style.opacity='.45';}
}
function unlock(){
  const btn=el('sendOrder');
  if(btn){btn.disabled=false;btn.textContent='Enviar pedido';}
  const edit=document.querySelector('.actions a[href="index.html#cardapio"]');
  if(edit){edit.removeAttribute('aria-disabled');edit.style.pointerEvents='';edit.style.opacity='';}
}
function payloadFromPage(){
  const mode=pickup?.mode==='noturna'?'night':'store';
  const items=buildItems().map(i=>({product_id:i.product_id,quantity:i.quantity}));
  return {mode,date:pickup?.date,time:pickup?.time,name:pickup?.name,items};
}
function ambiguous(error){
  const code=String(error?.code||'');
  const msg=String(error?.message||'');
  return !code||/fetch|network|timeout|load failed|connection/i.test(msg);
}
async function sendOnce(){
  if(enforceAutomaticPaymentOnly())return;
  if(!sb||!user||!profile?.onboarding_completed||!pickup)return;
  const epoch=lifecycleEpoch;
  const requestUserId=user.id;
  if(activeUserId&&activeUserId!==requestUserId)return;
  const btn=el('sendOrder');
  const existing=parse();
  const pending=existing?.user_id===requestUserId?existing:{
    user_id:requestUserId,
    request_id:crypto.randomUUID(),
    payload:payloadFromPage(),
    created_at:new Date().toISOString()
  };
  if(!pending.payload?.items?.length)return;
  store(pending);
  if(btn){btn.disabled=true;btn.textContent='Enviando…';}
  const p=pending.payload;
  const {data,error}=await sb.rpc('padoka_create_order_once',{
    p_request_id:pending.request_id,
    p_pickup_mode:p.mode,
    p_pickup_date:p.date,
    p_pickup_time:p.time,
    p_pickup_name:p.name,
    p_items:p.items
  });
  if(epoch!==lifecycleEpoch||requestUserId!==activeUserId)return;
  if(error){
    console.error('Falha ao reconciliar pedido PADOKA',error);
    if(ambiguous(error)){
      lockPending();
      notice('A conexão foi interrompida durante o envio. Use “Tentar novamente”: a mesma tentativa será reconciliada sem criar outro pedido.');
      return;
    }
    clear();
    unlock();
    notice('Não foi possível enviar o pedido. Atualize a página e tente novamente.');
    return;
  }
  const order=Array.isArray(data)?data[0]:data;
  if(!order?.code){
    lockPending();
    notice('O envio ficou sem confirmação. Tente novamente para reconciliar o mesmo pedido.');
    return;
  }
  clear();
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(PICKUP_KEY);
  location.href='acompanhamento.html?code='+encodeURIComponent(order.code);
}
function detect(){
  if(active)return;
  detectAttempts+=1;
  const ready=typeof sb!=='undefined'&&sb&&user&&profile?.onboarding_completed;
  if(!ready){
    if(typeof sb!=='undefined'&&sb)bindAuthLifecycle();
    enforceAutomaticPaymentOnly();
    if(detectAttempts<100)setTimeout(detect,120);
    return;
  }
  bindAuthLifecycle();
  activeUserId=user.id;
  if(enforceAutomaticPaymentOnly()){
    active=true;
    return;
  }
  active=true;
  const btn=el('sendOrder');
  if(btn)btn.onclick=sendOnce;
  const pending=parse();
  if(pending&&pending.user_id===user.id){
    lockPending();
    notice('Existe um envio pendente de confirmação. Tente novamente para reconciliar exatamente o mesmo pedido.');
  }else if(pending){
    clear();
  }
}
setTimeout(detect,0);
})();
