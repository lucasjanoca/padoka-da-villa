(()=>{
  function fallback(img){
    if(!(img instanceof HTMLImageElement)||!img.hasAttribute('data-padoka-fallback'))return;
    if(img.dataset.padokaFallbackApplied==='1')return;
    img.dataset.padokaFallbackApplied='1';
    img.src='assets/logo-padoka.svg';
    img.style.objectFit='contain';
    const padding=String(img.getAttribute('data-padoka-fallback')||'').trim();
    if(padding)img.style.padding=padding;
  }
  document.addEventListener('error',event=>fallback(event.target),true);
})();
