(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let baselineUserId=null;
  let transitionEpoch=0;

  async function waitForClient(){
    for(let i=0;i<80;i++){
      if(window.padokaSupabase)return window.padokaSupabase;
      await sleep(100);
    }
    return null;
  }

  function clearStaffManagementUi(client){
    transitionEpoch+=1;
    document.documentElement.classList.add('padoka-staff-pending','padoka-role-pending');

    document.querySelector('[data-panel="equipe"]')?.remove();
    document.querySelector('.tabs a[href="?tab=equipe"]')?.remove();
    document.querySelector('.padoka-nav-list [data-padoka-module="equipe"]')?.remove();

    try{
      const staffChannel=(client.getChannels?.()||[]).find(channel=>
        String(channel?.topic||'').includes('padoka-staff-management-ui')
      );
      if(staffChannel)void client.removeChannel(staffChannel);
    }catch(error){
      console.warn('PADOKA staff lifecycle channel cleanup:',error);
    }
  }

  async function safeSession(client){
    try{
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      return data?.session||null;
    }catch(error){
      console.warn('PADOKA staff lifecycle session:',error);
      return null;
    }
  }

  async function init(){
    const client=await waitForClient();
    if(!client)return;

    const epoch=transitionEpoch;
    const session=await safeSession(client);
    if(epoch!==transitionEpoch)return;
    if(!session?.user?.id){
      clearStaffManagementUi(client);
      return;
    }
    baselineUserId=session.user.id;

    client.auth.onAuthStateChange((event,nextSession)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=nextSession?.user?.id||'';
      if(baselineUserId!==null&&nextUserId===baselineUserId)return;

      clearStaffManagementUi(client);
      baselineUserId=nextUserId;

      if(!nextUserId){
        location.replace('internal.html');
        return;
      }

      // Recarrega a Gestão para que todos os módulos internos sejam montados
      // novamente somente depois da validação da nova identidade pelo guard central.
      location.replace(location.href);
    });
  }

  init();
})();
