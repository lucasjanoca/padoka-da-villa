(() => {
  'use strict';

  const STYLE_ID='padokaCustomerNotificationsStyle';
  const ROOT_ID='padokaCustomerNotifications';
  let client=null, session=null, channel=null, authSub=null, root=null, listEl=null, badgeEl=null, panelEl=null;

  const escDate=value=>{
    if(!value)return '';
    try{return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch{return '';}
  };

  function styles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent='.padoka-notify{position:fixed;right:12px;top:78px;z-index:92;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}.padoka-notify-btn{width:46px;height:46px;border:1px solid #dfd1c3;border-radius:15px;background:#fffdf9;color:#17130f;box-shadow:0 12px 34px #27180f24;display:grid;place-items:center;font-size:20px;cursor:pointer;position:relative}.padoka-notify-badge{position:absolute;right:-5px;top:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#9b453a;color:#fff;border:2px solid #fff;font:900 9px/15px Inter,system-ui,sans-serif;display:grid;place-items:center}.padoka-notify-badge[hidden]{display:none}.padoka-notify-panel{position:absolute;right:0;top:54px;width:min(360px,calc(100vw - 24px));max-height:min(520px,70vh);overflow:hidden;background:#fffdf9;border:1px solid #dfd1c3;border-radius:20px;box-shadow:0 22px 60px #25170e35}.padoka-notify-panel[hidden]{display:none}.padoka-notify-head{padding:14px 14px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #eee4da}.padoka-notify-head strong{font-size:12px}.padoka-notify-read{border:0;background:#eee5dc;border-radius:10px;padding:7px 9px;font:850 9px/1 Inter,system-ui,sans-serif;cursor:pointer}.padoka-notify-list{overflow:auto;max-height:min(450px,60vh)}.padoka-notify-item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #f0e8e1;background:#fffdf9;padding:12px 14px;cursor:pointer}.padoka-notify-item.unread{background:#fff7e9}.padoka-notify-item strong{display:block;font-size:10.5px;color:#17130f}.padoka-notify-item span{display:block;margin-top:4px;font-size:9.5px;line-height:1.4;color:#776e65}.padoka-notify-item small{display:block;margin-top:6px;font-size:8px;color:#9b8f84}.padoka-notify-empty{padding:24px 14px;text-align:center;color:#776e65;font-size:10px}.padoka-notify[hidden]{display:none}@media(max-width:520px){.padoka-notify{right:10px;top:72px}.padoka-notify-panel{position:fixed;left:10px;right:10px;top:126px;width:auto}}';
    document.head.appendChild(s);
  }

  function build(){
    if(root)return;
    styles();
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
      if(next)load();
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

  function render(rows){
    if(!listEl)return;
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
        if(!row.read_at)await markOneRead(row.id);
        location.href='acompanhamento.html';
      });
      listEl.appendChild(button);
    }
  }

  async function load(){
    if(!client||!session?.user)return;
    const {data,error}=await client.from('padoka_customer_notifications')
      .select('id,order_id,title,body,read_at,created_at')
      .eq('user_id',session.user.id)
      .order('created_at',{ascending:false})
      .limit(30);
    if(error){console.error('Falha ao carregar notificações PADOKA',error);return;}
    render(data||[]);
  }

  async function markOneRead(id){
    if(!client||!session?.user||!id)return;
    const {error}=await client.from('padoka_customer_notifications')
      .update({read_at:new Date().toISOString()})
      .eq('id',id)
      .eq('user_id',session.user.id)
      .is('read_at',null);
    if(error)console.error('Falha ao marcar notificação como lida',error);
    await load();
  }

  async function markAllRead(){
    if(!client||!session?.user)return;
    const {error}=await client.from('padoka_customer_notifications')
      .update({read_at:new Date().toISOString()})
      .eq('user_id',session.user.id)
      .is('read_at',null);
    if(error)console.error('Falha ao marcar notificações como lidas',error);
    await load();
  }

  async function setSession(next){
    session=next||null;
    if(channel&&client){try{await client.removeChannel(channel);}catch{} channel=null;}
    build();
    root.hidden=!session?.user;
    if(!session?.user){render([]);return;}
    await load();
    const userId=session.user.id;
    channel=client.channel('padoka-customer-notifications-'+userId)
      .on('postgres_changes',{event:'*',schema:'public',table:'padoka_customer_notifications',filter:'user_id=eq.'+userId},()=>load())
      .subscribe();
  }

  async function bind(nextClient){
    if(!nextClient||client===nextClient)return;
    client=nextClient;
    const {data:{session:current}}=await client.auth.getSession();
    await setSession(current);
    const {data}=client.auth.onAuthStateChange((_event,nextSession)=>setTimeout(()=>setSession(nextSession),0));
    authSub=data?.subscription||null;
  }

  window.addEventListener('padoka:supabase-ready',event=>bind(event.detail?.client||window.padokaSupabase));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&session?.user)load();});
  window.addEventListener('pagehide',()=>{authSub?.unsubscribe();if(channel&&client)client.removeChannel(channel);});
  document.addEventListener('DOMContentLoaded',()=>{build();if(window.padokaSupabase)bind(window.padokaSupabase);});
})();