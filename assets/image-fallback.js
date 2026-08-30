(()=>{
  function fallback(img){
    if(!(img instanceof HTMLImageElement)||!img.hasAttribute('data-padoka-fallback'))return;
    if(img.dataset.padokaFallbackApplied==='1')return;
    img.dataset.padokaFallbackApplied='1';
    img.src='assets/logo-padoka.svg';
    img.classList.add('padoka-fallback-applied');
    const padding=String(img.getAttribute('data-padoka-fallback')||'').trim().replace(/px$/,'');
    if(['15','16','24','26'].includes(padding))img.classList.add('padoka-fallback-pad-'+padding);
  }
  document.addEventListener('error',event=>fallback(event.target),true);
})();
