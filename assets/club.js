(()=>{
  'use strict';
  const CONFIG_URL='https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-public-config';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('pt-BR');
  const date=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
  let sb=null,user=null,settings=null,account=null,rewards=[],redemptions=[],ledger=[],selectedReward=null;

  function toast(text){
    const el=$('toast');if(!el)return;
    el.textContent=text;el.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2300);
  }
  function friendly(error){
    const m=String(error?.message||error||'').toLowerCase();
    if(m.includes('insufficient points'))return 'Você ainda não tem pontos suficientes para essa recompensa.';
    if(m.includes('out of stock'))return 'Essa recompensa está esgotada no momento.';
    if(m.includes('customer limit'))return 'Você já atingiu o limite dessa recompensa.';
    if(m.includes('not started'))return 'Essa recompensa ainda não está disponível.';
    if(m.includes('reward expired'))return 'Essa recompensa não está mais disponível.';
    if(m.includes('loyalty unavailable'))return 'O PADOKA Club está temporariamente pausado.';
    if(m.includes('redemption not found'))return 'Não encontramos esse resgate.';
    if(m.includes('permission'))return 'Sua sessão não permite essa operação.';
    return 'Não foi possível concluir agora. Tente novamente.';
  }
  function statusLabel(s){
    return {reserved:'Disponível',used:'Utilizado',cancelled:'Cancelado',expired:'Expirado'}[s]||'Resgate';
  }
  function rewardAvailable(r){
    const now=Date.now(),from=r.valid_from?new Date(r.valid_from).getTime():0,to=r.valid_until?new Date(r.valid_until).getTime():Infinity;
    const stock=r.stock_limit==null||Number(r.stock_redeemed||0)<Number(r.stock_limit);
    return r.active&&now>=from&&now<to&&stock;
  }
  function renderSummary(){
    const balance=Number(account?.points_balance||0),lifetime=Number(account?.lifetime_points||0);
    $('balance').innerHTML=num(balance)+' <small>pts</small>';
    $('lifetime').textContent=num(lifetime)+' acumulados';
    $('ratePerk').textContent=(Number(settings?.points_per_brl||1)).toLocaleString('pt-BR',{maximumFractionDigits:2})+' pt / R$ 1';
    $('firstBonusPerk').textContent='+'+num(settings?.first_order_bonus_points||0)+' pts';
    $('birthdayPerk').textContent=(Number(settings?.birthday_multiplier||1)).toLocaleString('pt-BR',{maximumFractionDigits:1})+'× pontos';

    const available=rewards.filter(rewardAvailable).sort((a,b)=>Number(a.points_cost)-Number(b.points_cost));
    const next=available.find(r=>Number(r.points_cost)>balance)||available[available.length-1]||null;
    if(!next){
      $('nextCopy').textContent='As recompensas aparecerão aqui quando estiverem disponíveis.';
      $('progressFill').style.width='0%';
      $('progressText').textContent='0%';
      return;
    }
    const cost=Number(next.points_cost||1);
    const pct=Math.max(0,Math.min(100,balance/cost*100));
    if(balance>=cost){
      $('nextCopy').textContent='Você já pode resgatar '+next.name+'.';
    }else{
      $('nextCopy').textContent='Faltam '+num(cost-balance)+' pontos para '+next.name+'.';
    }
    $('progressFill').style.width=pct.toFixed(1)+'%';
    $('progressText').textContent=Math.round(pct)+'%';
  }
  function renderCampaigns(campaigns){
    const now=Date.now();
    const active=(campaigns||[]).filter(c=>c.active&&new Date(c.starts_at).getTime()<=now&&new Date(c.ends_at).getTime()>now);
    const box=$('campaign');
    if(!active.length){box.classList.add('hidden');return}
    const c=active.sort((a,b)=>Number(b.multiplier)-Number(a.multiplier)||Number(b.bonus_points)-Number(a.bonus_points))[0];
    const extras=[];
    if(Number(c.multiplier)>1)extras.push(Number(c.multiplier).toLocaleString('pt-BR',{maximumFractionDigits:1})+'× pontos');
    if(Number(c.bonus_points)>0)extras.push('+'+num(c.bonus_points)+' pontos');
    if(Number(c.min_order_total)>0)extras.push('em pedidos a partir de R$ '+Number(c.min_order_total).toLocaleString('pt-BR',{minimumFractionDigits:2}));
    $('campaignTitle').textContent=c.name;
    $('campaignText').textContent=[c.description,extras.join(' • ')].filter(Boolean).join(' — ');
    box.classList.remove('hidden');
  }
  function renderRewards(){
    const balance=Number(account?.points_balance||0);
    const list=rewards.filter(r=>r.active).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)||Number(a.points_cost)-Number(b.points_cost));
    $('rewards').innerHTML=list.length?list.map(r=>{
      const available=rewardAvailable(r),cost=Number(r.points_cost||0),enough=balance>=cost;
      const remaining=r.stock_limit==null?'':Math.max(0,Number(r.stock_limit)-Number(r.stock_redeemed||0));
      const button=!available?'Indisponível':enough?'Resgatar agora':'Faltam '+num(cost-balance)+' pts';
      return '<article class="reward">'+
        '<span class="reward-badge">'+esc(r.badge||'PADOKA Club')+'</span>'+
        '<h3>'+esc(r.name)+'</h3><p>'+esc(r.description||'Recompensa exclusiva do PADOKA Club.')+'</p>'+
        '<div class="reward-bottom"><div class="cost">'+num(cost)+' <small>pontos</small></div>'+
        (r.stock_limit==null?'':'<div class="stock">'+num(remaining)+' disponível(is)</div>')+
        '<button type="button" data-reward="'+esc(r.id)+'" '+(!available||!enough?'disabled':'')+'>'+esc(button)+'</button></div>'+
      '</article>';
    }).join(''):'<div class="empty">Nenhuma recompensa disponível por enquanto.</div>';
    document.querySelectorAll('[data-reward]').forEach(btn=>btn.onclick=()=>openRedeem(btn.dataset.reward));
  }
  function renderRedemptions(){
    $('redemptions').innerHTML=redemptions.length?redemptions.map(r=>{
      const active=r.status==='reserved'&&new Date(r.expires_at).getTime()>Date.now();
      return '<article class="redemption '+(active?'active':'')+'">'+
        '<div class="redemption-top"><div><strong>'+esc(r.reward_name)+'</strong><div class="meta">'+num(r.points_spent)+' pontos</div></div>'+
        '<span class="status '+esc(r.status)+'">'+esc(statusLabel(r.status))+'</span></div>'+
        '<div class="code">'+esc(r.code)+'</div>'+
        '<div class="meta">'+(r.status==='reserved'?'Válido até '+esc(date(r.expires_at)):r.status==='used'?'Utilizado em '+esc(date(r.used_at)):'Criado em '+esc(date(r.created_at)))+'</div>'+
        '<div class="redemption-actions"><button type="button" data-copy="'+esc(r.code)+'">Copiar código</button>'+
        (active?'<button class="danger" type="button" data-cancel="'+esc(r.id)+'">Cancelar e devolver pontos</button>':'')+'</div>'+
      '</article>';
    }).join(''):'<div class="empty">Você ainda não resgatou nenhuma recompensa.</div>';
    document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=async()=>{
      try{await navigator.clipboard.writeText(btn.dataset.copy);toast('Código copiado.')}catch{toast('Código: '+btn.dataset.copy)}
    });
    document.querySelectorAll('[data-cancel]').forEach(btn=>btn.onclick=()=>cancelRedemption(btn.dataset.cancel));
  }
  function renderHistory(){
    $('history').innerHTML=ledger.length?ledger.map(x=>{
      const p=Number(x.points||0),cls=p>0?'plus':'minus';
      return '<div class="history-row"><div><strong>'+esc(x.description)+'</strong><small>'+esc(date(x.created_at))+' • saldo após: '+num(x.balance_after)+' pts</small></div>'+
        '<span class="points '+cls+'">'+(p>0?'+':'')+num(p)+'</span></div>';
    }).join(''):'<div class="empty">Seu histórico aparecerá depois das primeiras movimentações.</div>';
  }
  function openRedeem(id){
    selectedReward=rewards.find(r=>r.id===id)||null;if(!selectedReward)return;
    $('modalReward').textContent=selectedReward.name;
    $('modalText').textContent='O resgate desconta os pontos na hora e gera um código para apresentar na PADOKA. Se você cancelar antes de usar, os pontos voltam automaticamente.';
    $('modalCost').textContent=num(selectedReward.points_cost)+' pontos';
    $('redeemModal').classList.remove('hidden');
  }
  function closeRedeem(){selectedReward=null;$('redeemModal').classList.add('hidden')}
  async function confirmRedeem(){
    if(!selectedReward)return;
    const btn=$('confirmRedeem');btn.disabled=true;btn.textContent='Resgatando…';
    try{
      const {data,error}=await sb.rpc('padoka_redeem_reward',{p_reward_id:selectedReward.id});
      if(error)throw error;
      closeRedeem();
      toast('Recompensa resgatada! Código '+data.code);
      await loadData();
    }catch(e){console.error(e);toast(friendly(e))}
    finally{btn.disabled=false;btn.textContent='Confirmar resgate'}
  }
  async function cancelRedemption(id){
    if(!confirm('Cancelar este resgate? Os pontos voltarão ao seu saldo.'))return;
    try{
      const {error}=await sb.rpc('padoka_cancel_loyalty_redemption',{p_redemption_id:id});
      if(error)throw error;
      toast('Resgate cancelado e pontos devolvidos.');
      await loadData();
    }catch(e){console.error(e);toast(friendly(e))}
  }
  async function loadData(){
    const nowIso=new Date().toISOString();
    const [s,a,r,c,red,l]=await Promise.all([
      sb.from('padoka_loyalty_settings').select('id,enabled,points_per_brl,first_order_bonus_points,birthday_multiplier,redemption_valid_days,max_points_per_order,updated_at').eq('id',true).maybeSingle(),
      sb.from('padoka_loyalty_accounts').select('points_balance,lifetime_points,last_earned_at,last_redeemed_at').eq('user_id',user.id).maybeSingle(),
      sb.from('padoka_loyalty_rewards').select('id,name,description,points_cost,active,stock_limit,stock_redeemed,per_customer_limit,valid_from,valid_until,badge,sort_order').eq('active',true).order('sort_order'),
      sb.from('padoka_loyalty_campaigns').select('id,name,description,multiplier,bonus_points,min_order_total,starts_at,ends_at,active').eq('active',true).lt('starts_at',nowIso).gt('ends_at',nowIso),
      sb.from('padoka_loyalty_redemptions').select('id,reward_id,code,reward_name,points_spent,status,expires_at,used_at,cancelled_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
      sb.from('padoka_loyalty_ledger').select('id,entry_type,points,description,source,balance_after,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
    ]);
    for(const x of [s,a,r,c,red,l])if(x.error)throw x.error;
    settings=s.data||{enabled:true,points_per_brl:1,first_order_bonus_points:20,birthday_multiplier:2,redemption_valid_days:30};
    account=a.data||{points_balance:0,lifetime_points:0};
    rewards=r.data||[];redemptions=red.data||[];ledger=l.data||[];
    if(!settings.enabled){
      $('paused').classList.remove('hidden');
      $('rewardCard').classList.add('hidden');
    }else{
      $('paused').classList.add('hidden');
      $('rewardCard').classList.remove('hidden');
    }
    renderSummary();renderCampaigns(c.data||[]);renderRewards();renderRedemptions();renderHistory();
  }
  async function start(){
    try{
      const response=await fetch(CONFIG_URL,{cache:'no-store'});if(!response.ok)throw new Error('config');
      const cfg=await response.json();
      sb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
      window.padokaSupabase=sb;
      const {data:{session},error}=await sb.auth.getSession();if(error)throw error;
      if(!session){location.replace('conta.html');return}
      user=session.user;
      await loadData();
      $('loading').classList.add('hidden');$('content').classList.remove('hidden');
    }catch(e){
      console.error(e);
      $('loadingText').textContent='Não foi possível abrir o PADOKA Club agora. Tente novamente em instantes.';
    }
  }
  $('closeRedeem').onclick=closeRedeem;
  $('confirmRedeem').onclick=confirmRedeem;
  $('redeemModal').onclick=e=>{if(e.target===$('redeemModal'))closeRedeem()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeRedeem()});
  start();
})();