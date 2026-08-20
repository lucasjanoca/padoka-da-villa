(()=>{
const KEY='padoka_pending_order_v1';
let active=false;
const el=id=>document.getElementById(id);
const parse=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{return null}};
const store=v=>sessionStorage.setItem(KEY,JSON.stringify(v));
const clear=()=>sessionStorage.removeItem(KEY);
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
  return !code||/fetch|network|timeout|load failed|connection/i.test(msg)||code==='PGRST202';
}
async function sendOnce(){
  if(!sb||!user||!profile?.onboarding_completed||!pickup)return;
  const btn=el('sendOrder');
  const existing=parse();
  const pending=existing?.user_id===user.id?existing:{
    user_id:user.id,
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
  if(error){
    console.error('Falha ao reconciliar pedido PADOKA',error);
    if(ambiguous(error)){
      lockPending();
      notice('A conexão foi interrompida durante o envio. Use “Tentar novamente”: a mesma tentativa será reconciliada sem criar outro pedido.');
      return;
    }
    clear();
    unlock();
    notice('Não foi possível enviar o pedido. Revise os dados e tente novamente.');
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
async function detect(){
  if(active)return;
  if(typeof sb==='undefined'||!sb)return setTimeout(detect,180);
  if(!user||!profile?.onboarding_completed)return;
  const {error}=await sb.from('padoka_orders').select('request_id').limit(1);
  if(error){
    const message=String(error.message||'');
    if(/request_id|column/i.test(message))return;
    console.warn('Não foi possível verificar a camada idempotente do checkout',error);
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
