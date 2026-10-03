(function(){
  'use strict';
  var lastViewNode=null;
  var adminBooted=false;
  var observerScheduled=false;
  function firstViewNode(){return document.querySelector('#root > div > main, #root > div > section')}
  function scrollToTopOnViewChange(){var node=firstViewNode();if(!node||node===lastViewNode)return;lastViewNode=node;window.requestAnimationFrame(function(){window.scrollTo(0,0)})}
  function setAdminRoute(isAdmin){document.body.classList.toggle('safa-admin-route',!!isAdmin);if(isAdmin&&window.location.pathname!=='/admin')window.history.replaceState({safaAdmin:true},'','/admin')}
  function addStoreBackButton(){if(!document.body.classList.contains('safa-admin-route'))return;var bar=document.querySelector('.admin-clean .adminbar');if(!bar||bar.querySelector('[data-safa-store-link]'))return;var button=document.createElement('button');button.type='button';button.dataset.safaStoreLink='1';button.className='logout';button.textContent='STORE';button.title='Return to store';button.addEventListener('click',function(){window.location.href='/' });bar.appendChild(button)}
  function makeSearchIconWork(){var icon=document.querySelector('.header-search span');if(!icon||icon.dataset.safaSearchBound==='1')return;icon.dataset.safaSearchBound='1';icon.setAttribute('role','button');icon.setAttribute('tabindex','0');icon.setAttribute('aria-label','Search products');icon.title='Search products';function openSearch(){if(document.body.classList.contains('safa-admin-route'))return;var links=document.querySelectorAll('.header nav a');if(links[1])links[1].click();window.requestAnimationFrame(function(){var input=document.querySelector('.listingtop input');if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch(e){}}})}icon.addEventListener('click',openSearch);icon.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openSearch()}})}
  function bindAdminEntry(){var button=document.querySelector('.keybutton');if(!button||button.dataset.safaAdminBound==='1')return;button.dataset.safaAdminBound='1';button.addEventListener('click',function(){window.history.pushState({safaAdmin:true},'','/admin')},true)}
  function bootDirectAdminRoute(){if(adminBooted||window.location.pathname.replace(/\/$/,'')!=='/admin')return;var button=document.querySelector('.keybutton');if(!button)return;adminBooted=true;button.click()}
  function applyHeroLogo(){var hero=document.querySelector('.hero'),copy=hero&&hero.querySelector('.hero-copy'),source=document.querySelector('.brand img');if(!hero||!copy||!source||!source.src)return;hero.querySelectorAll('.hero-logo').forEach(function(node){node.remove()});var img=document.createElement('img');img.className='hero-logo';img.src=source.src;img.alt='SAFA';img.decoding='async';img.dataset.safaLogoSrc=source.src;copy.insertBefore(img,copy.firstChild)}
  function sync(){if(observerScheduled)return;observerScheduled=true;window.requestAnimationFrame(function(){observerScheduled=false;var isAdmin=!!document.querySelector('.admin-clean');setAdminRoute(isAdmin);if(isAdmin)addStoreBackButton();makeSearchIconWork();bindAdminEntry();applyHeroLogo();bootDirectAdminRoute();scrollToTopOnViewChange()})}
  window.addEventListener('popstate',function(){if(window.location.pathname.replace(/\/$/,'')!=='/admin'&&document.body.classList.contains('safa-admin-route'))window.location.reload()});
  new MutationObserver(sync).observe(document.documentElement,{subtree:true,childList:true});
  sync();
})();
