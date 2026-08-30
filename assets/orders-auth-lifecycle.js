(()=>{
  const isOrders=location.pathname.endsWith('/pedidos.html')||location.pathname.endsWith('pedidos.html');
  if(!isOrders)return;

  let activeUserId='';
  let lifecycleEpoch=0;

  document.documentElement.classList.add('padoka-orders-auth-transition');

  const waitForClient=async()=>{
    for(let i=0;i<80;i++){
      if(window.padokaSupabase)return window.padokaSupabase;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  };

  const safeSession=async client=>{
    try{
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      return data?.session||null;
    }catch(error){
      console.warn('PADOKA orders session check:',error);
      return null;
    }
  };

  const lockOrdersUi=async client=>{
    lifecycleEpoch+=1;
    document.documentElement.classList.add('padoka-orders-auth-transition');
    document.querySelectorAll('main button,main input,main select').forEach(el=>{el.disabled=true});
    try{await client.removeAllChannels()}catch(error){console.warn('PADOKA orders channel cleanup:',error)}
  };

  const revalidateIdentity=async(client,expectedUserId,epoch)=>{
    const session=await safeSession(client);
    if(epoch!==lifecycleEpoch||session?.user?.id!==expectedUserId)return;
    try{
      const {data:staff,error}=await client.from('padoka_staff_users').select('active').eq('user_id',expectedUserId).maybeSingle();
      if(epoch!==lifecycleEpoch)return;
      const latestSession=await safeSession(client);
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
    try{
      const client=await waitForClient();
      if(!client)return;
      const session=await safeSession(client);
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
      if(!activeUserId){
        location.replace('internal.html');
        return;
      }
      const initialUserId=activeUserId;
      const initialPreflightSession=await safeSession(client);
      if(initialPreflightSession?.user?.id!==initialUserId||activeUserId!==initialUserId){
        document.documentElement.classList.add('padoka-orders-auth-transition');
        return;
      }
      const {data:initialStaff,error:initialStaffError}=await client.from('padoka_staff_users').select('active').eq('user_id',initialUserId).maybeSingle();
      const latestInitialSession=await safeSession(client);
      if(latestInitialSession?.user?.id!==initialUserId||activeUserId!==initialUserId){
        document.documentElement.classList.add('padoka-orders-auth-transition');
        return;
      }
      if(initialStaffError||!initialStaff?.active){
        location.replace('internal.html');
        return;
      }
      document.documentElement.classList.remove('padoka-orders-auth-transition');
    }catch(error){
      console.warn('PADOKA orders initial auth check:',error);
      document.documentElement.classList.add('padoka-orders-auth-transition');
      location.replace('internal.html');
    }
  };

  void start();
})();
