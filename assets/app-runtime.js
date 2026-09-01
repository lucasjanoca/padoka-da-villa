(()=>{
  'use strict';

  const nativeFetch=window.fetch.bind(window);
  const PADOKA_PROJECT_REF='yncspxfsvlqdnodlsosb';
  const PADOKA_ORIGIN=`https://${PADOKA_PROJECT_REF}.supabase.co`;
  const PADOKA_AUTH_STORAGE_KEY=`sb-${PADOKA_PROJECT_REF}-auth-token`;
  const PUBLIC_CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config';
  const PUBLIC_CONFIG_CACHE='padoka_public_config_v1';
  const PUBLIC_CONFIG_MAX_AGE=24*60*60*1000;
  let configRefresh=null;

  function validPublicConfig(value){
    if(!value||typeof value!=='object')return false;
    try{
      const url=new URL(String(value.url||''));
      return url.origin===PADOKA_ORIGIN&&typeof value.publishableKey==='string'&&value.publishableKey.length>20;
    }catch{return false}
  }

  function readPublicConfig(){
    try{
      const parsed=JSON.parse(localStorage.getItem(PUBLIC_CONFIG_CACHE)||'null');
      if(!parsed||!validPublicConfig(parsed.value))return null;
      if(Date.now()-Number(parsed.savedAt||0)>PUBLIC_CONFIG_MAX_AGE)return null;
      return parsed.value;
    }catch{return null}
  }

  async function refreshPublicConfig(){
    if(configRefresh)return configRefresh;
    configRefresh=(async()=>{
      const response=await nativeFetch(PUBLIC_CONFIG_URL,{cache:'no-store',credentials:'omit'});
      if(!response.ok)throw new Error('PADOKA public config unavailable');
      const value=await response.json();
      if(!validPublicConfig(value))throw new Error('PADOKA public config invalid');
      try{localStorage.setItem(PUBLIC_CONFIG_CACHE,JSON.stringify({savedAt:Date.now(),value}))}catch{}
      return value;
    })();
    try{return await configRefresh}finally{configRefresh=null}
  }

  async function getPublicConfig(){
    const cached=readPublicConfig();
    if(cached){
      refreshPublicConfig().catch(()=>{});
      return cached;
    }
    return refreshPublicConfig();
  }

  window.fetch=(input,init={})=>{
    let url='';
    try{url=typeof input==='string'?new URL(input,location.href).href:new URL(input.url,location.href).href}catch{}
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(url===PUBLIC_CONFIG_URL&&method==='GET'){
      const cached=readPublicConfig();
      if(cached){
        refreshPublicConfig().catch(()=>{});
        return Promise.resolve(new Response(JSON.stringify(cached),{
          status:200,
          headers:{'content-type':'application/json','cache-control':'no-store'}
        }));
      }
    }
    return nativeFetch(input,init);
  };

  const root=document.documentElement;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  root.classList.add('padoka-app');
  root.classList.toggle('padoka-standalone',standalone);
  if(standalone&&navigator.storage&&typeof navigator.storage.persist==='function'){
    navigator.storage.persist().catch(()=>{});
  }

  const isAccountPage=location.pathname.endsWith('/conta.html')||location.pathname.endsWith('conta.html');
  if(isAccountPage)root.classList.add('padoka-auth-booting');

  function hasPersistedSessionHint(){
    try{return !!localStorage.getItem(PADOKA_AUTH_STORAGE_KEY)}catch{return false}
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

  window.PADOKA_RUNTIME=Object.freeze({
    getPublicConfig,
    refreshPublicConfig,
    standalone
  });
  window.PADOKA_APP=Object.freeze({
    standalone,
    installed:standalone
  });
})();