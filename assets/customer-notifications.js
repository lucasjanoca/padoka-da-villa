(() => {
  'use strict';

  const ROOT_ID='padokaCustomerNotifications';
  let client=null, session=null, channel=null, authSub=null, root=null, listEl=null, badgeEl=null, panelEl=null;
  let lifecycleEpoch=0, activeUserId='';

  const escDate=value=>{
    if(!value)return '';
    try{return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch{return '';}
  };

  function lifecycleCurrent(epoch,userId){
    return epoch===lifecycleEpoch&&Boolean(userId)&&activeUserId===userId&&session?.user?.id===userId;
  }

  async function safeSession(){
    if(!client)return null;
    try{
      const {data,error}=await client.auth.getSession();
      if(error){console.error('Falha ao confirmar sessão das notificações PADOKA',error);return null;}
      return data?.session||null;
    }catch(error){
      console.error('Falha de rede ao confirmar sessão das notificações PADOKA',error);
      return null;
    }
  }

  async function sessionStillCurrent(epoch,userId){
    if(!lifecycleCurrent(epoch,userId))return false;
    const current=await safeSession();
    return lifecycleCurrent(epoch,userId)&&current?.user?.id===userId;
  }

  function build(){
    if(root)return;
    root=document.createElement('aside');
    root.id=ROOT_ID;
    root.className='padoka-notify';
    root.hidden=true;
    root.innerHTML='<button class="padoka-notify-btn" type="button" aria-label="Abrir notificações" aria-expanded="false">🔔<span class="padoka-notify-badge" hidden></span></button><section class="padoka-notify-panel" hidden aria-label="Central de notificações"><div class="padoka-notify-head"><strong>Notificações</strong><button class="padoka-notify-read" type="button">Marcar lidas</button></div><div class="padoka-notify-list"></div></section>';
    document.body.appendChild(root);
    badgeEl=root.querySelector('.padoka-notify-badge');
    panelEl=root.querySelector('.padoka-notify-panel');
    listEl=root.querySelector('.padoka-notify-list');
    const btn=root.querySelector('.padoka-notify-btn');
    btn.addEventListener('click',()=>{
      const next=panelEl.hidden;
      panelEl.hidden=!next;
      btn.setAttribute('aria-expanded',String(next));
      if(next)load(lifecycleEpoch,activeUserId);
    });
    root.querySelector('.padoka-notify-read').addEventListener('click',markAllRead);
    document.addEventListener('click',event=>{
      if(!root||root.hidden||panelEl.hidden||root.contains(event.target))return;
      panelEl.hidden=true;
      btn.setAttribute('aria-expanded','false');
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&panelEl&&!panelEl.hidden){
        panelEl.hidden=true;
        btn.setAttribute('aria-expanded','false');
      }
    });
  }

  function render(rows,epoch=lifecycleEpoch,userId=activeUserId){
    if(!listEl||!lifecycleCurrent(epoch,userId))return;
    listEl.replaceChildren();
    const unread=(rows||[]).filter(row=>!row.read_at).length;
    badgeEl.textContent=unread>99?'99+':String(unread);
    badgeEl.hidden=unread===0;
    if(!rows?.length){
      const empty=document.createElement('div');
      empty.className='padoka-notify-empty';
      empty.textContent='Nenhuma notificação por enquanto.';
      listEl.appendChild(empty);
      return;
    }
    for(const row of rows){
      const button=document.createElement('button');
      button.type='button';
      button.className='padoka-notify-item'+(row.read_at?'':' unread');
      const title=document.createElement('strong');
      title.textContent=row.title||'Atualização do pedido';
      const body=document.createElement('span');
      body.textContent=row.body||'Seu pedido recebeu uma atualização.';
      const time=document.createElement('small');
      time.textContent=escDate(row.created_at);
      button.append(title,body,time);
      button.addEventListener('click',async()=>{
        if(!lifecycleCurrent(epoch,userId))return;
        const ok=row.read_at?await sessionStillCurrent(epoch,userId):await markOneRead(row.id,epoch,userId);
        if(ok&&lifecycleCurrent(epoch,userId))location.href='acompanhamento.html';
      });
      listEl.appendChild(button);
    }
  }

  function renderEmpty(){
    if(!listEl)return;
    listEl.replaceChildren();
    if(badgeEl){badgeEl.textContent='0';badgeEl.hidden=true;}
  }

  async function load(epoch=lifecycleEpoch,userId=activeUserId){
    if(!client||!lifecycleCurrent(epoch,userId))return false;
    if(!await sessionStillCurrent(epoch,userId))return false;
    const {data,error}=await client.from('padoka_customer_notifications')
      .select('id,order_id,title,body,read_at,created_at')
      .eq('user_id',userId)
      .order('created_at',{ascending:false})
      .limit(30);
    if(!await sessionStillCurrent(epoch,userId))return false;
    if(error){console.error('Falha ao carregar notificações PADOKA',error);return false;}
    render(data||[],epoch,userId);
    return true;
  }

  async function markOneRead(id,epoch=lifecycleEpoch,userId=activeUserId){
    if(!client||!id||!lifecycleCurrent(epoch,userId))return false;
    if(!await sessionStillCurrent(epoch,userId))return false;
    const {error}=await client.rpc('padoka_mark_customer_notifications_read',{p_notification_id:id});
    if(!await sessionStillCurrent(epoch,userId))return false;
    if(error){console.error('Falha ao marcar notificação como lida',error);return false;}
    await load(epoch,userId);
    return lifecycleCurrent(epoch,userId);
  }

  async function markAllRead(){
    const epoch=lifecycleEpoch;
    const userId=activeUserId;
    if(!client||!lifecycleCurrent(epoch,userId))return false;
    if(!await sessionStillCurrent(epoch,userId))return false;
    const {error}=await client.rpc('padoka_mark_customer_notifications_read',{p_notification_id:null});
    if(!await sessionStillCurrent(epoch,userId))return false;
    if(error){console.error('Falha ao marcar notificações como lidas',error);return false;}
    await load(epoch,userId);
    return lifecycleCurrent(epoch,userId);
  }

  async function setSession(next){
    const epoch=++lifecycleEpoch;
    const userId=next?.user?.id||'';
    activeUserId=userId;
    session=next||null;
    build();
    root.hidden=true;
    panelEl.hidden=true;
    root.querySelector('.padoka-notify-btn')?.setAttribute('aria-expanded','false');
    renderEmpty();

    const previousChannel=channel;
    channel=null;
    if(previousChannel&&client){try{await client.removeChannel(previousChannel);}catch{}}
    if(epoch!==lifecycleEpoch||activeUserId!==userId)return;
    if(!userId)return;

    const current=await safeSession();
    if(epoch!==lifecycleEpoch||activeUserId!==userId||current?.user?.id!==userId)return;
    session=current;
    root.hidden=false;
    await load(epoch,userId);
    if(!await sessionStillCurrent(epoch,userId))return;

    const nextChannel=client.channel('padoka-customer-notifications-'+userId)
      .on('postgres_changes',{event:'*',schema:'public',table:'padoka_customer_notifications',filter:'user_id=eq.'+userId},()=>{
        if(lifecycleCurrent(epoch,userId))load(epoch,userId);
      })
      .subscribe();
    if(!lifecycleCurrent(epoch,userId)){
      try{await client.removeChannel(nextChannel);}catch{}
      return;
    }
    channel=nextChannel;
  }

  async function bind(nextClient){
    if(!nextClient||client===nextClient)return;
    client=nextClient;
    const current=await safeSession();
    await setSession(current);
    const {data}=client.auth.onAuthStateChange((_event,nextSession)=>setTimeout(()=>setSession(nextSession),0));
    authSub=data?.subscription||null;
  }

  window.addEventListener('padoka:supabase-ready',event=>bind(event.detail?.client||window.padokaSupabase));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&activeUserId)load(lifecycleEpoch,activeUserId);
  });
  window.addEventListener('pagehide',()=>{
    lifecycleEpoch++;
    activeUserId='';
    session=null;
    authSub?.unsubscribe();
    if(channel&&client)client.removeChannel(channel);
    channel=null;
    renderEmpty();
  });
  document.addEventListener('DOMContentLoaded',()=>{build();if(window.padokaSupabase)bind(window.padokaSupabase);});
})();