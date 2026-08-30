(()=>{
  const ENDPOINT='https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-telemetry';
  const KEY='padoka_telemetry_session_v1';
  const allowed=new Set(['page_view','product_view','add_to_cart','remove_from_cart','checkout_start','checkout_review','checkout_submit','checkout_success','auth_login','order_view','client_error','web_vital','feature_exposure','reorder']);
  let sessionId='';
  try{
    sessionId=sessionStorage.getItem(KEY)||'';
    if(!/^[0-9a-f-]{36}$/i.test(sessionId)){sessionId=crypto.randomUUID();sessionStorage.setItem(KEY,sessionId)}
  }catch{sessionId=crypto.randomUUID()}
  const page=()=>location.pathname||'/';
  const cleanMeta=input=>{
    const out={},keys=['metric','rating','element','error_name','error_message','connection','device','version','product_id','order_stage'];
    for(const k of keys){
      if(input&&input[k]!=null){
        let v=String(input[k]).slice(0,k==='error_message'?240:100);
        v=v.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/g,'[phone]').replace(/[?#].*$/,'');
        if(v)out[k]=v;
      }
    }
    return out;
  };
  function track(eventName,metadata={},metricValue=null){
    if(!allowed.has(eventName))return;
    const n=metricValue==null?null:Number(metricValue);
    if(n!=null&&!Number.isFinite(n))return;
    const body=JSON.stringify({session_id:sessionId,event_name:eventName,page:page(),metric_value:n,metadata:cleanMeta(metadata)});
    try{fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true,cache:'no-store',credentials:'omit'}).catch(()=>{})}catch{}
  }
  window.PADOKA_TELEMETRY={track,sessionId};

  track('page_view',{device:matchMedia('(pointer:coarse)').matches?'touch':'pointer',connection:navigator.connection?.effectiveType||''});

  addEventListener('error',event=>{
    const target=event.target;
    if(target&&target!==window){
      const tag=String(target.tagName||'resource').toLowerCase();
      const src=target.currentSrc||target.src||target.href||'';
      track('client_error',{error_name:'resource_error',error_message:tag+': '+String(src).split('?')[0]});
      return;
    }
    track('client_error',{error_name:event.error?.name||'Error',error_message:event.message||'Erro de JavaScript'});
  },true);
  addEventListener('unhandledrejection',event=>{
    const reason=event.reason;
    track('client_error',{error_name:reason?.name||'UnhandledRejection',error_message:reason?.message||String(reason||'Promise rejeitada')});
  });

  document.addEventListener('click',event=>{
    const el=event.target?.closest?.('[data-add],#checkout,#continue,#sendOrder,[data-reorder],[data-product-link]');
    if(!el)return;
    if(el.matches('[data-add]'))track('add_to_cart',{product_id:el.getAttribute('data-add')||''});
    else if(el.id==='checkout')track('checkout_start');
    else if(el.id==='continue')track('checkout_review');
    else if(el.id==='sendOrder')track('checkout_submit');
    else if(el.hasAttribute('data-reorder'))track('reorder');
    else if(el.hasAttribute('data-product-link'))track('product_view',{product_id:el.getAttribute('data-product-link')||''});
  },{capture:true,passive:true});

  const vitals={LCP:null,CLS:0,INP:null};
  const rating=(metric,value)=>{
    if(metric==='LCP')return value<=2500?'good':value<=4000?'needs-improvement':'poor';
    if(metric==='INP')return value<=200?'good':value<=500?'needs-improvement':'poor';
    if(metric==='CLS')return value<=0.1?'good':value<=0.25?'needs-improvement':'poor';
    return '';
  };
  try{
    new PerformanceObserver(list=>{for(const e of list.getEntries())vitals.LCP=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
  }catch{}
  try{
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)vitals.CLS+=e.value}).observe({type:'layout-shift',buffered:true});
  }catch{}
  try{
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.duration&&(vitals.INP==null||e.duration>vitals.INP))vitals.INP=e.duration}).observe({type:'event',durationThreshold:40,buffered:true});
  }catch{}
  let sent=false;
  function sendVitals(){
    if(sent)return;sent=true;
    for(const metric of ['LCP','INP','CLS']){
      const value=vitals[metric];
      if(value==null)continue;
      track('web_vital',{metric,rating:rating(metric,value),connection:navigator.connection?.effectiveType||''},metric==='CLS'?Number(value.toFixed(4)):Math.round(value));
    }
  }
  addEventListener('pagehide',sendVitals,{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sendVitals()},{once:true});
})();