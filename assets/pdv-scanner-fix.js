(()=>{
  const HARDWARE_KEY_GAP_MS=80;
  const HARDWARE_COMMIT_DELAY_MS=130;
  const MIN_AUTO_CODE_LENGTH=6;
  const MAX_SCANNER_CODE_LENGTH=64;
  const DEMO_BARCODE_PATTERN=/^7899000000\d{3}$/;
  const normalize=value=>String(value??'').trim();
  const scannerInput=document.getElementById('scanner');
  const readerStatus=document.getElementById('readerStatus');
  const cameraBtn=document.getElementById('cameraBtn');
  let inputBurstCount=0,inputLastKeyAt=0,inputCommitTimer=null;
  let hardwareBuffer='',hardwareStartedAt=0,hardwareLastKeyAt=0,hardwareCommitTimer=null;
  let scannerLifecycleEpoch=0,scannerUserId='',authSubscription=null;
  let cameraLoaderPromise=null,nativeStream=null,nativeVideo=null,nativeDetector=null,nativeLoopId=0,nativeBusy=false;

  function setReaderStatus(text){if(readerStatus)readerStatus.textContent=text}
  function resetInputBurst(){inputBurstCount=0;inputLastKeyAt=0;clearTimeout(inputCommitTimer);inputCommitTimer=null}
  function resetHardwareBuffer(){hardwareBuffer='';hardwareStartedAt=0;hardwareLastKeyAt=0;clearTimeout(hardwareCommitTimer);hardwareCommitTimer=null}
  function staffGuardPending(){return document.documentElement.classList.contains('padoka-staff-pending')||document.documentElement.classList.contains('padoka-role-pending')}
  function scannerContextCurrent(epoch,userId){return epoch===scannerLifecycleEpoch&&!!userId&&userId===scannerUserId&&!staffGuardPending()}
  function cameraIsOpen(){const modal=document.getElementById('cameraModal');return !!modal&&!modal.classList.contains('hidden')}

  async function safeSession(){
    try{const {data,error}=await sb.auth.getSession();if(error)throw error;return data?.session||null}
    catch(error){console.warn('PADOKA scanner session:',error);return null}
  }

  function clearLocalBarcodes(){
    try{if(Array.isArray(products)){products=products.map(product=>({...product,barcode:null}));renderProducts()}}
    catch{}
  }
  function resetScannerForIdentityChange(message='Acesso ao leitor sendo revalidado.'){
    scannerLifecycleEpoch+=1;scannerUserId='';resetInputBurst();resetHardwareBuffer();if(scannerInput)scannerInput.value='';clearLocalBarcodes();setReaderStatus(message)
  }
  function rejectOversizedRead(){resetInputBurst();resetHardwareBuffer();if(scannerInput)scannerInput.value='';setReaderStatus('Leitura ignorada — código acima do limite permitido.');return false}
  function submitHardwareCode(code){
    const raw=normalize(code);if(raw.length>MAX_SCANNER_CODE_LENGTH)return rejectOversizedRead();
    if(!raw||!scannerInput||scannerInput.disabled||!scannerUserId||staffGuardPending())return false;
    const product=typeof findByCode==='function'?findByCode(raw):null;scannerInput.value=raw;scan();scannerInput.focus();
    setReaderStatus(product?`Leitura recebida • ${product.name}`:`Código recebido • ${raw} não cadastrado`);return true
  }
  function commitHardwareBuffer(){const raw=hardwareBuffer;resetHardwareBuffer();return submitHardwareCode(raw)}
  function armInputAutoCommit(){clearTimeout(inputCommitTimer);inputCommitTimer=setTimeout(()=>{const raw=normalize(scannerInput?.value),looksLikeScanner=inputBurstCount>=MIN_AUTO_CODE_LENGTH&&raw.length>=MIN_AUTO_CODE_LENGTH;resetInputBurst();if(looksLikeScanner)submitHardwareCode(raw)},HARDWARE_COMMIT_DELAY_MS)}
  function armHardwareAutoCommit(){clearTimeout(hardwareCommitTimer);hardwareCommitTimer=setTimeout(()=>{const duration=Math.max(1,hardwareLastKeyAt-hardwareStartedAt),maxDuration=Math.max(HARDWARE_KEY_GAP_MS,(hardwareBuffer.length-1)*HARDWARE_KEY_GAP_MS);if(hardwareBuffer.length>=MIN_AUTO_CODE_LENGTH&&duration<=maxDuration)commitHardwareBuffer();else resetHardwareBuffer()},HARDWARE_COMMIT_DELAY_MS)}

  function installHardwareKeyboardSupport(){
    if(!scannerInput||scannerInput.dataset.hardwareScanner==='1')return;scannerInput.dataset.hardwareScanner='1';
    scannerInput.addEventListener('input',()=>{if(scannerInput.value.length>MAX_SCANNER_CODE_LENGTH)rejectOversizedRead()});
    scannerInput.addEventListener('keydown',event=>{
      if(event.key==='Tab'&&normalize(scannerInput.value)){event.preventDefault();resetInputBurst();submitHardwareCode(scannerInput.value);return}
      if(event.key==='Escape'){resetInputBurst();scannerInput.value='';setReaderStatus('Modo leitor USB ativo — aguardando código.');return}
      if(event.ctrlKey||event.altKey||event.metaKey||event.key.length!==1)return;
      const now=performance.now();inputBurstCount=!inputLastKeyAt||now-inputLastKeyAt>HARDWARE_KEY_GAP_MS?1:inputBurstCount+1;inputLastKeyAt=now;armInputAutoCommit()
    });
    document.addEventListener('keydown',event=>{
      if(scannerInput.disabled||cameraIsOpen()||!scannerUserId||staffGuardPending()||event.ctrlKey||event.altKey||event.metaKey)return;
      const active=document.activeElement;if(active===scannerInput)return;const tag=active?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||active?.isContentEditable)return;
      if(event.key==='Escape'){resetHardwareBuffer();setReaderStatus('Modo leitor USB ativo — aguardando código.');return}
      if(event.key==='Enter'||event.key==='Tab'){if(!hardwareBuffer)return;event.preventDefault();commitHardwareBuffer();return}
      if(event.key.length!==1)return;if(hardwareBuffer.length>=MAX_SCANNER_CODE_LENGTH){if(tag==='SELECT'||tag==='BUTTON')event.preventDefault();rejectOversizedRead();return}
      const now=performance.now();if(!hardwareLastKeyAt||now-hardwareLastKeyAt>HARDWARE_KEY_GAP_MS){hardwareBuffer=event.key;hardwareStartedAt=now}else hardwareBuffer+=event.key;
      hardwareLastKeyAt=now;if(tag==='SELECT'||tag==='BUTTON')event.preventDefault();scannerInput.value=hardwareBuffer;armHardwareAutoCommit()
    },true);
    setReaderStatus('Modo leitor USB ativo — aguardando código.')
  }

  function describeBarcodeState(rows){
    const codes=rows.map(row=>normalize(row.barcode)).filter(Boolean);if(!codes.length)return'Modo leitor USB ativo — nenhum código de barras cadastrado no servidor.';
    if(codes.every(code=>DEMO_BARCODE_PATTERN.test(code)))return'Modo leitor USB ativo — códigos cadastrados ainda são demonstrativos.';
    return'Modo leitor USB ativo — aguardando código.'
  }
  async function refreshBarcodes(expectedEpoch=scannerLifecycleEpoch,expectedUserId=scannerUserId){
    if(!sb||!Array.isArray(products)||!products.length||!scannerContextCurrent(expectedEpoch,expectedUserId))return false;let rows=[];
    try{const {data,error}=await sb.rpc('padoka_list_product_barcodes');if(error)throw error;if(!scannerContextCurrent(expectedEpoch,expectedUserId))return false;const session=await safeSession();if(!scannerContextCurrent(expectedEpoch,expectedUserId)||session?.user?.id!==expectedUserId)return false;if(Array.isArray(data))rows=data}
    catch(error){if(scannerContextCurrent(expectedEpoch,expectedUserId)){console.warn('PADOKA barcode catalog RPC:',error);setReaderStatus('Modo leitor USB ativo — não foi possível atualizar os códigos do servidor.')}return false}
    const fromDb=new Map(rows.map(row=>[String(row.product_id),normalize(row.barcode)]));products=products.map(product=>({...product,barcode:fromDb.get(String(product.id))||null}));setReaderStatus(describeBarcodeState(rows));try{renderProducts()}catch{}return true
  }
  async function activateScannerForUser(expectedUserId){
    const epoch=++scannerLifecycleEpoch;if(!expectedUserId||!sb)return false;
    for(let i=0;i<80;i++){
      if(epoch!==scannerLifecycleEpoch)return false;
      if(!staffGuardPending()&&window.padokaStaffRole&&window.padokaCanAccess){const session=await safeSession();if(epoch!==scannerLifecycleEpoch||session?.user?.id!==expectedUserId)return false;if(!window.padokaCanAccess('pdv'))return false;scannerUserId=expectedUserId;await refreshBarcodes(epoch,expectedUserId);if(scannerContextCurrent(epoch,expectedUserId))scannerInput?.focus();return true}
      await new Promise(resolve=>setTimeout(resolve,100))
    }
    return false
  }
  function watchScannerAuth(){
    if(!sb)return;const result=sb.auth.onAuthStateChange((event,session)=>{if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;const nextUserId=session?.user?.id||'';if(nextUserId===scannerUserId&&event==='SIGNED_IN')return;resetScannerForIdentityChange();if(nextUserId)setTimeout(()=>activateScannerForUser(nextUserId).catch(error=>{console.warn('PADOKA scanner auth revalidation:',error);resetScannerForIdentityChange('Não foi possível revalidar o leitor. Verifique a conexão e tente novamente.')}),0)});authSubscription=result?.data?.subscription||null
  }

  playScanBeep=function(){
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime,master=audioCtx.createGain(),limiter=audioCtx.createDynamicsCompressor();limiter.threshold.setValueAtTime(-3,now);limiter.knee.setValueAtTime(0,now);limiter.ratio.setValueAtTime(20,now);limiter.attack.setValueAtTime(.001,now);limiter.release.setValueAtTime(.08,now);master.gain.setValueAtTime(1,now);master.connect(limiter);limiter.connect(audioCtx.destination);[{start:0,end:.155},{start:.185,end:.335}].forEach(({start,end})=>[{freq:1500,type:'square',gain:.9},{freq:2050,type:'square',gain:.75},{freq:2600,type:'sawtooth',gain:.55}].forEach(({freq,type,gain})=>{const osc=audioCtx.createOscillator(),level=audioCtx.createGain(),s=now+start,e=now+end;osc.type=type;osc.frequency.setValueAtTime(freq,s);level.gain.setValueAtTime(.0001,s);level.gain.exponentialRampToValueAtTime(gain,s+.004);level.gain.setValueAtTime(gain,e-.018);level.gain.exponentialRampToValueAtTime(.0001,e);osc.connect(level);level.connect(master);osc.start(s);osc.stop(e+.01)}));if(navigator.vibrate)navigator.vibrate([120,40,90])}catch(error){console.warn('PADOKA scan beep:',error)}
  };

  function loadHtml5QrcodeFallback(){
    if(typeof window.Html5Qrcode!=='undefined')return Promise.resolve(true);if(cameraLoaderPromise)return cameraLoaderPromise;
    cameraLoaderPromise=new Promise(resolve=>{
      const old=document.querySelector('script[data-padoka-camera-fallback]');if(old)old.remove();
      const script=document.createElement('script');script.src='vendor/html5-qrcode-2.3.8.js?v=20260904-camera-fix';script.async=true;script.dataset.padokaCameraFallback='1';
      script.onload=()=>resolve(typeof window.Html5Qrcode!=='undefined');script.onerror=()=>resolve(false);document.head.appendChild(script)
    }).finally(()=>{setTimeout(()=>{cameraLoaderPromise=null},1000)});
    return cameraLoaderPromise
  }

  function stopNativeCamera(){
    nativeBusy=false;if(nativeLoopId)cancelAnimationFrame(nativeLoopId);nativeLoopId=0;try{nativeVideo?.pause()}catch{};try{nativeStream?.getTracks().forEach(track=>track.stop())}catch{};nativeStream=null;nativeDetector=null;if(nativeVideo){try{nativeVideo.srcObject=null}catch{};nativeVideo.remove()}nativeVideo=null
  }
  async function nativeCameraLoop(){
    if(!nativeVideo||!nativeDetector||!nativeStream||!cameraIsOpen())return;
    if(!nativeBusy&&nativeVideo.readyState>=2){nativeBusy=true;try{const found=await nativeDetector.detect(nativeVideo);const value=found?.[0]?.rawValue||'';if(value&&typeof handleCameraRead==='function')handleCameraRead(value)}catch(error){console.debug('PADOKA native barcode frame:',error)}finally{nativeBusy=false}}
    nativeLoopId=requestAnimationFrame(nativeCameraLoop)
  }
  async function openNativeCamera(){
    if(!navigator.mediaDevices?.getUserMedia||typeof window.BarcodeDetector==='undefined')return false;
    try{
      const formats=typeof BarcodeDetector.getSupportedFormats==='function'?await BarcodeDetector.getSupportedFormats():[];
      const wanted=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','codabar','qr_code'];const supported=formats.length?wanted.filter(x=>formats.includes(x)):wanted;
      if(!supported.length)return false;nativeDetector=new BarcodeDetector({formats:supported});nativeStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      const reader=document.getElementById('barcodeReader');reader.innerHTML='';nativeVideo=document.createElement('video');nativeVideo.autoplay=true;nativeVideo.muted=true;nativeVideo.playsInline=true;nativeVideo.setAttribute('playsinline','');nativeVideo.srcObject=nativeStream;reader.appendChild(nativeVideo);await nativeVideo.play();setCameraStatus('Câmera aberta. Aponte para um código de barras.','ok');nativeCameraLoop();return true
    }catch(error){stopNativeCamera();throw error}
  }

  const originalOpenCamera=openCamera,originalCloseCamera=closeCamera;
  openCamera=async function(){
    const epoch=scannerLifecycleEpoch,userId=scannerUserId;if(!scannerContextCurrent(epoch,userId))return;
    await refreshBarcodes(epoch,userId);if(!scannerContextCurrent(epoch,userId))return;
    try{await prepareAudio()}catch{};if(!scannerContextCurrent(epoch,userId))return;
    if(!window.isSecureContext&&location.hostname!=='localhost')return toast('A câmera precisa ser aberta pelo site em HTTPS.');
    if(typeof window.Html5Qrcode==='undefined'){
      setReaderStatus('Preparando leitor da câmera…');const loaded=await loadHtml5QrcodeFallback();if(!scannerContextCurrent(epoch,userId))return;
      if(!loaded){cameraLockedUntil=0;clearInterval(cameraCountdownTimer);document.getElementById('cameraModal')?.classList.remove('hidden');setCameraStatus('Abrindo câmera…','wait');try{if(await openNativeCamera())return}catch(error){console.error('PADOKA native camera:',error);const name=String(error?.name||'');if(name.includes('NotAllowed'))toast('Permita o acesso à câmera nas configurações do navegador.');else toast('Não consegui abrir a câmera deste aparelho.');await closeCamera();return}document.getElementById('cameraModal')?.classList.add('hidden');toast('O leitor de câmera não está disponível neste navegador. Atualize o Chrome e tente novamente.');return}
    }
    return originalOpenCamera()
  };
  closeCamera=async function(){
    if(nativeStream||nativeVideo){stopNativeCamera();cameraLockedUntil=0;clearInterval(cameraCountdownTimer);cameraCountdownTimer=null;const modal=document.getElementById('cameraModal'),status=document.getElementById('cameraStatus'),reader=document.getElementById('barcodeReader');if(reader)reader.innerHTML='';modal?.classList.add('hidden');if(status){status.className='camera-status';status.textContent='Abrindo a câmera…'}if(scannerInput){scannerInput.value='';scannerInput.focus()}return}
    return originalCloseCamera()
  };
  if(cameraBtn)cameraBtn.onclick=openCamera;const closeBtn=document.getElementById('cameraClose');if(closeBtn)closeBtn.onclick=closeCamera;

  installHardwareKeyboardSupport();
  let attempts=0;const timer=setInterval(async()=>{attempts+=1;if(sb&&Array.isArray(products)&&products.length){clearInterval(timer);const session=await safeSession(),userId=session?.user?.id||'';if(userId){watchScannerAuth();await activateScannerForUser(userId)}else resetScannerForIdentityChange('Não foi possível confirmar uma sessão interna autorizada para usar o leitor.');return}if(attempts>=40)clearInterval(timer)},250);
  window.addEventListener('pagehide',()=>{stopNativeCamera();resetScannerForIdentityChange();try{authSubscription?.unsubscribe()}catch{}},{once:true});
})();
