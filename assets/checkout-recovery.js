(()=>{
'use strict';
const isCheckout=()=>location.pathname.endsWith('/pagamento.html')||location.pathname.endsWith('pagamento.html');
if(!isCheckout())return;
const $=id=>document.getElementById(id);
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
const timeout=(promise,ms=5000)=>Promise.race([Promise.resolve(promise),new Promise((_,reject)=>setTimeout(()=>reject(new Error('checkout_recovery_timeout')),ms))]);
async function recover(){
  const loading=$('loading');
  if(!loading||loading.classList.contains('hidden'))return;
  const summary=$('summary'),payment=$('paymentCard'),account=$('accountCard'),send=$('sendOrder');
  try{
    if(!window.supabase?.createClient||!window.PADOKA_RUNTIME?.getPublicConfig)throw new Error('checkout_runtime_missing');
    const cfg=await timeout(window.PADOKA_RUNTIME.getPublicConfig());
    const client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const [{data:products,error:productError},{data:{session}}]=await timeout(Promise.all([
      client.from('padoka_products').select('id,name,price,is_demo').eq('active',true).order('sort_order'),
      client.auth.getSession()
    ]));
    if(productError)throw productError;
    const pickup=get('padoka_pickup');
    const catalog=Object.fromEntries((products||[]).map(p=>[p.id,p]));
    const buildItems=()=>{
      const cart=pickup?.cart||{};
      return Object.entries(cart).filter(([id,q])=>catalog[id]&&Number(q)>0).map(([id,q])=>({product_id:id,quantity:Number(q),product_name:catalog[id].name,unit_price:Number(catalog[id].price)}));
    };
    window.sb=client;
    window.user=session?.user||null;
    window.profile=null;
    window.pickup=pickup;
    window.catalog=catalog;
    window.buildItems=buildItems;
    window.PADOKA_CHECKOUT_COUPON='';
    if(window.user){
      const {data}=await timeout(client.from('padoka_profiles').select('*').eq('id',window.user.id).maybeSingle());
      window.profile=data||null;
    }
    const items=buildItems();
    if(!pickup){
      summary.innerHTML='<div class="notice warn"><strong>Nenhum pedido em revisão.</strong><br>Volte ao cardápio e monte seu carrinho.</div>';
      if(send)send.disabled=true;
    }else if(!items.length){
      summary.innerHTML='<div class="notice warn"><strong>Não foi possível validar os itens do carrinho.</strong><br>Volte ao cardápio e revise o pedido.</div>';
      if(send)send.disabled=true;
    }else{
      const total=items.reduce((s,i)=>s+i.quantity*i.unit_price,0);
      const pickupLabel=pickup.mode==='noturna'?'Padoca Noturna':'Na padaria';
      summary.innerHTML=`<h2 class="padoka-inline-h2">Resumo</h2><div class="row"><span>Retirada</span><strong>${esc(pickupLabel)}</strong></div><div class="row"><span>Data e horário</span><strong>${esc(pickup.date||'—')} • ${esc(pickup.time||'—')}</strong></div><div class="row"><span>Nome para retirada</span><strong>${esc(pickup.name||'—')}</strong></div><div class="items">${items.map(i=>`<div class="item"><span>${esc(i.quantity)}× ${esc(i.product_name)}</span><strong>${esc(money(i.quantity*i.unit_price))}</strong></div>`).join('')}</div><div class="row"><span>Total</span><strong class="total">${esc(money(total))}</strong></div><div class="notice ok padoka-mt-10"><strong>Valores conferidos.</strong><br>Os preços foram validados pelo catálogo.</div>`;
    }
    payment.innerHTML='<div class="payment-title"><h2>Forma de pagamento</h2><span class="payment-badge">PIX AUTOMÁTICO</span></div><div class="notice warn"><strong>Pagamento automático em configuração.</strong><br>O pedido permanece protegido até a integração Pix automática estar pronta.</div>';
    if(!window.user||!window.profile?.onboarding_completed){
      account.innerHTML='<h2 class="padoka-inline-h2-17">Entre na sua conta PADOKA</h2><p class="padoka-inline-sub">O pedido precisa de uma conta para ficar vinculado somente a você.</p><a class="btn dark padoka-block-mt-12" href="conta.html">Entrar / criar conta</a>';
      if(send)send.disabled=true;
    }else{
      const name=String(window.profile?.full_name||'Cliente').trim()||'Cliente';
      account.innerHTML=`<div class="account"><div class="avatar">${esc(name.charAt(0).toUpperCase())}</div><div><strong>${esc(name)}</strong><small>${esc(window.user?.email||'')}</small></div></div><div class="notice ok padoka-mt-12"><strong>Conta vinculada.</strong><br>Seu pedido ficará associado a esta conta.</div>`;
    }
  }catch(error){
    console.error('Recuperação do checkout falhou',error);
    if(summary)summary.innerHTML='<div class="notice warn"><strong>Não foi possível abrir o fechamento do pedido.</strong><br>Confira sua conexão e tente novamente.</div>';
    if(payment)payment.innerHTML='<div class="notice warn">A etapa de pagamento não carregou.</div>';
    if(account)account.innerHTML='<button class="btn soft" id="retryCheckoutRecovery" type="button">Tentar novamente</button>';
    const retry=$('retryCheckoutRecovery');
    if(retry)retry.onclick=()=>location.reload();
    if(send)send.disabled=true;
  }finally{
    loading.classList.add('hidden');
  }
}
window.__PADOKA_RECOVER_CHECKOUT=recover;
recover();
})();