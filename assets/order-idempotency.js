(()=>{
const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';
const KEY_PREFIX='padoka_pending_order_v3:';
const LEGACY_KEYS=['padoka_pending_order_v1','padoka_pending_order_v2:'];
// Pix stays fail-closed until a real provider adapter + authenticated webhook are deployed.
const AUTOMATIC_PIX_READY=false;
let active=false,detectAttempts=0,authLifecycleBound=false,activeUserId=null,lifecycleEpoch=0;
const el=id=>document.getElementById(id);
const keyFor=userId=>userId?KEY_PREFIX+userId:'';
const parse=userId=>{const key=keyFor(userId);if(!key)return null;try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}};
const store=(userId,v)=>{const key=keyFor(userId);if(key)sessionStorage.setItem(key,JSON.stringify(v))};
const clear=userId=>{const key=keyFor(userId);if(key)sessionStorage.removeItem(key)};
try{sessionStorage.removeItem(LEGACY_KEYS[0]);}catch{}
const initialButton=el('sendOrder');
if(initialButton){initialButton.onclick=null;initialButton.disabled=true;}
function isPadokaClient(){try{return new URL(String(sb?.supabaseUrl||'')).origin===PADOKA_ORIGIN}catch{return false}}
function selectedPaymentMethod(){return window.PADOKA_PAYMENT_METHOD==='pix'?'pix':'pickup'}
function notice(text,type='warn'){
  let box=el('orderRetryNotice');
  if(!box){box=document.createElement('div');box.id='orderRetryNotice';box.className=`notice ${type}`;box.classList.add('padoka-mt-10');el('accountCard')?.appendChild(box)}
  box.className=`notice ${type}`;box.textContent=text;
}
function removeNotice(){el('orderRetryNotice')?.remove()}
function disableCheckout(text='Sua sessão mudou. Entre novamente para continuar com segurança.'){
  active=false;lifecycleEpoch+=1;
  const btn=el('sendOrder');if(btn){btn.onclick=null;btn.disabled=true;btn.textContent='Entre novamente'}
  const account=el('accountCard');if(account)account.innerHTML='<div class="notice warn"><strong>Sessão encerrada ou alterada.</strong><br>Entre novamente na sua conta PADOKA antes de continuar.</div>';
  notice(text);
}
async function safeSession(){if(!isPadokaClient())return null;try{const {data,error}=await sb.auth.getSession();if(error)return null;return data?.session||null}catch{return null}}
async function identityStillCurrent(expectedUserId,epoch){if(epoch!==lifecycleEpoch||expectedUserId!==activeUserId||!isPadokaClient())return false;const session=await safeSession();return !!session?.user?.id&&session.user.id===expectedUserId&&epoch===lifecycleEpoch&&expectedUserId===activeUserId}
function bindAuthLifecycle(){
  if(authLifecycleBound||!isPadokaClient()||!sb?.auth?.onAuthStateChange)return;
  authLifecycleBound=true;activeUserId=user?.id||null;
  sb.auth.onAuthStateChange((_event,session)=>{const nextUser=session?.user||null;const nextId=nextUser?.id||null;if(nextId===activeUserId)return;activeUserId=nextId;disableCheckout();user=nextUser;profile=null;if(nextId)location.reload()});
}
function paymentReady(){
  const method=selectedPaymentMethod();
  if(method==='pix'&&!AUTOMATIC_PIX_READY){const btn=el('sendOrder');if(btn){btn.onclick=null;btn.disabled=true;btn.textContent='Pix em configuração'}return false}
  return true;
}
function syncCheckoutButton(){
  const btn=el('sendOrder');if(!btn)return;
  const ready=typeof sb!=='undefined'&&sb&&isPadokaClient()&&user&&profile?.onboarding_completed&&pickup&&typeof buildItems==='function'&&buildItems().length>0;
  if(!ready){btn.disabled=true;return}
  if(!paymentReady())return;
  btn.disabled=false;btn.textContent=selectedPaymentMethod()==='pickup'?'Enviar pedido • pagar na retirada':'Enviar pedido';btn.onclick=sendOnce;
}
function lockPending(){const btn=el('sendOrder');if(btn){btn.disabled=false;btn.textContent='Tentar novamente'}const edit=document.querySelector('.actions a[href="index.html#cardapio"]');if(edit){edit.setAttribute('aria-disabled','true');edit.classList.add('padoka-edit-disabled')}}
function unlock(){const btn=el('sendOrder');if(btn){btn.disabled=false;btn.textContent=selectedPaymentMethod()==='pickup'?'Enviar pedido • pagar na retirada':'Enviar pedido'}const edit=document.querySelector('.actions a[href="index.html#cardapio"]');if(edit){edit.removeAttribute('aria-disabled');edit.classList.remove('padoka-edit-disabled')}}
function payloadFromPage(){const mode=pickup?.mode==='noturna'?'night':'store';const items=buildItems().map(i=>({product_id:i.product_id,quantity:i.quantity}));return {mode,date:pickup?.date,time:pickup?.time,name:pickup?.name,items,coupon_code:String(window.PADOKA_CHECKOUT_COUPON||'').trim().toUpperCase()||null,payment_method:selectedPaymentMethod()}}
function ambiguous(error){const code=String(error?.code||'');const msg=String(error?.message||'');return !code||/fetch|network|timeout|load failed|connection/i.test(msg)}
async function sendOnce(){
  if(!paymentReady())return;
  if(!isPadokaClient()){disableCheckout('Não foi possível validar o serviço PADOKA. Atualize a página antes de continuar.');return}
  if(!sb||!user||!profile?.onboarding_completed||!pickup)return;
  const epoch=lifecycleEpoch,requestUserId=user.id;
  if(activeUserId&&activeUserId!==requestUserId)return;
  const session=await safeSession();
  if(!session?.user?.id||session.user.id!==requestUserId||epoch!==lifecycleEpoch||requestUserId!==activeUserId){disableCheckout('Não foi possível confirmar sua sessão. Entre novamente antes de enviar o pedido.');return}
  const btn=el('sendOrder'),method=selectedPaymentMethod(),existing=parse(requestUserId);
  const reusable=existing?.user_id===requestUserId&&existing?.payload?.payment_method===method;
  const pending=reusable?existing:{user_id:requestUserId,request_id:crypto.randomUUID(),payload:payloadFromPage(),created_at:new Date().toISOString()};
  if(!pending.payload?.items?.length)return;
  store(requestUserId,pending);if(btn){btn.disabled=true;btn.textContent='Enviando…'}
  const p=pending.payload;let result;
  try{
    if(!isPadokaClient())throw new Error('PADOKA backend mismatch');
    result=await sb.rpc('padoka_create_order_once_v3',{
      p_request_id:pending.request_id,p_pickup_mode:p.mode,p_pickup_date:p.date,p_pickup_time:p.time,p_pickup_name:p.name,p_items:p.items,p_coupon_code:p.coupon_code,p_payment_method:p.payment_method
    });
  }catch(error){
    if(epoch!==lifecycleEpoch||requestUserId!==activeUserId)return;
    console.error('Falha de transporte ao reconciliar pedido PADOKA',error);lockPending();notice('A conexão foi interrompida durante o envio. Use “Tentar novamente”: a mesma tentativa será reconciliada sem criar outro pedido.');return;
  }
  if(!(await identityStillCurrent(requestUserId,epoch))){disableCheckout('Não foi possível confirmar sua sessão após o envio. Entre novamente para reconciliar a mesma tentativa com segurança.');return}
  const {data,error}=result||{};
  if(error){console.error('Falha ao reconciliar pedido PADOKA',error);if(ambiguous(error)){lockPending();notice('A conexão foi interrompida durante o envio. Use “Tentar novamente”: a mesma tentativa será reconciliada sem criar outro pedido.');return}clear(requestUserId);unlock();notice('Não foi possível enviar o pedido. Atualize a página e tente novamente.');return}
  const order=Array.isArray(data)?data[0]:data;
  if(!order?.code){lockPending();notice('O envio ficou sem confirmação. Tente novamente para reconciliar o mesmo pedido.');return}
  clear(requestUserId);localStorage.removeItem('padoka_cart_mobile_v1');localStorage.removeItem('padoka_pickup');window.PADOKA_TELEMETRY?.track('checkout_success',{order_stage:'order_created',payment_method:p.payment_method});location.href='acompanhamento.html?code='+encodeURIComponent(order.code);
}
function detect(){
  if(active)return;detectAttempts+=1;
  const ready=typeof sb!=='undefined'&&sb&&isPadokaClient()&&user&&profile?.onboarding_completed;
  if(!ready){if(typeof sb!=='undefined'&&sb&&isPadokaClient())bindAuthLifecycle();if(detectAttempts<100)setTimeout(detect,120);return}
  bindAuthLifecycle();activeUserId=user.id;active=true;syncCheckoutButton();
  const pending=parse(user.id);if(pending?.user_id===user.id&&pending?.payload?.payment_method===selectedPaymentMethod()){lockPending();notice('Existe um envio pendente de confirmação. Tente novamente para reconciliar exatamente o mesmo pedido.')}else if(pending){clear(user.id)}
}
window.addEventListener('padoka:payment-method-change',()=>{removeNotice();syncCheckoutButton()});
window.addEventListener('padoka:checkout-ready',()=>{if(!active){detectAttempts=0;detect()}else syncCheckoutButton()});
setTimeout(detect,0);
})();