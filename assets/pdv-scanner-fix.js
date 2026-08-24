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

  const normalize=value=>String(value??'').trim();

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

  playScanBeep=function(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!audioCtx)audioCtx=new AC();
      if(audioCtx.state==='suspended')audioCtx.resume();
      const osc=audioCtx.createOscillator();
      const gain=audioCtx.createGain();
      const now=audioCtx.currentTime;
      osc.type='sine';
      osc.frequency.setValueAtTime(1350,now);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.32,now+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now+.16);
      if(navigator.vibrate)navigator.vibrate(60);
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

  let attempts=0;
  const timer=setInterval(async()=>{
    attempts+=1;
    if(sb&&Array.isArray(products)&&products.length){
      clearInterval(timer);
      await refreshBarcodes();
      return;
    }
    if(attempts>=40)clearInterval(timer);
  },250);
})();
