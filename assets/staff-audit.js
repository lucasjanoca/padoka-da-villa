(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;

  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const labels={owner:'Proprietário',manager:'Gerente',cashier:'Caixa',attendant:'Atendimento',production:'Produção',stock:'Estoque'};
  const missingRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_list_staff_audit|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let client=null,available=false,loading=false,activeUserId='',lifecycleEpoch=0;

  async function waitForContext(){
    for(let i=0;i<100;i++){
      if(window.padokaSupabase&&window.padokaStaffRole)return {client:window.padokaSupabase,role:window.padokaStaffRole};
      await sleep(100);
    }
    return null;
  }

  async function waitForTeamPanel(){
    for(let i=0;i<100;i++){
      const panel=document.querySelector('[data-panel="equipe"]');
      if(panel)return panel;
      await sleep(100);
    }
    return null;
  }

  function clearTeamUi(){
    available=false;
    loading=false;
    document.getElementById('staffAudit')?.remove();
    document.querySelector('[data-panel="equipe"]')?.remove();
    document.querySelector('.tabs a[href="?tab=equipe"]')?.remove();
    document.querySelector('.padoka-nav-list [data-padoka-module="equipe"]')?.remove();
  }

  function sessionStillValid(epoch,userId){
    return epoch===lifecycleEpoch&&!!userId&&userId===activeUserId&&window.padokaStaffRole==='owner'&&!document.documentElement.classList.contains('padoka-staff-pending');
  }

  function watchAuth(){
    if(!client)return;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId&&nextUserId===activeUserId&&event==='SIGNED_IN')return;
      lifecycleEpoch+=1;
      activeUserId='';
      clearTeamUi();
      setTimeout(()=>location.replace('internal.html'),0);
    });
  }

  function addStyles(){
    if(document.getElementById('padokaStaffAuditStyle'))return;
    const style=document.createElement('style');
    style.id='padokaStaffAuditStyle';
    style.textContent=`
      .staff-audit{margin-top:12px;border-top:1px solid var(--line);padding-top:12px}
      .staff-audit-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:8px}
      .staff-audit-head h3{margin:0;font-size:13px}.staff-audit-head p{margin:3px 0 0;color:var(--muted);font-size:9px;line-height:1.4}
      .staff-audit-refresh{border:1px solid var(--line);background:#fff;border-radius:9px;padding:7px 9px;font-size:8.5px;font-weight:900}
      .staff-audit-list{display:grid;gap:7px}.staff-audit-row{border:1px solid var(--line);border-radius:13px;padding:10px;background:#faf8f5}
      .staff-audit-row strong{font-size:9.5px}.staff-audit-row p{margin:4px 0 0;color:var(--muted);font-size:8.5px;line-height:1.45}.staff-audit-row time{display:block;margin-top:5px;color:var(--muted);font-size:8px}
      @media(max-width:520px){.staff-audit-head{align-items:start;flex-direction:column}.staff-audit-refresh{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureMount(panel){
    addStyles();
    let mount=document.getElementById('staffAudit');
    if(mount)return mount;
    mount=document.createElement('section');
    mount.id='staffAudit';
    mount.className='staff-audit';
    mount.innerHTML='<div class="staff-audit-head"><div><h3>Histórico de acessos</h3><p>Alterações de função e inclusão de funcionários registradas pelo servidor.</p></div><button class="staff-audit-refresh" id="staffAuditRefresh" type="button">Atualizar</button></div><div class="staff-audit-list" id="staffAuditList"><div class="notice">Carregando histórico…</div></div>';
    const note=panel.querySelector('.staff-note');
    if(note)note.before(mount);else panel.querySelector('.card')?.appendChild(mount);
    document.getElementById('staffAuditRefresh')?.addEventListener('click',()=>load());
    return mount;
  }

  function describe(row){
    const actor=esc(row.actor_name||row.actor_email||'Proprietário');
    const target=esc(row.target_name||row.target_email||'Funcionário');
    const newRole=esc(labels[row.new_role]||row.new_role||'—');
    if(row.action==='added')return `<strong>${actor}</strong> adicionou <strong>${target}</strong> como ${newRole}.`;
    const oldRole=esc(labels[row.old_role]||row.old_role||'—');
    const roleChanged=row.old_role!==row.new_role;
    const activeChanged=Boolean(row.old_active)!==Boolean(row.new_active);
    const parts=[];
    if(roleChanged)parts.push(`função ${oldRole} → ${newRole}`);
    if(activeChanged)parts.push(row.new_active?'acesso ativado':'acesso desativado');
    return `<strong>${actor}</strong> atualizou <strong>${target}</strong>${parts.length?`: ${parts.join(' • ')}`:'.'}`;
  }

  function render(rows){
    const list=document.getElementById('staffAuditList');
    if(!list)return;
    if(!rows.length){list.innerHTML='<div class="notice">Nenhuma alteração de acesso registrada ainda.</div>';return}
    list.innerHTML=rows.map(row=>{
      const when=row.created_at?new Date(row.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
      const actorEmail=esc(row.actor_email||'');
      const targetEmail=esc(row.target_email||'');
      return `<article class="staff-audit-row"><div>${describe(row)}</div><p>${actorEmail}${actorEmail&&targetEmail?' → ':''}${targetEmail}</p><time>${esc(when)}</time></article>`;
    }).join('');
  }

  async function load(){
    if(!client||!available||loading||!activeUserId)return;
    const epoch=lifecycleEpoch,userId=activeUserId;
    loading=true;
    const button=document.getElementById('staffAuditRefresh');
    if(button){button.disabled=true;button.textContent='Atualizando…'}
    let result;
    try{
      result=await client.rpc('padoka_list_staff_audit',{p_limit:30});
    }catch(error){
      if(!sessionStillValid(epoch,userId))return;
      loading=false;
      if(button){button.disabled=false;button.textContent='Atualizar'}
      const list=document.getElementById('staffAuditList');
      if(list)list.innerHTML='<div class="notice">Não foi possível carregar o histórico agora. Verifique a conexão e tente novamente.</div>';
      return;
    }
    if(!sessionStillValid(epoch,userId))return;
    const {data,error}=result;
    loading=false;
    if(button){button.disabled=false;button.textContent='Atualizar'}
    if(error){
      if(missingRpc(error)){available=false;document.getElementById('staffAudit')?.remove();return}
      const list=document.getElementById('staffAuditList');
      if(list)list.innerHTML='<div class="notice">Não foi possível carregar o histórico agora.</div>';
      return;
    }
    render((data||[]).map(row=>({
      action:String(row.action||''),actor_name:String(row.actor_name||''),actor_email:String(row.actor_email||''),target_name:String(row.target_name||''),target_email:String(row.target_email||''),old_role:row.old_role==null?null:String(row.old_role),new_role:String(row.new_role||''),old_active:row.old_active,new_active:!!row.new_active,created_at:row.created_at
    })));
  }

  async function probe(epoch,userId){
    let result;
    try{
      result=await client.rpc('padoka_list_staff_audit',{p_limit:1});
    }catch(error){
      if(!sessionStillValid(epoch,userId))return false;
      console.warn('PADOKA staff audit capability unavailable:',error);
      return false;
    }
    if(!sessionStillValid(epoch,userId))return false;
    const {error}=result;
    if(!error)return true;
    return !missingRpc(error);
  }

  async function init(){
    const context=await waitForContext();
    if(!context||context.role!=='owner')return;
    client=context.client;
    const {data:{session}}=await client.auth.getSession();
    if(!session?.user?.id||window.padokaStaffRole!=='owner')return;
    activeUserId=session.user.id;
    const epoch=++lifecycleEpoch,userId=activeUserId;
    watchAuth();
    available=await probe(epoch,userId);
    if(!sessionStillValid(epoch,userId)||!available)return;
    const panel=await waitForTeamPanel();
    if(!sessionStillValid(epoch,userId)||!panel)return;
    ensureMount(panel);
    await load();

    document.addEventListener('click',event=>{
      if(event.target.closest('[data-save]'))setTimeout(()=>{if(sessionStillValid(lifecycleEpoch,activeUserId))load()},900);
    },true);
    document.addEventListener('submit',event=>{
      if(event.target?.id==='staffEnrollForm')setTimeout(()=>{if(sessionStillValid(lifecycleEpoch,activeUserId))load()},1100);
    },true);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&sessionStillValid(lifecycleEpoch,activeUserId))load()});
  }

  init().catch(error=>console.warn('PADOKA staff audit:',error));
})();