(function(){
  function clean(){
    document.querySelectorAll('.logo-control-nav-btn').forEach(b=>b.remove());
    document.querySelectorAll('.logo-control-nav-modal').forEach(m=>m.remove());
    document.querySelectorAll('.adminbar .logo-control-button').forEach(b=>b.remove());
    const brand=document.querySelector('.header .brand');
    if(brand){brand.setAttribute('aria-hidden','true');brand.style.display='none';}
  }
  function ensureStyle(){if(document.getElementById('safa-logo-single-style'))return;const s=document.createElement('style');s.id='safa-logo-single-style';s.textContent='.header .brand{display:none!important}.hero .hero-logo-control,.lc-site-preview .hero-logo-preview{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important}';document.head.appendChild(s)}
  function run(){ensureStyle();clean()}
  document.addEventListener('DOMContentLoaded',run);setTimeout(run,50);setTimeout(run,500);setTimeout(run,1500);
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
})();