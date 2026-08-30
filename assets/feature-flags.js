(()=>{
  const CONFIG_URL='https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-public-config';
  window.PADOKA_FLAGS=Object.freeze({});
  window.PADOKA_FLAG_CONFIG=Object.freeze({});
  const apply=()=>{
    document.querySelectorAll('[data-feature]').forEach(el=>{
      const key=el.getAttribute('data-feature')||'';
      el.hidden=!window.PADOKA_FLAGS[key];
    });
  };
  async function load(){
    try{
      const r=await fetch(CONFIG_URL,{cache:'no-store'});
      if(!r.ok)throw new Error('config unavailable');
      const cfg=await r.json();
      const url=cfg.url+'/rest/v1/padoka_feature_flags?select=key,enabled,config&audience=eq.public';
      const f=await fetch(url,{cache:'no-store',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+cfg.publishableKey}});
      if(!f.ok)throw new Error('flags unavailable');
      const rows=await f.json(),flags={},config={};
      for(const row of rows||[]){flags[row.key]=row.enabled===true;config[row.key]=row.config||{}}
      window.PADOKA_FLAGS=Object.freeze(flags);
      window.PADOKA_FLAG_CONFIG=Object.freeze(config);
    }catch(error){
      console.warn('PADOKA feature flags fail-closed:',error);
    }finally{
      apply();
      dispatchEvent(new CustomEvent('padoka:flags-ready',{detail:{flags:window.PADOKA_FLAGS}}));
    }
  }
  window.PADOKA_FEATURES={enabled:key=>window.PADOKA_FLAGS[key]===true,config:key=>window.PADOKA_FLAG_CONFIG[key]||{},apply};
  load();
})();