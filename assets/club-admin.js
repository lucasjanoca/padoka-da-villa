(()=>{
'use strict';
const CONFIG_URL='https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-public-config';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=v=>Number(v||0).toLocaleString('pt-BR'),date=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
let sb=null,role='',rewards=[],campaigns=[],selectedCustomer=null,lookupData=null;

function notice(id,text,type=''){const e=$(id);if(!e)return;e.className='notice'+(type?' '+type:'');e.textContent=text}
function pill(s){const cls=s==='used'||s==='ativo'?'ok':s==='reserved'||s==='pendente'?'warn':s==='cancelled'||s==='expired'||s==='inativo'?'danger':'';return '<span class="pill '+cls+'">'+esc(s)+'</span>'}
function friendly(e){const m=String(e?.message||e||'').toLowerCase();if(m.includes('mfa'))return 'Essa operação exige MFA.';if(m.includes('permission'))return 'Sua conta não tem permissão para isso.';if(m.includes('not found'))return 'Registro não encontrado.';if(m.includes('expired'))return 'Este resgate expirou.';if(m.includes('not available'))return 'Este resgate não está disponível.';return 'Não foi possível concluir a operação.'}
function toLocal(v){if(!v)return'';const d=new Date(v);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function fromLocal(v){return v?new Date(v).toISOString():null}

async function validate(){
  const {data:{session},error}=await sb.auth.getSession();if(error||!session)return null;
  const {data:staff,error:sErr}=await sb.from('padoka_staff_users').select('role,active').eq('user_id',session.user.id).maybeSingle();
  if(sErr||!staff?.active)return null;
  const r=String(staff.role||'').toLowerCase();if(!['owner','manager','cashier','attendant'].includes(r))return null;
  if(['owner','manager'].includes(r)){const {data:aal,error:aErr}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(aErr)throw aErr;if(aal?.currentLevel!=='aal2'){location.replace('mfa.html?return=club-admin.html');return null}}
  return r;
}
async function lookup(){
  const code=$('codeInput').value.trim().toUpperCase();if(!code)return notice('counterNotice','Digite o código do resgate.','error');
  try{
    const {data,error}=await sb.rpc('padoka_admin_lookup_loyalty_code',{p_code:code});if(error)throw error;lookupData=data;renderLookup(data);notice('counterNotice','Código localizado.','ok');
  }catch(e){lookupData=null;$('lookupResult').innerHTML='<div class="empty">Nenhum resgate carregado.</div>';notice('counterNotice',friendly(e),'error')}
}
function renderLookup(d){
  $('lookupResult').innerHTML='<div class="lookup"><div class="section-head"><div><strong>'+esc(d.customer_name||'Cliente')+'</strong><small>'+esc(d.reward_name)+' • '+num(d.points_spent)+' pontos</small></div>'+pill(d.status)+'</div><div class="lookup-code">'+esc(d.code)+'</div><small>Criado em '+esc(date(d.created_at))+' • expira em '+esc(date(d.expires_at))+'</small><div class="lookup-actions">'+(d.status==='reserved'?'<button class="btn ok" id="useCode" type="button">Confirmar uso</button><button class="btn danger" id="cancelCode" type="button">Cancelar e estornar</button>':'')+'</div></div>';
  if($('useCode'))$('useCode').onclick=()=>processCode('use');
  if($('cancelCode'))$('cancelCode').onclick=()=>processCode('cancel');
}
async function processCode(action){
  if(!lookupData)return;
  if(action==='use'&&!confirm('Confirmar que a recompensa foi entregue ao cliente?'))return;
  if(action==='cancel'&&!confirm('Cancelar o resgate e devolver os pontos ao cliente?'))return;
  try{const {data,error}=await sb.rpc('padoka_admin_process_loyalty_code',{p_code:lookupData.code,p_action:action});if(error)throw error;notice('counterNotice',data?.status==='expired'?'Resgate expirado; pontos devolvidos.':action==='use'?'Recompensa confirmada como utilizada.':'Resgate cancelado e pontos devolvidos.','ok');await lookup();if(['owner','manager'].includes(role))await loadManager()}
  catch(e){notice('counterNotice',friendly(e),'error')}
}

async function loadManager(){
  const [s,a,r,c,red]=await Promise.all([
    sb.from('padoka_loyalty_settings').select('id,enabled,points_per_brl,first_order_bonus_points,birthday_multiplier,redemption_valid_days,max_points_per_order,updated_at').eq('id',true).maybeSingle(),
    sb.from('padoka_loyalty_accounts').select('points_balance,lifetime_points'),
    sb.from('padoka_loyalty_rewards').select('id,name,description,points_cost,active,stock_limit,stock_redeemed,per_customer_limit,valid_from,valid_until,badge,sort_order,created_at,updated_at').order('sort_order'),
    sb.from('padoka_loyalty_campaigns').select('id,name,description,multiplier,bonus_points,min_order_total,starts_at,ends_at,active,created_at,updated_at').order('created_at',{ascending:false}),
    sb.from('padoka_loyalty_redemptions').select('id,code,reward_name,points_spent,status,expires_at,created_at').order('created_at',{ascending:false}).limit(30)
  ]);
  for(const x of [s,a,r,c,red])if(x.error)throw x.error;
  const accounts=a.data||[];rewards=r.data||[];campaigns=c.data||[];
  $('sCustomers').textContent=num(accounts.length);$('sBalance').textContent=num(accounts.reduce((z,x)=>z+Number(x.points_balance||0),0));$('sLifetime').textContent=num(accounts.reduce((z,x)=>z+Number(x.lifetime_points||0),0));$('sReserved').textContent=num((red.data||[]).filter(x=>x.status==='reserved').length);
  fillSettings(s.data||{});renderRewards();renderCampaigns();renderRecent(red.data||[]);
}
function fillSettings(s){$('setEnabled').value=String(!!s.enabled);$('setRate').value=s.points_per_brl??1;$('setFirst').value=s.first_order_bonus_points??20;$('setBirthday').value=s.birthday_multiplier??2;$('setDays').value=s.redemption_valid_days??30;$('setCap').value=s.max_points_per_order??5000}
async function saveSettings(){
  try{const {error}=await sb.rpc('padoka_admin_update_loyalty_settings',{p_enabled:$('setEnabled').value==='true',p_points_per_brl:Number($('setRate').value),p_first_order_bonus_points:Number($('setFirst').value),p_birthday_multiplier:Number($('setBirthday').value),p_redemption_valid_days:Number($('setDays').value),p_max_points_per_order:Number($('setCap').value)});if(error)throw error;notice('settingsNotice','Configurações salvas.','ok');await loadManager()}
  catch(e){notice('settingsNotice',friendly(e),'error')}
}
function renderRewards(){
  $('rewardList').innerHTML=rewards.length?rewards.map(r=>'<div class="item"><div><strong>'+esc(r.name)+' • '+num(r.points_cost)+' pts</strong><small>'+esc(r.description||'')+' • '+(r.stock_limit==null?'sem limite de estoque':num(r.stock_redeemed)+' / '+num(r.stock_limit)+' resgatados')+'</small></div><div class="item-actions">'+pill(r.active?'ativo':'inativo')+'<button class="btn soft" data-edit-reward="'+esc(r.id)+'">Editar</button></div></div>').join(''):'<div class="empty">Nenhuma recompensa.</div>';
  document.querySelectorAll('[data-edit-reward]').forEach(b=>b.onclick=()=>editReward(b.dataset.editReward));
}
function editReward(id){const r=rewards.find(x=>x.id===id);if(!r)return;$('rewardId').value=r.id;$('rewardName').value=r.name;$('rewardDesc').value=r.description||'';$('rewardCost').value=r.points_cost;$('rewardActive').value=String(!!r.active);$('rewardStock').value=r.stock_limit??'';$('rewardLimit').value=r.per_customer_limit??'';$('rewardFrom').value=toLocal(r.valid_from);$('rewardUntil').value=toLocal(r.valid_until);$('rewardBadge').value=r.badge||'';$('rewardSort').value=r.sort_order??0;$('rewardName').scrollIntoView({behavior:'smooth',block:'center'})}
function clearReward(){['rewardId','rewardName','rewardDesc','rewardCost','rewardStock','rewardLimit','rewardFrom','rewardUntil','rewardBadge'].forEach(id=>$(id).value='');$('rewardSort').value=0;$('rewardActive').value='true'}
async function saveReward(){
  const val=id=>$(id).value.trim();
  try{const {error}=await sb.rpc('padoka_admin_upsert_loyalty_reward',{p_id:val('rewardId')||null,p_name:val('rewardName'),p_description:val('rewardDesc'),p_points_cost:Number(val('rewardCost')),p_active:$('rewardActive').value==='true',p_stock_limit:val('rewardStock')===''?null:Number(val('rewardStock')),p_per_customer_limit:val('rewardLimit')===''?null:Number(val('rewardLimit')),p_valid_from:fromLocal(val('rewardFrom')),p_valid_until:fromLocal(val('rewardUntil')),p_badge:val('rewardBadge')||null,p_sort_order:Number(val('rewardSort')||0)});if(error)throw error;notice('rewardNotice','Recompensa salva.','ok');clearReward();await loadManager()}
  catch(e){notice('rewardNotice',friendly(e),'error')}
}
function renderCampaigns(){
  $('campaignList').innerHTML=campaigns.length?campaigns.map(c=>'<div class="item"><div><strong>'+esc(c.name)+' • '+Number(c.multiplier).toLocaleString('pt-BR',{maximumFractionDigits:2})+'×</strong><small>'+esc(c.description||'')+' • '+date(c.starts_at)+' até '+date(c.ends_at)+'</small></div><div class="item-actions">'+pill(c.active?'ativo':'inativo')+'<button class="btn soft" data-edit-campaign="'+esc(c.id)+'">Editar</button></div></div>').join(''):'<div class="empty">Nenhuma campanha.</div>';
  document.querySelectorAll('[data-edit-campaign]').forEach(b=>b.onclick=()=>editCampaign(b.dataset.editCampaign));
}
function editCampaign(id){const c=campaigns.find(x=>x.id===id);if(!c)return;$('campaignId').value=c.id;$('campaignName').value=c.name;$('campaignDesc').value=c.description||'';$('campaignMultiplier').value=c.multiplier;$('campaignBonus').value=c.bonus_points;$('campaignMin').value=c.min_order_total;$('campaignStart').value=toLocal(c.starts_at);$('campaignEnd').value=toLocal(c.ends_at);$('campaignActive').value=String(!!c.active);$('campaignName').scrollIntoView({behavior:'smooth',block:'center'})}
function clearCampaign(){['campaignId','campaignName','campaignDesc','campaignStart','campaignEnd'].forEach(id=>$(id).value='');$('campaignMultiplier').value=2;$('campaignBonus').value=0;$('campaignMin').value=0;$('campaignActive').value='false'}
async function saveCampaign(){
  const val=id=>$(id).value.trim();
  try{const {error}=await sb.rpc('padoka_admin_upsert_loyalty_campaign',{p_id:val('campaignId')||null,p_name:val('campaignName'),p_description:val('campaignDesc'),p_multiplier:Number(val('campaignMultiplier')),p_bonus_points:Number(val('campaignBonus')),p_min_order_total:Number(val('campaignMin')),p_starts_at:fromLocal(val('campaignStart')),p_ends_at:fromLocal(val('campaignEnd')),p_active:$('campaignActive').value==='true'});if(error)throw error;notice('campaignNotice','Campanha salva.','ok');clearCampaign();await loadManager()}
  catch(e){notice('campaignNotice',friendly(e),'error')}
}
async function searchCustomers(){
  try{const {data,error}=await sb.rpc('padoka_admin_loyalty_customers',{p_search:$('customerSearch').value.trim(),p_limit:50});if(error)throw error;renderCustomers(data||[])}
  catch(e){notice('customerNotice',friendly(e),'error')}
}
function renderCustomers(rows){$('customerList').innerHTML=rows.length?rows.map(c=>'<div class="item"><div><strong>'+esc(c.full_name||'Cliente')+' • '+num(c.points_balance)+' pts</strong><small>'+esc(c.email||'')+(c.phone?' • '+esc(c.phone):'')+' • '+num(c.lifetime_points)+' acumulados</small></div><div class="item-actions"><button class="btn soft" data-customer="'+esc(c.user_id)+'">Selecionar</button></div></div>').join(''):'<div class="empty">Nenhum cliente encontrado.</div>';document.querySelectorAll('[data-customer]').forEach(b=>b.onclick=()=>{const c=rows.find(x=>x.user_id===b.dataset.customer);selectedCustomer=c;$('selectedCustomer').textContent=(c?.full_name||'Cliente')+' • '+num(c?.points_balance)+' pts';$('adjustBox').classList.remove('hidden')})}
async function adjust(){
  if(!selectedCustomer)return;const pts=Number($('adjustPoints').value),reason=$('adjustReason').value.trim();if(!pts)return notice('customerNotice','Informe uma quantidade diferente de zero.','error');
  if(!confirm('Aplicar ajuste de '+pts+' ponto(s) para '+selectedCustomer.full_name+'?'))return;
  try{const {data,error}=await sb.rpc('padoka_admin_adjust_loyalty',{p_user_id:selectedCustomer.user_id,p_points:pts,p_reason:reason});if(error)throw error;notice('customerNotice','Ajuste concluído. Novo saldo: '+num(data.balance_after)+' pts.','ok');$('adjustPoints').value='';$('adjustReason').value='';await searchCustomers();await loadManager()}
  catch(e){notice('customerNotice',friendly(e),'error')}
}
function renderRecent(rows){$('recentTable').innerHTML=rows.length?'<table class="table"><thead><tr><th>CÓDIGO</th><th>RECOMPENSA</th><th>PONTOS</th><th>STATUS</th><th>CRIADO</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.code)+'</td><td>'+esc(r.reward_name)+'</td><td>'+num(r.points_spent)+'</td><td>'+pill(r.status)+'</td><td>'+esc(date(r.created_at))+'</td></tr>').join('')+'</tbody></table>':'<div class="empty">Sem resgates registrados.</div>'}

async function start(){
  try{
    const resp=await fetch(CONFIG_URL,{cache:'no-store'});if(!resp.ok)throw new Error('config');const cfg=await resp.json();
    sb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true}});window.padokaSupabase=sb;
    role=await validate();if(!role){$('gateTitle').textContent='Acesso restrito';$('gateText').textContent='Use uma conta autorizada da equipe para acessar o PADOKA Club.';return}
    $('roleBadge').textContent=role.toUpperCase();$('gate').classList.add('hidden');$('app').classList.remove('hidden');
    if(['owner','manager'].includes(role)){document.body.classList.add('manager');await loadManager();await searchCustomers()}
  }catch(e){console.error(e);$('gateTitle').textContent='Não foi possível validar';$('gateText').textContent='Tente novamente em instantes.'}
}
$('lookupBtn').onclick=lookup;$('codeInput').addEventListener('keydown',e=>{if(e.key==='Enter')lookup()});
$('saveSettings').onclick=saveSettings;$('saveReward').onclick=saveReward;$('clearReward').onclick=clearReward;$('saveCampaign').onclick=saveCampaign;$('clearCampaign').onclick=clearCampaign;$('customerBtn').onclick=searchCustomers;$('adjustBtn').onclick=adjust;
start();
})();