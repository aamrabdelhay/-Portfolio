(function(){
  'use strict';
  var fallbackShown=false, searchQuery='', searchMutating=false;
  var AR_EN={
    'العنايه بالبشره':'skincare','العناية بالبشرة':'skincare','بشره':'skin','بشرة':'skin','وجه':'face','العناية بالوجه':'face care','عنايه بالوجه':'face care','العنايه بالوجه':'face care','الشعر':'hair','العناية بالشعر':'hair care','عنايه بالشعر':'hair care','الجسم':'body','العناية بالجسم':'body care','عنايه بالجسم':'body care','الشفايف':'lips','الشفاه':'lips','العناية بالشفاه':'lip care','شفاه':'lip','مرطب':'moisturizer','مرطّب':'moisturizer','مرطب للبشره':'skin moisturizer','كريم':'cream','سيروم':'serum','غسول':'cleanser','منظف':'cleanser','زيت':'oil','ماسك':'mask','قناع':'mask','واقي شمس':'sunscreen','شامبو':'shampoo','بلسم':'conditioner','صابون':'soap','مقشر':'exfoliator','مقشّر':'exfoliator','عطر':'perfume','مكياج':'makeup','مزيل المكياج':'makeup remover','واقي':'protective','رذاذ':'spray','كريم عين':'eye cream','العين':'eye','شفه':'lip','شفايف':'lips'
  };
  var EN_AR={};Object.keys(AR_EN).forEach(function(k){(EN_AR[AR_EN[k]]||(EN_AR[AR_EN[k]]=[])).push(k)});
  Object.keys(EN_AR).forEach(function(k){EN_AR[k]=Array.from(new Set(EN_AR[k]))});
  function norm(v){return String(v??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ـ/g,'').replace(/[^\p{L}\p{N}\s]+/gu,' ').replace(/\s+/g,' ').trim()}
  function lev(a,b){a=norm(a);b=norm(b);if(!a)return b.length;if(!b)return a.length;var prev=Array(b.length+1),i,j;for(j=0;j<prev.length;j++)prev[j]=j;for(i=1;i<=a.length;i++){var cur=[i];for(j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[b.length]}
  function aliases(q){var n=norm(q),out=[n];Object.keys(AR_EN).forEach(function(k){if(n.indexOf(norm(k))!==-1)out.push(AR_EN[k])});Object.keys(EN_AR).forEach(function(k){if(n.indexOf(k)!==-1)out=out.concat(EN_AR[k])});return Array.from(new Set(out.filter(Boolean).map(norm)))}
  function tokenMatch(token,hay){if(token.length<2)return true;if(hay.indexOf(token)!==-1)return true;var words=hay.split(' ');var max=token.length<=3?1:Math.max(1,Math.floor(token.length*.24));return words.some(function(w){return lev(token,w)<=max})}
  function matches(text,q){var h=norm(text),n=norm(q);if(!n)return true;var parts=aliases(n);return parts.some(function(candidate){return candidate.split(' ').filter(Boolean).every(function(t){return tokenMatch(t,h)})})}
  function isSearchInput(el){return el&&el.tagName==='INPUT'&&(el.closest('.header-search')||el.closest('.listingtop'))}
  function restoreInputs(){document.querySelectorAll('.header-search input,.listingtop input').forEach(function(el){if(el.value!==searchQuery){el.value=searchQuery}})}
  function ensureEmpty(panel){if(!panel)return;var grid=panel.closest('.productgrid');if(!grid)return;var empty=grid.querySelector('[data-safa-search-empty]');if(!empty){empty=document.createElement('div');empty.className='panel safa-search-empty';empty.dataset.safaSearchEmpty='1';empty.innerHTML='<p>No products found.</p>';grid.appendChild(empty)}empty.style.display='block'}
  function applySearch(){
    var q=searchQuery;
    document.querySelectorAll('.productgrid').forEach(function(grid){
      var cards=Array.from(grid.querySelectorAll(':scope > .product'));
      if(!cards.length)return;
      var visible=0;
      cards.forEach(function(card){var ok=!q||matches(card.textContent,q);card.style.display=ok?'':'none';if(ok)visible++});
      var empty=grid.querySelector('[data-safa-search-empty]');
      if(q&&visible===0)ensureEmpty(grid.querySelector('.panel'));else if(empty)empty.style.display='none';
    });
    restoreInputs();
  }
  function scheduleSearch(){requestAnimationFrame(function(){applySearch();setTimeout(applySearch,30);setTimeout(applySearch,120)})}
  document.addEventListener('input',function(e){
    if(searchMutating||!isSearchInput(e.target))return;
    searchQuery=e.target.value||'';
    searchMutating=true;
    e.target.value='';
    searchMutating=false;
    scheduleSearch();
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isSearchInput(e.target)){searchQuery='';scheduleSearch()}},true);
  var searchObserver=new MutationObserver(function(){if(searchQuery)applySearch()});
  searchObserver.observe(document.documentElement,{childList:true,subtree:true});

  function isAdminLogin(){return !!document.querySelector('main.admin-clean.login-card form input[type="password"]')}
  function addBackButton(){var main=document.querySelector('main.admin-clean.login-card');if(!main)return;var card=main.querySelector('.login-card');var form=card&&card.querySelector('form');if(!card||!form||card.querySelector('[data-safa-back-store]'))return;var b=document.createElement('button');b.type='button';b.dataset.safaBackStore='1';b.textContent='Back to Store';b.addEventListener('click',function(){closeProductPage();location.assign('/')});form.appendChild(b)}
  function hideSplash(){document.querySelectorAll('.loading-state').forEach(function(el){el.setAttribute('aria-hidden','true')})}
  function productContext(){return !!(location.hash.indexOf('#product=')===0||document.querySelector('.product-page-root,.modal'))}
  function showFallback(){if(fallbackShown||!productContext())return;fallbackShown=true;var old=document.querySelector('.safa-crash-fallback');if(old)return;var wrap=document.createElement('div');wrap.className='safa-crash-fallback';wrap.innerHTML='<div class="safa-crash-fallback__card"><div class="safa-crash-fallback__eyebrow">SAFA / PRODUCT</div><h1>Product unavailable</h1><p>Something went wrong while opening this product. You can safely return to the store.</p><button type="button" data-safa-crash-back>Back to Store</button></div>';document.body.appendChild(wrap);wrap.querySelector('[data-safa-crash-back]').addEventListener('click',function(){closeProductPage();location.assign('/')})}
  function closeProductPage(){var root=document.getElementById('product-page-root');if(root){root.innerHTML='';root.className='';root.removeAttribute('aria-hidden');root.remove()}if(location.hash.indexOf('#product=')===0){history.replaceState({},'',location.pathname+location.search)}fallbackShown=false;window.scrollTo(0,0)}
  document.addEventListener('click',function(e){var back=e.target.closest&&e.target.closest('.pp-back');if(!back)return;e.preventDefault();e.stopImmediatePropagation();closeProductPage()},true);

  function applyLogo(config){var hero=document.querySelector('.hero');if(!hero)return false;var copy=hero.querySelector('.hero-copy');if(!copy)return false;if(!config||!config.logo){var old=copy.querySelector('.hero-logo-control');if(old)old.remove();return true}var img=copy.querySelector('.hero-logo-control');if(!img){copy.querySelectorAll('.hero-logo').forEach(function(x){x.remove()});img=document.createElement('img');img.className='hero-logo-control';img.alt='SAFA';copy.prepend(img)}img.src=config.logo;img.style.cssText=['width:'+Math.min(1200,Math.max(40,Number(config.size)||420))+'px','max-width:80vw','height:auto','object-fit:contain','display:block','margin:0 auto 28px','background:transparent','border:0','border-radius:0','box-shadow:none','filter:none','padding:0','mix-blend-mode:normal','transform:translate('+(Number(config.x)||0)+'%,'+(Number(config.y)||0)+'%)','animation:var(--safa-logo-anim) '+Math.min(2500,Math.max(200,Number(config.duration)||900))+'ms ease both'].join(';');img.style.setProperty('--safa-logo-anim',({none:'none',fade:'lc-fade','slide-up':'lc-slide',zoom:'lc-zoom',float:'lc-float'}[config.animation]||'lc-fade'));return true}
  function refreshLogo(){Promise.allSettled([fetch('/api/logo-config',{credentials:'same-origin',cache:'no-store'}),fetch('/api/settings/logo',{credentials:'same-origin',cache:'no-store'})]).then(function(rs){var cfg={logo:'',x:0,y:0,size:420,animation:'fade',duration:900};if(rs[0].status==='fulfilled'&&rs[0].value.ok){return rs[0].value.json().catch(function(){return {}}).then(function(a){return Promise.all([a,rs[1].status==='fulfilled'&&rs[1].value.ok?rs[1].value.json().catch(function(){return {}}):Promise.resolve({})])}).then(function(pair){Object.assign(cfg,pair[0]||{},!cfg.logo&&pair[1]?{logo:pair[1].logo||''}:{});return cfg})}return rs[1].status==='fulfilled'&&rs[1].value.ok?rs[1].value.json().then(function(a){cfg.logo=a.logo||'';return cfg}).catch(function(){return cfg}):cfg}).then(function(cfg){applyLogo(cfg);window.__safaLogoConfig=cfg})}
  var observer=new MutationObserver(function(){hideSplash();if(isAdminLogin())addBackButton();if(document.querySelector('.hero')&&!document.querySelector('.hero-logo-control')&&window.__safaLogoConfig)applyLogo(window.__safaLogoConfig);if(searchQuery)applySearch()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('error',function(e){if(productContext()){showFallback();e.preventDefault()}},true);
  window.addEventListener('unhandledrejection',function(e){if(productContext()){showFallback();e.preventDefault()}},true);
  document.addEventListener('DOMContentLoaded',function(){hideSplash();addBackButton();refreshLogo();scheduleSearch()});
  setTimeout(refreshLogo,0);setTimeout(refreshLogo,250);
})();
