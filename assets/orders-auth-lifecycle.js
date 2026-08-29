(()=>{
  const isOrders=location.pathname.endsWith('/pedidos.html')||location.pathname.endsWith('pedidos.html');
  if(!isOrders)return;

  let activeUserId='';
  let lifecycleEpoch=0;

  const style=document.createElement('style');
  style.id='padokaOrdersAuthLifecycleStyle';
  style.textContent='.padoka-orders-auth-transition body>main{visibility:hidden!important;pointer-events:none!important}';
  document.head.appendChild(style);

  const waitForClient=async()=>{
    for(let i=0;i<80;i++){
      if(window.padokaSupabase)return window.padokaSupabase;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  };

  const lockOrdersUi=async client=>{
    lifecycleEpoch+=1;
    document.documentElement.classList.add('padoka-orders-auth-transition');
    document.querySelectorAll('main button,main input,main select').forEach(el=>{el.disabled=true});
    try{await client.removeAllChannels()}catch(error){console.warn('PADOKA orders channel cleanup:',error)}
  };

  const revalidateIdentity=async(client,expectedUserId,epoch)=>{
    try{
      const {data:{session}}=await client.auth.getSession();
      if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId)return;
      const {data:staff,error}=await client.from('padoka_staff_users').select('active').eq('user_id',expectedUserId).maybeSingle();
      if(epoch!==lifecycleEpoch)return;
      const {data:{session:latestSession}}=await client.auth.getSession();
      if(epoch!==lifecycleEpoch||latestSession?.user?.id!==expectedUserId)return;
      if(error||!staff?.active){
        location.replace('internal.html');
        return;
      }
      location.reload();
    }catch(error){
      if(epoch!==lifecycleEpoch)return;
      console.warn('PADOKA orders auth lifecycle:',error);
      location.replace('internal.html');
    }
  };

  const start=async()=>{
    const client=await waitForClient();
    if(!client){
      document.documentElement.classList.add('padoka-orders-auth-transition');
      return;
    }
    const {data:{session}}=await client.auth.getSession();
    activeUserId=session?.user?.id||'';
    client.auth.onAuthStateChange((event,nextSession)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=nextSession?.user?.id||'';
      if(event==='SIGNED_IN'&&nextUserId===activeUserId)return;
      const previousUserId=activeUserId;
      activeUserId=nextUserId;
      if(nextUserId===previousUserId)return;
      void lockOrdersUi(client).then(()=>{
        const epoch=lifecycleEpoch;
        if(!nextUserId){
          if(epoch===lifecycleEpoch)location.replace('internal.html');
          return;
        }
        setTimeout(()=>revalidateIdentity(client,nextUserId,epoch),0);
      });
    });
  };

  void start();
})();
