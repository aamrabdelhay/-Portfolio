(function(){
  function moveAdminKey(){
    const footer=document.querySelector('.footer, footer');
    const key=document.querySelector('.keybutton');
    if(!footer||!key||key.parentElement===footer)return;
    footer.appendChild(key);
    key.classList.add('footer-admin-key');
    key.setAttribute('aria-label','Admin access');
    key.setAttribute('title','Admin access');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',moveAdminKey,{once:true});
  else moveAdminKey();

  new MutationObserver(moveAdminKey).observe(document.documentElement,{childList:true,subtree:true});
})();
