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

  // Beep reforçado para celular: mais alto, mais encorpado e parecido com leitor físico.
  playScanBeep=function(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!audioCtx)audioCtx=new AC();
      if(audioCtx.state==='suspended')audioCtx.resume();

      const now=audioCtx.currentTime;
      const master=audioCtx.createGain();
      const compressor=audioCtx.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-12,now);
      compressor.knee.setValueAtTime(8,now);
      compressor.ratio.setValueAtTime(10,now);
      compressor.attack.setValueAtTime(0.002,now);
      compressor.release.setValueAtTime(0.12,now);

      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(0.95,now+0.008);
      master.gain.setValueAtTime(0.95,now+0.16);
      master.gain.exponentialRampToValueAtTime(0.0001,now+0.24);
      master.connect(compressor);
      compressor.connect(audioCtx.destination);

      const tones=[
        {freq:1450,type:'square',gain:0.42},
        {freq:1850,type:'square',gain:0.34},
        {freq:2250,type:'sine',gain:0.28}
      ];

      tones.forEach(({freq,type,gain})=>{
        const osc=audioCtx.createOscillator();
        const level=audioCtx.createGain();
        osc.type=type;
        osc.frequency.setValueAtTime(freq,now);
        level.gain.setValueAtTime(gain,now);
        osc.connect(level);
        level.connect(master);
        osc.start(now);
        osc.stop(now+0.25);
      });

      if(navigator.vibrate)navigator.vibrate([90,35,55]);
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
