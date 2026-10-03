(function(){
  'use strict';

  function esc(v){return String(v??'').replace(/[&<>\"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[s]));}
  function getOrders(){
    return fetch('/api/admin/orders',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  }
  function addStyles(){
    if(document.getElementById('safa-admin-enhancements-css'))return;
    const s=document.createElement('style');s.id='safa-admin-enhancements-css';
    s.textContent=`
      .archive-item{align-items:center}
      .archive-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .archive-permanent-delete{border-color:#a63232!important;color:#8d2525!important}
      .archive-permanent-delete:hover{background:#f4d6d2!important;border-color:#a63232!important;color:#8d2525!important}
      .safa-shipping-summary{margin-top:14px;padding-top:14px;border-top:1px solid rgba(33,31,27,.08);font-size:11px;color:#6b6b6b;line-height:1.8}
      .safa-shipping-summary strong{display:block;font-size:9px;letter-spacing:1.4px;color:#8b7751;margin-bottom:6px}
      .safa-shipping-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      @media(max-width:640px){.safa-shipping-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  async function permanentlyDelete(type,id,label){
    if(!window.confirm('Permanently delete '+label+'? This cannot be undone.'))return false;
    const r=await fetch('/api/admin-archive',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete_permanently',type,id})});
    const x=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(x.error||'Permanent deletion failed');
    return true;
  }

  function enhanceArchive(){
    const panel=document.querySelector('.archive-panel');if(!panel)return;
    panel.querySelectorAll('.archive-item').forEach(item=>{
      if(item.querySelector('.archive-permanent-delete'))return;
      const restore=item.querySelector('[data-restore-type]');if(!restore)return;
      const type=restore.dataset.restoreType,id=restore.dataset.restoreId;
      if(type!=='order'&&type!=='category')return;
      restore.parentElement.classList.add('archive-actions');
      const b=document.createElement('button');b.type='button';b.className='archive-permanent-delete';b.textContent='DELETE PERMANENTLY';
      b.addEventListener('click',async()=>{try{b.disabled=true;const ok=await permanentlyDelete(type,id,type==='order'?'this order':'this category');if(ok){item.remove()}}catch(e){alert(e.message);b.disabled=false}});
      restore.insertAdjacentElement('afterend',b);
    });
  }

  function enhanceOrders(){
    const cards=[...document.querySelectorAll('.order-card')];if(!cards.length)return;
    getOrders().then(orders=>{
      if(!Array.isArray(orders))return;
      cards.forEach(card=>{
        if(card.querySelector('.safa-shipping-summary'))return;
        const number=(card.querySelector('.order-card-head b')?.textContent||'').replace(/^#/,'').trim();
        const order=orders.find(x=>String(x.order_number||'')===number);if(!order)return;
        const panel=card.querySelector('.safa-order-details');
        if(!panel)return;
        const wrap=document.createElement('div');wrap.className='safa-shipping-summary';
        wrap.innerHTML='<strong>SHIPPING DETAILS</strong><div class="safa-shipping-grid"><span>Governorate<br><b>'+esc(order.governorate||'—')+'</b></span><span>Address<br><b>'+esc(order.address||'—')+'</b></span><span>Building<br><b>'+esc(order.building_number||'—')+'</b></span><span>Floor<br><b>'+esc(order.floor_number||'—')+'</b></span><span>Apartment<br><b>'+esc(order.apartment_number||'—')+'</b></span><span>Phone 2<br><b>'+esc(order.phone2||'—')+'</b></span></div>';
        panel.appendChild(wrap);
      });
    });
  }

  function scan(){addStyles();enhanceArchive();enhanceOrders();}
  const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',scan);setTimeout(scan,200);setTimeout(scan,900);setTimeout(scan,1800);
})();
