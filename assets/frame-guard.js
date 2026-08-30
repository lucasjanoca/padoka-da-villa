(() => {
  'use strict';
  if (window.top === window.self) return;
  document.documentElement.classList.add('padoka-framed');
  try {
    window.top.location = window.location.href;
  } catch {}
})();
