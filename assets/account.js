const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';
const CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config';
const $=id=>document.getElementById(id);
let sb,user,profile,cfg,googleEnabled=null,lifecycleEpoch=0,activeUserId=null;
const labels={received:'Recebido',seen:'Visto',confirmed:'Confirmado',preparing:'Em preparo',ready:'Pronto',completed:'Concluído',cancelled:'Cancelado'};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeAvatarUrl(v){if(!v)return '';try{const u=new URL(String(v),location.href);return u.protocol==='https:'?u.href:''}catch{return ''}}
function show(id){['loginView','onboardingView','accountView'].forEach(x=>$(x).classList.toggle('hidden',x!==id));const boot=$('sessionBoot');if(boot)boot.hidden=true;document.documentElement.classList.remove('padoka-auth-booting')}
function notice(t,type='error'){$('authMessage').innerHTML=`<div class="notice ${type}">${t}</div>`}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1900)}
function provider(){const p=user?.app_metadata?.provider||user?.identities?.[0]?.provider||'email';return p==='google'?'Google':'E-mail'}
function isCurrent(epoch,userId){return epoch===lifecycleEpoch&&userId===activeUserId&&user?.id===userId}
function clearCustomerUi(){
  profile=null;
  for(const id of ['orders','clubHistory','notifications','privacyMessage']){const el=$(id);if(el)el.textContent=''}
  if($('clubBalance'))$('clubBalance').textContent='0';
  if($('clubLifetime'))$('clubLifetime').textContent='0';
  if($('profileName'))$('profileName').textContent='';
  if($('profileContact'))$('profileContact').textContent='';
  if($('providerChip'))$('providerChip').textContent='';
  if($('avatar'))$('avatar').textContent='';
}
function beginLifecycle(session){
  lifecycleEpoch+=1;
  user=session?.user||null;
  activeUserId=user?.id||null;
  clearCustomerUi();
  ['loginView','onboardingView','accountView'].forEach(id=>$(id)?.classList.add('hidden'));
  const boot=$('sessionBoot');if(boot)boot.hidden=false;
  document.documentElement.classList.add('padoka-auth-booting');
  return {epoch:lifecycleEpoch,userId:activeUserId};
}
function assertPublicConfig(value){
  if(!value||typeof value!=='object')throw new Error('Configuração inválida');
  const url=new URL(String(value.url||''));
  if(url.origin!==PADOKA_ORIGIN)throw new Error('Backend PADOKA inválido');
  if(typeof value.publishableKey!=='string'||value.publishableKey.length<20)throw new Error('Chave pública inválida');
  return {...value,url:PADOKA_ORIGIN};
}

async function checkGoogle(){
  try{
    const r=await fetch(`${PADOKA_ORIGIN}/auth/v1/settings`,{cache:'no-store',headers:{apikey:cfg.publishableKey}}),s=await r.json();
    googleEnabled=!!s?.external?.google;
    const state=$('googleState');
    if(googleEnabled){state.className='provider ok';state.textContent='✓ Login com Google disponível.'}
    else{state.className='provider hidden';state.textContent=''}
  }catch(e){googleEnabled=null;console.warn('Não foi possível pré-verificar o Google; o botão continuará tentando o OAuth.',e)}
}

async function init(){
  try{
    const raw=window.PADOKA_RUNTIME?.getPublicConfig?await window.PADOKA_RUNTIME.getPublicConfig():await (async()=>{const r=await fetch(CONFIG_URL,{cache:'no-store',credentials:'omit'});if(!r.ok)throw new Error('Configuração indisponível');return r.json()})();
    cfg=assertPublicConfig(raw);
    sb=window.supabase.createClient(PADOKA_ORIGIN,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
    window.padokaSupabase=sb;
    window.dispatchEvent(new CustomEvent('padoka:supabase-ready',{detail:{client:sb}}));
    const {data:{session}}=await sb.auth.getSession();
    sb.auth.onAuthStateChange((event,nextSession)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const lifecycle=beginLifecycle(nextSession);
      setTimeout(()=>loadPrepared(nextSession,lifecycle),0);
    });
    const lifecycle=beginLifecycle(session);
    await loadPrepared(session,lifecycle);
    checkGoogle();
  }catch(e){console.error(e);clearCustomerUi();show('loginView');notice('Não foi possível conectar ao serviço de contas agora. Tente novamente em instantes.')}
}

async function loadPrepared(session,{epoch,userId}){
  if(!isCurrent(epoch,userId))return;
  if(!session?.user){show('loginView');return}
  const {data,error}=await sb.from('padoka_profiles').select('*').eq('id',userId).maybeSingle();
  if(!isCurrent(epoch,userId))return;
  if(error){show('accountView');return notice('Sua sessão está ativa, mas o perfil não pôde ser carregado. Tente novamente.')}
  profile=data;
  if(!profile?.onboarding_completed){prefill();show('onboardingView');return}
  await renderAccount(epoch,userId);
}

function prefill(){const m=user?.user_metadata||{};$('name').value=profile?.full_name||m.full_name||m.name||'';$('email').value=user?.email||'';$('phone').value=profile?.phone||'';$('birthday').value=profile?.birthday||'';$('privacy').checked=!!profile?.privacy_accepted_at;$('marketing').checked=!!profile?.marketing_opt_in}

async function renderAccount(epoch=lifecycleEpoch,userId=activeUserId){
  if(!isCurrent(epoch,userId))return;
  const displayName=String(profile?.full_name||'Cliente').trim()||'Cliente',firstName=displayName.split(/\s+/)[0]||'Cliente';
  $('heroTitle').textContent=`Oi, ${firstName}!`;$('heroText').textContent='Sua conta, seus pedidos e o cardápio sempre a um toque.';$('profileName').textContent=displayName;$('profileContact').textContent=[user?.email||'',profile?.phone||''].filter(Boolean).join(' • ');$('providerChip').textContent='Entrou com '+provider();
  const pic=safeAvatarUrl(user?.user_metadata?.avatar_url||user?.user_metadata?.picture);if(pic)$('avatar').innerHTML=`<img src="${esc(pic)}" alt="Foto do perfil">`;else $('avatar').textContent=displayName.charAt(0).toUpperCase();
  $('orders').innerHTML='<div class="empty">Carregando seus pedidos…</div>';
  show('accountView');
  const {data,error}=await sb.from('padoka_orders').select('id,code,status,pickup_mode,total,created_at').order('created_at',{ascending:false}).limit(5);
  if(!isCurrent(epoch,userId))return;
  $('orders').innerHTML=error?'<div class="empty">Não foi possível carregar seus pedidos.</div>':data?.length?data.map(o=>{const code=String(o.code||''),status=labels[o.status]||'Pedido',date=o.created_at?new Date(o.created_at).toLocaleString('pt-BR'):'—',pickup=o.pickup_mode==='night'?'Padoca Noturna':'Retirada na padaria',total=Number(o.total||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});return `<div class="order"><div class="order-head"><span class="code">${esc(code)}</span><span class="status">${esc(status)}</span></div><div class="meta">${esc(date)} • ${esc(pickup)} • ${esc(total)}</div><div class="order-actions"><a href="acompanhamento.html?code=${encodeURIComponent(code)}">Ver andamento</a><button type="button" data-reorder="${esc(o.id)}">Pedir novamente</button></div></div>`}).join(''):'<div class="empty">Você ainda não tem pedidos.</div>';
  bindReorder(epoch,userId);
  await loadAccountExtras(epoch,userId);
}

async function loadAccountExtras(epoch=lifecycleEpoch,userId=activeUserId){
  if(!sb||!isCurrent(epoch,userId))return;
  try{
    const [{data:account},{data:ledger},{data:notes},{data:requests}]=await Promise.all([
      sb.from('padoka_loyalty_accounts').select('points_balance,lifetime_points').eq('user_id',userId).maybeSingle(),
      sb.from('padoka_loyalty_ledger').select('points,description,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(5),
      sb.from('padoka_customer_notifications').select('id,kind,title,body,read_at,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(8),
      sb.from('padoka_privacy_requests').select('request_type,status,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(3)
    ]);
    if(!isCurrent(epoch,userId))return;
    $('clubBalance').textContent=Number(account?.points_balance||0).toLocaleString('pt-BR');$('clubLifetime').textContent=Number(account?.lifetime_points||0).toLocaleString('pt-BR');
    $('clubHistory').innerHTML=ledger?.length?ledger.map(x=>`<div class="order"><div class="order-head"><span class="code">${esc(x.description)}</span><span class="status">${Number(x.points)>0?'+':''}${esc(x.points)} pts</span></div><div class="meta">${new Date(x.created_at).toLocaleString('pt-BR')}</div></div>`).join(''):'<div class="empty">Seus pontos aparecerão aqui após pedidos reais concluídos.</div>';
    $('notifications').innerHTML=notes?.length?notes.map(n=>`<div class="order ${n.read_at?'':'notification-unread'}"><div class="order-head"><span class="code">${esc(n.title)}</span><span class="status">${esc(n.kind)}</span></div><div class="meta">${esc(n.body)}<br>${new Date(n.created_at).toLocaleString('pt-BR')}</div></div>`).join(''):'<div class="empty">Nenhuma notificação por enquanto.</div>';
    if(requests?.length)$('privacyMessage').innerHTML='<div class="notice">'+requests.map(x=>`${esc(x.request_type)} • ${esc(x.status)} • ${new Date(x.created_at).toLocaleDateString('pt-BR')}`).join('<br>')+'</div>';
  }catch(e){if(isCurrent(epoch,userId))console.warn('Extras da conta indisponíveis',e)}
}

function bindReorder(epoch,userId){
  document.querySelectorAll('[data-reorder]').forEach(btn=>btn.onclick=async()=>{
    if(!isCurrent(epoch,userId))return;
    const orderId=btn.getAttribute('data-reorder');btn.disabled=true;
    try{
      const {data,error}=await sb.from('padoka_order_items').select('product_id,quantity').eq('order_id',orderId);
      if(!isCurrent(epoch,userId))return;
      if(error)throw error;
      const cart={};for(const item of data||[]){const q=Math.max(0,Math.min(50,Number(item.quantity)||0));if(q>0)cart[item.product_id]=q}
      if(!Object.keys(cart).length)return toast('Este pedido não possui itens disponíveis.');
      localStorage.setItem('padoka_cart_mobile_v1',JSON.stringify(cart));localStorage.removeItem('padoka_pickup');window.PADOKA_TELEMETRY?.track('reorder');location.href='index.html#cardapio';
    }catch(e){if(isCurrent(epoch,userId)){console.error(e);toast('Não foi possível refazer este pedido agora.')}}finally{if(isCurrent(epoch,userId))btn.disabled=false}
  })
}

$('googleBtn').onclick=async()=>{if(!sb)return notice('O serviço de login ainda está carregando. Tente novamente.');if(googleEnabled===false){notice('O acesso com Google está temporariamente indisponível. Você pode entrar com e-mail enquanto essa opção é ativada.');return}const btn=$('googleBtn'),txt=$('googleText');btn.disabled=true;txt.textContent='Abrindo Google…';notice('Abrindo o seletor de contas Google…','ok');try{const redirectTo=new URL('conta.html',location.href).href.split('#')[0];const {data,error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo,skipBrowserRedirect:false,queryParams:{prompt:'select_account',access_type:'offline'}}});if(error)throw error;if(data?.url){location.assign(data.url);return}}catch(e){console.error(e);notice('O acesso com Google está temporariamente indisponível. Você pode entrar com e-mail enquanto essa opção é ativada.')}finally{setTimeout(()=>{btn.disabled=false;txt.textContent='Continuar com Google'},900)}};
$('signInBtn').onclick=async()=>{const email=$('loginEmail').value.trim(),password=$('loginPassword').value;if(!email||!password)return notice('Informe e-mail e senha.');const {error}=await sb.auth.signInWithPassword({email,password});if(error)notice('E-mail ou senha inválidos.')};
$('signUpBtn').onclick=async()=>{const email=$('loginEmail').value.trim(),password=$('loginPassword').value,strong=password.length>=12&&/[a-z]/.test(password)&&/[A-Z]/.test(password)&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password);if(!email||!strong)return notice('Para criar a conta, use uma senha com 12 ou mais caracteres, incluindo maiúscula, minúscula, número e símbolo.');const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:new URL('conta.html',location.href).href.split('#')[0],data:{padoka_signup:true}}});if(error)return notice(error.message);notice(data.session?'Conta criada. Complete seu cadastro.':'Conta criada. Confira seu e-mail para confirmar.','ok')};
$('magicBtn').onclick=async()=>{const email=$('loginEmail').value.trim();if(!email)return notice('Digite seu e-mail primeiro.');const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:new URL('conta.html',location.href).href.split('#')[0],shouldCreateUser:true,data:{padoka_signup:true}}});if(error)notice('Não foi possível enviar o link agora.');else notice('Link enviado para seu e-mail.','ok')};
$('markNotificationsRead').onclick=async()=>{const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return;try{const {error}=await sb.rpc('padoka_mark_customer_notifications_read',{p_notification_id:null});if(!isCurrent(epoch,userId))return;if(error)throw error;await loadAccountExtras(epoch,userId);if(isCurrent(epoch,userId))toast('Notificações marcadas como lidas.')}catch(e){if(isCurrent(epoch,userId)){console.error(e);toast('Não foi possível atualizar as notificações.')}}};
$('exportData').onclick=async()=>{const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return;const btn=$('exportData');btn.disabled=true;try{const {data,error}=await sb.rpc('padoka_export_my_data');if(!isCurrent(epoch,userId))return;if(error)throw error;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='padoka-meus-dados.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Arquivo de dados preparado.')}catch(e){if(isCurrent(epoch,userId)){console.error(e);toast('Não foi possível exportar seus dados agora.')}}finally{if(isCurrent(epoch,userId))btn.disabled=false}};
$('requestDelete').onclick=async()=>{if(!confirm('Deseja abrir uma solicitação de exclusão dos dados da sua conta? O pedido será analisado antes de qualquer exclusão.'))return;const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return;const btn=$('requestDelete');btn.disabled=true;try{const {error}=await sb.rpc('padoka_request_privacy_action',{p_type:'delete',p_details:'Solicitação aberta pelo autoatendimento da conta.'});if(!isCurrent(epoch,userId))return;if(error)throw error;await loadAccountExtras(epoch,userId);if(isCurrent(epoch,userId))toast('Solicitação registrada.')}catch(e){if(isCurrent(epoch,userId)){console.error(e);toast('Não foi possível registrar a solicitação.')}}finally{if(isCurrent(epoch,userId))btn.disabled=false}};
async function saveProfileServer(full_name,phone){const args={p_full_name:full_name,p_phone:phone,p_birthday:$('birthday').value||null,p_marketing_opt_in:$('marketing').checked,p_privacy_accepted:$('privacy').checked};return sb.rpc('padoka_save_profile',args)}
$('saveProfile').onclick=async()=>{const full_name=$('name').value.trim(),phone=$('phone').value.trim();if(!full_name||!phone||!$('privacy').checked)return toast('Preencha nome, WhatsApp e aceite a privacidade.');const epoch=lifecycleEpoch,userId=activeUserId;if(!isCurrent(epoch,userId))return;const btn=$('saveProfile');btn.disabled=true;btn.textContent='Salvando…';try{const res=await saveProfileServer(full_name,phone);if(!isCurrent(epoch,userId))return;if(res.error)return toast('Não foi possível salvar.');profile=Array.isArray(res.data)?res.data[0]:res.data;if(!profile)return toast('Não foi possível confirmar o cadastro.');await renderAccount(epoch,userId);if(isCurrent(epoch,userId))toast('Cadastro salvo.')}finally{if(isCurrent(epoch,userId)){btn.disabled=false;btn.textContent='Salvar e entrar'}}};
$('editProfile').onclick=()=>{if(!activeUserId)return;prefill();show('onboardingView')};
$('logout').onclick=async()=>{const lifecycle=beginLifecycle(null);try{await sb.auth.signOut()}finally{if(lifecycle.epoch===lifecycleEpoch)show('loginView')}};
init();