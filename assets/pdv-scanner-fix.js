(()=>{
  const TEST_BARCODES={
    'pao-frances':'7899000000010',
    'pao-queijo':'7899000000027',
    'croissant':'7899000000034',
    'croissant-recheado':'7899000000041',
    'coxinha':'7899000000058',
    'esfiha':'7899000000065',
    'misto':'7899000000072',
    'combo-noturno':'7899000000089',
    'bolo':'7899000000096',
    'sonho':'7899000000102',
    'cookie':'7899000000119',
    'muffin':'7899000000126',
    'expresso':'7899000000133',
    'cappuccino':'7899000000140',
    'suco':'7899000000157',
    'agua':'7899000000164'
  };

  const HARDWARE_KEY_GAP_MS=80;
  const HARDWARE_COMMIT_DELAY_MS=130;
  const MIN_AUTO_CODE_LENGTH=6;
  const normalize=value=>String(value??'').trim();
  const scannerInput=document.getElementById('scanner');
  const readerStatus=document.getElementById('readerStatus');
  let inputBurstCount=0,inputLastKeyAt=0,inputCommitTimer=null;
  let hardwareBuffer='',hardwareStartedAt=0,hardwareLastKeyAt=0,hardwareCommitTimer=null;

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

  function cameraIsOpen(){
    const modal=document.getElementById('cameraModal');
    return Boolean(modal&&!modal.classList.contains('hidden'));
  }

  function submitHardwareCode(code){
    const raw=normalize(code);
    if(!raw||!scannerInput||scannerInput.disabled)return false;
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
      if(scannerInput.disabled||cameraIsOpen()||event.ctrlKey||event.altKey||event.metaKey)return;
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

  async function refreshBarcodes(){
    if(!sb||!Array.isArray(products)||!products.length)return false;
    let rows=[];
    try{
      const {data,error}=await sb.rpc('padoka_list_product_barcodes');
      if(!error&&Array.isArray(data))rows=data;
    }catch(error){
      console.warn('PADOKA barcode catalog RPC:',error);
    }
    const fromDb=new Map(rows.map(row=>[String(row.product_id),normalize(row.barcode)]));
    products=products.map(product=>({
      ...product,
      barcode:fromDb.get(String(product.id))||normalize(product.barcode)||TEST_BARCODES[product.id]||null
    }));
    try{renderProducts()}catch{}
    return true;
  }

  const originalFindByCode=findByCode;
  findByCode=function(code){
    const found=originalFindByCode(code);
    if(found)return found;
    const raw=normalize(code);
    const productId=Object.keys(TEST_BARCODES).find(id=>TEST_BARCODES[id]===raw);
    return productId?products.find(product=>product.id===productId)||null:null;
  };

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
    await refreshBarcodes();
    try{await prepareAudio()}catch{}
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
      await refreshBarcodes();
      scannerInput?.focus();
      return;
    }
    if(attempts>=40)clearInterval(timer);
  },250);
})();
