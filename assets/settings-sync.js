(()=>{
  if(!(location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html')))return;
  const $=id=>document.getElementById(id);
  let sb=null,active=false,channel=null,lifecycleEpoch=0,activeUserId='',authSubscription=null;
  const allowedRoles=new Set(['owner','manager']);
  const paymentToUi={pix:'Pix',cash:'Dinheiro',card:'Cartão'};
  const paymentToDb={'Pix':'pix','Dinheiro':'cash','Cartão':'card'};
  function toast(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.remove('hidden');clearTimeout(window.__padokaSettingsToast);window.__padokaSettingsToast=setTimeout(()=>el.classList.add('hidden'),1800)}
  function functionMissing(error){return ['PGRST202','42883'].includes(error?.code)||/function .* does not exist|schema cache/i.test(error?.message||'')}
  function timeValue(v){return v?String(v).slice(0,5):''}
  function ensureState(){let el=$('cfgServerState');if(el)return el;const panel=document.querySelector('[data-panel="configuracoes"] .card');if(!panel)return null;el=document.createElement('div');el.id='cfgServerState';el.className='notice padoka-mt-10';panel.appendChild(el);return el}
  function showState(t,ok=false){const el=ensureState();if(!el)return;el.textContent=t;el.classList.toggle('padoka-notice-ok',ok)}
  function setControlsEnabled(enabled){for(const id of ['cfgOpen','cfgClose','cfgNight','cfgPayment','cfgNote','cfgSave'])if($(id))$(id).disabled=!enabled}
  function blockLegacyFallback(message='Carregando configurações do servidor…'){active=false;setControlsEnabled(false);const btn=$('cfgSave');if(btn)btn.onclick=()=>toast('As configurações do servidor estão indisponíveis. Nada foi salvo apenas neste navegador.');showState(message)}
  async function clearChannel(){if(!channel||!sb)return;const current=channel;channel=null;try{await sb.removeChannel(current)}catch{}}
  function resetForIdentityChange(message='Revalidando permissões da conta interna…'){lifecycleEpoch+=1;activeUserId='';active=false;clearChannel();blockLegacyFallback(message)}
  function failClosedAndRetry(userId,message='Não foi possível confirmar a sessão interna. Verifique a conexão e tente novamente.'){
    if(!userId){resetForIdentityChange(message);return}
    resetForIdentityChange(message);
    setTimeout(()=>activateForUser(userId),3000)
  }
  async function safeSession(context='session'){
    if(!sb)return null;
    try{
      const {data:{session},error}=await sb.auth.getSession();
      if(error){console.error(`PADOKA settings ${context}:`,error);return null}
      return session||null
    }catch(error){
      console.error(`PADOKA settings ${context} transport:`,error);
      return null
    }
  }
  async function identityStillCurrent(epoch,userId){if(epoch!==lifecycleEpoch||!userId||activeUserId!==userId)return false;const session=await safeSession('identity check');return epoch===lifecycleEpoch&&activeUserId===userId&&session?.user?.id===userId}
  function fill(row){if(!row)return;if($('cfgOpen')&&row.open_time)$('cfgOpen').value=timeValue(row.open_time);if($('cfgClose')&&row.close_time)$('cfgClose').value=timeValue(row.close_time);if($('cfgNight')&&row.night_time)$('cfgNight').value=timeValue(row.night_time);if($('cfgPayment')&&row.payment_method&&paymentToUi[row.payment_method])$('cfgPayment').value=paymentToUi[row.payment_method];if($('cfgNote'))$('cfgNote').value=row.note||''}
  async function load(){
    const epoch=lifecycleEpoch,userId=activeUserId;
    if(!userId||!active)return false;
    if(!await identityStillCurrent(epoch,userId)){
      if(epoch===lifecycleEpoch&&activeUserId===userId)failClosedAndRetry(userId);
      return false
    }
    let response;
    try{response=await sb.rpc('padoka_get_settings')}
    catch(error){
      if(!await identityStillCurrent(epoch,userId))return false;
      console.error('PADOKA settings load transport:',error);
      blockLegacyFallback('Não foi possível carregar as configurações do servidor. Verifique a conexão e tente novamente.');
      return false
    }
    const {data,error}=response;
    if(!await identityStillCurrent(epoch,userId))return false;
    if(error){if(functionMissing(error)){blockLegacyFallback('Configurações do servidor ainda não estão disponíveis. O salvamento local foi bloqueado.');return false}console.error('PADOKA settings load:',error);blockLegacyFallback('Não foi possível carregar as configurações do servidor. O salvamento local foi bloqueado.');return false}
    fill(Array.isArray(data)?data[0]:data);setControlsEnabled(true);const btn=$('cfgSave');if(btn)btn.onclick=save;showState('Configurações sincronizadas com o servidor.',true);return true
  }
  async function save(){
    const epoch=lifecycleEpoch,userId=activeUserId;
    if(!active||!userId)return;
    const btn=$('cfgSave'),open=$('cfgOpen')?.value,close=$('cfgClose')?.value,night=$('cfgNight')?.value||null,payment=paymentToDb[$('cfgPayment')?.value]||null,note=$('cfgNote')?.value?.trim()||null;
    if(!open||!close)return toast('Informe abertura e fechamento.');if(open>=close)return toast('O fechamento precisa ser depois da abertura.');
    if(btn)btn.disabled=true;
    if(!await identityStillCurrent(epoch,userId)){
      if(epoch===lifecycleEpoch&&activeUserId===userId)failClosedAndRetry(userId);
      return
    }
    let response;
    try{response=await sb.rpc('padoka_update_settings',{p_open_time:open,p_close_time:close,p_night_time:night,p_payment_method:payment,p_note:note})}
    catch(error){
      if(!await identityStillCurrent(epoch,userId))return;
      if(btn)btn.disabled=false;
      console.error('PADOKA settings save transport:',error);
      toast('Falha de conexão. Tente salvar novamente.');
      return
    }
    const {data,error}=response;
    if(!await identityStillCurrent(epoch,userId))return;
    if(btn)btn.disabled=false;
    if(error){const msg=error.message||'';if(/permission/i.test(msg))return toast('Somente responsáveis autorizados podem alterar configurações.');if(/opening hours/i.test(msg))return toast('Revise os horários informados.');return toast('Não foi possível salvar as configurações.')}
    fill(Array.isArray(data)?data[0]:data);toast('Configurações salvas no servidor');showState('Configurações sincronizadas com o servidor.',true)
  }
  function subscribe(){
    const epoch=lifecycleEpoch,userId=activeUserId;
    if(channel||!active||!userId)return;
    channel=sb.channel('padoka-settings-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_settings'},()=>{if(epoch===lifecycleEpoch&&activeUserId===userId)load()}).subscribe()
  }
  async function waitForRole(expectedUserId,epoch){
    for(let n=0;n<100;n++){
      if(epoch!==lifecycleEpoch)return '';
      const role=String(window.padokaStaffRole||'').toLowerCase();
      const pending=document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending');
      const session=await safeSession('role check');
      if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId)return '';
      if(!pending&&role)return role;
      await new Promise(r=>setTimeout(r,100));
    }
    return ''
  }
  async function activateForUser(expectedUserId){
    const epoch=++lifecycleEpoch;
    activeUserId='';active=false;await clearChannel();blockLegacyFallback();
    if(!expectedUserId||!sb)return;
    const role=await waitForRole(expectedUserId,epoch);
    if(epoch!==lifecycleEpoch)return;
    if(!allowedRoles.has(role)){blockLegacyFallback('Somente responsáveis autorizados podem alterar configurações.');return}
    const session=await safeSession('activation');
    if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId){blockLegacyFallback('Não foi possível confirmar a sessão interna. Verifique a conexão e tente novamente.');return}
    activeUserId=expectedUserId;active=true;
    if(await load()&&epoch===lifecycleEpoch&&activeUserId===expectedUserId)subscribe()
  }
  function watchAuth(){
    if(authSubscription||!sb)return;
    const result=sb.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId===activeUserId&&event==='SIGNED_IN')return;
      resetForIdentityChange();
      if(nextUserId)setTimeout(()=>activateForUser(nextUserId),0)
    });
    authSubscription=result?.data?.subscription||null
  }
  async function start(){
    blockLegacyFallback('Confirmando sessão e permissões internas…');
    for(let n=0;n<100&&!window.padokaSupabase;n++)await new Promise(r=>setTimeout(r,100));
    sb=window.padokaSupabase;if(!sb)return;
    watchAuth();
    const session=await safeSession('startup');
    if(session?.user?.id)await activateForUser(session.user.id);else resetForIdentityChange('Não foi possível confirmar uma sessão interna autorizada. Verifique a conexão ou entre novamente.')
  }
  window.addEventListener('pagehide',()=>{resetForIdentityChange('Sessão interna encerrada.');try{authSubscription?.unsubscribe()}catch{}authSubscription=null},{once:true});
  start();
})();