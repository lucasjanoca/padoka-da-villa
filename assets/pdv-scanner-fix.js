(()=>{
  const HARDWARE_KEY_GAP_MS=80;
  const HARDWARE_COMMIT_DELAY_MS=130;
  const MIN_AUTO_CODE_LENGTH=6;
  const MAX_SCANNER_CODE_LENGTH=64;
  const DEMO_BARCODE_PATTERN=/^7899000000\d{3}$/;
  const normalize=value=>String(value??'').trim();
  const scannerInput=document.getElementById('scanner');
  const readerStatus=document.getElementById('readerStatus');
  let inputBurstCount=0,inputLastKeyAt=0,inputCommitTimer=null;
  let hardwareBuffer='',hardwareStartedAt=0,hardwareLastKeyAt=0,hardwareCommitTimer=null;
  let scannerLifecycleEpoch=0,scannerUserId='',authSubscription=null;

  function setReaderStatus(text){
    if(readerStatus)readerStatus.textContent=text;
  }

  function resetInputBurst(){
    inputBurstCount=0;
    inputLastKeyAt=0;
    clearTimeout(inputCommitTimer);
    inputCommitTimer=null;
  }

  function resetHardwareBuffer(){
    hardwareBuffer='';
    hardwareStartedAt=0;
    hardwareLastKeyAt=0;
    clearTimeout(hardwareCommitTimer);
    hardwareCommitTimer=null;
  }

  function clearLocalBarcodes(){
    try{
      if(Array.isArray(products)){
        products=products.map(product=>({...product,barcode:null}));
        renderProducts();
      }
    }catch{}
  }

  function resetScannerForIdentityChange(message='Acesso ao leitor sendo revalidado.'){
    scannerLifecycleEpoch+=1;
    scannerUserId='';
    resetInputBurst();
    resetHardwareBuffer();
    if(scannerInput)scannerInput.value='';
    clearLocalBarcodes();
    setReaderStatus(message);
  }

  function staffGuardPending(){
    return document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending');
  }

  function scannerContextCurrent(epoch,userId){
    return epoch===scannerLifecycleEpoch&&!!userId&&userId===scannerUserId&&!staffGuardPending();
  }

  function rejectOversizedRead(){
    resetInputBurst();
    resetHardwareBuffer();
    if(scannerInput)scannerInput.value='';
    setReaderStatus('Leitura ignorada — código acima do limite permitido.');
    return false;
  }

  function cameraIsOpen(){
    const modal=document.getElementById('cameraModal');
    return Boolean(modal&&!modal.classList.contains('hidden'));
  }

  function submitHardwareCode(code){
    const raw=normalize(code);
    if(raw.length>MAX_SCANNER_CODE_LENGTH)return rejectOversizedRead();
    if(!raw||!scannerInput||scannerInput.disabled||!scannerUserId||staffGuardPending())return false;
    const product=typeof findByCode==='function'?findByCode(raw):null;
    scannerInput.value=raw;
    scan();
    scannerInput.focus();
    setReaderStatus(product?`Leitura recebida • ${product.name}`:`Código recebido • ${raw} não cadastrado`);
    return true;
  }

  function commitHardwareBuffer(){
    const raw=hardwareBuffer;
    resetHardwareBuffer();
    return submitHardwareCode(raw);
  }

  function armInputAutoCommit(){
    clearTimeout(inputCommitTimer);
    inputCommitTimer=setTimeout(()=>{
      const raw=normalize(scannerInput?.value);
      const looksLikeScanner=inputBurstCount>=MIN_AUTO_CODE_LENGTH&&raw.length>=MIN_AUTO_CODE_LENGTH;
      resetInputBurst();
      if(looksLikeScanner)submitHardwareCode(raw);
    },HARDWARE_COMMIT_DELAY_MS);
  }

  function armHardwareAutoCommit(){
    clearTimeout(hardwareCommitTimer);
    hardwareCommitTimer=setTimeout(()=>{
      const duration=Math.max(1,hardwareLastKeyAt-hardwareStartedAt);
      const maxDuration=Math.max(HARDWARE_KEY_GAP_MS,(hardwareBuffer.length-1)*HARDWARE_KEY_GAP_MS);
      if(hardwareBuffer.length>=MIN_AUTO_CODE_LENGTH&&duration<=maxDuration)commitHardwareBuffer();
      else resetHardwareBuffer();
    },HARDWARE_COMMIT_DELAY_MS);
  }

  function installHardwareKeyboardSupport(){
    if(!scannerInput||scannerInput.dataset.hardwareScanner==='1')return;
    scannerInput.dataset.hardwareScanner='1';

    scannerInput.addEventListener('input',()=>{
      if(scannerInput.value.length>MAX_SCANNER_CODE_LENGTH)rejectOversizedRead();
    });

    scannerInput.addEventListener('keydown',event=>{
      if(event.key==='Tab'&&normalize(scannerInput.value)){
        event.preventDefault();
        resetInputBurst();
        submitHardwareCode(scannerInput.value);
        return;
      }
      if(event.key==='Escape'){
        resetInputBurst();
        scannerInput.value='';
        setReaderStatus('Modo leitor USB ativo — aguardando código.');
        return;
      }
      if(event.ctrlKey||event.altKey||event.metaKey||event.key.length!==1)return;
      const now=performance.now();
      if(!inputLastKeyAt||now-inputLastKeyAt>HARDWARE_KEY_GAP_MS)inputBurstCount=1;
      else inputBurstCount+=1;
      inputLastKeyAt=now;
      armInputAutoCommit();
    });

    document.addEventListener('keydown',event=>{
      if(scannerInput.disabled||cameraIsOpen()||!scannerUserId||staffGuardPending()||event.ctrlKey||event.altKey||event.metaKey)return;
      const active=document.activeElement;
      if(active===scannerInput)return;
      const tag=active?.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||active?.isContentEditable)return;

      if(event.key==='Escape'){
        resetHardwareBuffer();
        setReaderStatus('Modo leitor USB ativo — aguardando código.');
        return;
      }
      if(event.key==='Enter'||event.key==='Tab'){
        if(!hardwareBuffer)return;
        event.preventDefault();
        commitHardwareBuffer();
        return;
      }
      if(event.key.length!==1)return;
      if(hardwareBuffer.length>=MAX_SCANNER_CODE_LENGTH){
        if(tag==='SELECT'||tag==='BUTTON')event.preventDefault();
        rejectOversizedRead();
        return;
      }

      const now=performance.now();
      if(!hardwareLastKeyAt||now-hardwareLastKeyAt>HARDWARE_KEY_GAP_MS){
        hardwareBuffer=event.key;
        hardwareStartedAt=now;
      }else{
        hardwareBuffer+=event.key;
      }
      hardwareLastKeyAt=now;
      if(tag==='SELECT'||tag==='BUTTON')event.preventDefault();
      if(scannerInput)scannerInput.value=hardwareBuffer;
      armHardwareAutoCommit();
    },true);

    setReaderStatus('Modo leitor USB ativo — aguardando código.');
  }

  function describeBarcodeState(rows){
    const codes=rows.map(row=>normalize(row.barcode)).filter(Boolean);
    if(!codes.length)return 'Modo leitor USB ativo — nenhum código de barras cadastrado no servidor.';
    if(codes.every(code=>DEMO_BARCODE_PATTERN.test(code)))return 'Modo leitor USB ativo — códigos cadastrados ainda são demonstrativos.';
    return 'Modo leitor USB ativo — aguardando código.';
  }

  async function refreshBarcodes(expectedEpoch=scannerLifecycleEpoch,expectedUserId=scannerUserId){
    if(!sb||!Array.isArray(products)||!products.length||!scannerContextCurrent(expectedEpoch,expectedUserId))return false;
    let rows=[];
    try{
      const {data,error}=await sb.rpc('padoka_list_product_barcodes');
      if(error)throw error;
      if(!scannerContextCurrent(expectedEpoch,expectedUserId))return false;
      const {data:{session}}=await sb.auth.getSession();
      if(!scannerContextCurrent(expectedEpoch,expectedUserId)||session?.user?.id!==expectedUserId)return false;
      if(Array.isArray(data))rows=data;
    }catch(error){
      if(!scannerContextCurrent(expectedEpoch,expectedUserId))return false;
      console.warn('PADOKA barcode catalog RPC:',error);
      setReaderStatus('Modo leitor USB ativo — não foi possível atualizar os códigos do servidor.');
      return false;
    }
    if(!scannerContextCurrent(expectedEpoch,expectedUserId))return false;
    const fromDb=new Map(rows.map(row=>[String(row.product_id),normalize(row.barcode)]));
    products=products.map(product=>({
      ...product,
      barcode:fromDb.get(String(product.id))||null
    }));
    setReaderStatus(describeBarcodeState(rows));
    try{renderProducts()}catch{}
    return true;
  }

  async function activateScannerForUser(expectedUserId){
    const epoch=++scannerLifecycleEpoch;
    if(!expectedUserId||!sb)return false;
    for(let i=0;i<80;i++){
      if(epoch!==scannerLifecycleEpoch)return false;
      if(!staffGuardPending()&&window.padokaStaffRole&&window.padokaCanAccess){
        const {data:{session}}=await sb.auth.getSession();
        if(epoch!==scannerLifecycleEpoch||session?.user?.id!==expectedUserId)return false;
        if(!window.padokaCanAccess('pdv'))return false;
        scannerUserId=expectedUserId;
        await refreshBarcodes(epoch,expectedUserId);
        if(scannerContextCurrent(epoch,expectedUserId))scannerInput?.focus();
        return true;
      }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return false;
  }

  function watchScannerAuth(){
    if(!sb)return;
    const result=sb.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId===scannerUserId&&event==='SIGNED_IN')return;
      resetScannerForIdentityChange();
      if(nextUserId)setTimeout(()=>activateScannerForUser(nextUserId),0);
    });
    authSubscription=result?.data?.subscription||null;
  }

  // Beep no limite digital do navegador. O volume físico final ainda depende do volume de mídia do aparelho.
  playScanBeep=function(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!audioCtx)audioCtx=new AC();
      if(audioCtx.state==='suspended')audioCtx.resume();

      const now=audioCtx.currentTime;
      const master=audioCtx.createGain();
      const limiter=audioCtx.createDynamicsCompressor();

      limiter.threshold.setValueAtTime(-3,now);
      limiter.knee.setValueAtTime(0,now);
      limiter.ratio.setValueAtTime(20,now);
      limiter.attack.setValueAtTime(0.001,now);
      limiter.release.setValueAtTime(0.08,now);

      master.gain.setValueAtTime(1.0,now);
      master.connect(limiter);
      limiter.connect(audioCtx.destination);

      const bursts=[
        {start:0.000,end:0.155},
        {start:0.185,end:0.335}
      ];
      const tones=[
        {freq:1500,type:'square',gain:0.90},
        {freq:2050,type:'square',gain:0.75},
        {freq:2600,type:'sawtooth',gain:0.55}
      ];

      bursts.forEach(({start,end})=>{
        tones.forEach(({freq,type,gain})=>{
          const osc=audioCtx.createOscillator();
          const level=audioCtx.createGain();
          const s=now+start,e=now+end;
          osc.type=type;
          osc.frequency.setValueAtTime(freq,s);
          level.gain.setValueAtTime(0.0001,s);
          level.gain.exponentialRampToValueAtTime(gain,s+0.004);
          level.gain.setValueAtTime(gain,e-0.018);
          level.gain.exponentialRampToValueAtTime(0.0001,e);
          osc.connect(level);
          level.connect(master);
          osc.start(s);
          osc.stop(e+0.01);
        });
      });

      if(navigator.vibrate)navigator.vibrate([120,40,90]);
    }catch(error){
      console.warn('PADOKA scan beep:',error);
    }
  };

  const originalOpenCamera=openCamera;
  openCamera=async function(){
    const epoch=scannerLifecycleEpoch,userId=scannerUserId;
    if(!scannerContextCurrent(epoch,userId))return;
    await refreshBarcodes(epoch,userId);
    if(!scannerContextCurrent(epoch,userId))return;
    try{await prepareAudio()}catch{}
    if(!scannerContextCurrent(epoch,userId))return;
    return originalOpenCamera();
  };
  const cameraBtn=document.getElementById('cameraBtn');
  if(cameraBtn)cameraBtn.onclick=openCamera;

  installHardwareKeyboardSupport();

  let attempts=0;
  const timer=setInterval(async()=>{
    attempts+=1;
    if(sb&&Array.isArray(products)&&products.length){
      clearInterval(timer);
      const {data:{session}}=await sb.auth.getSession();
      const userId=session?.user?.id||'';
      if(userId){
        watchScannerAuth();
        await activateScannerForUser(userId);
      }else{
        resetScannerForIdentityChange('Entre novamente com uma conta interna autorizada para usar o leitor.');
      }
      return;
    }
    if(attempts>=40)clearInterval(timer);
  },250);

  window.addEventListener('pagehide',()=>{
    resetScannerForIdentityChange();
    try{authSubscription?.unsubscribe()}catch{}
  },{once:true});
})();
