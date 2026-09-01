(()=>{
  'use strict';

  const root=document.documentElement;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  root.classList.add('padoka-app');
  root.classList.toggle('padoka-standalone',standalone);

  const isAccountPage=location.pathname.endsWith('/conta.html')||location.pathname.endsWith('conta.html');
  if(isAccountPage)root.classList.add('padoka-auth-booting');

  function hasPersistedSessionHint(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i)||'';
        if(/^sb-.*-auth-token$/.test(key)&&localStorage.getItem(key))return true;
      }
    }catch{}
    return false;
  }

  function setupAccountBoot(){
    if(!isAccountPage)return;
    const boot=document.getElementById('sessionBoot');
    const login=document.getElementById('loginView');
    const onboarding=document.getElementById('onboardingView');
    const account=document.getElementById('accountView');
    if(!boot||!login||!onboarding||!account){
      root.classList.remove('padoka-auth-booting');
      return;
    }

    const copy=boot.querySelector('[data-padoka-auth-copy]');
    if(copy)copy.textContent=hasPersistedSessionHint()
      ? 'Abrindo sua conta sem pedir login novamente…'
      : 'Verificando sua sessão com segurança…';

    const views=[login,onboarding,account];
    let resolved=false;
    const finish=()=>{
      if(resolved)return;
      const visible=views.find(view=>!view.classList.contains('hidden'));
      if(!visible)return;
      resolved=true;
      root.classList.remove('padoka-auth-booting');
      boot.hidden=true;
      observer.disconnect();
    };

    const observer=new MutationObserver(finish);
    for(const view of views)observer.observe(view,{attributes:true,attributeFilter:['class']});
    finish();

    window.setTimeout(()=>{
      if(resolved)return;
      login.classList.remove('hidden');
      finish();
    },5000);
  }

  const onModeChange=event=>root.classList.toggle('padoka-standalone',event.matches);
  try{
    const query=window.matchMedia('(display-mode: standalone)');
    if(typeof query.addEventListener==='function')query.addEventListener('change',onModeChange);
  }catch{}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupAccountBoot,{once:true});
  else setupAccountBoot();

  window.PADOKA_APP=Object.freeze({
    standalone,
    installed:standalone
  });
})();