(()=>{
  if(window.__SAFA_ADMIN_FIXES__)return;
  window.__SAFA_ADMIN_FIXES__=true;
  const nativeFetch=window.fetch.bind(window);
  const parse=async r=>r.json().catch(()=>({}));
  const archive=async(type,id)=>{
    const r=await nativeFetch('/api/admin-archive',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'archive',type,id})});
    const x=await parse(r); if(!r.ok)throw Error(x.error||'Archive failed'); return x;
  };
  const findId=async(type,name)=>{
    const endpoint=type==='product'?'/api/admin/products':'/api/admin/categories';
    const r=await nativeFetch(endpoint,{credentials:'same-origin',cache:'no-store'}); const x=await parse(r);
    if(!r.ok||!Array.isArray(x))throw Error(x.error||'Unable to load catalogue');
    const needle=String(name||'').trim().toLowerCase();
    const item=x.find(v=>String(v.name_en||'').trim().toLowerCase()===needle);
    if(!item)throw Error(type==='product'?'Product not found':'Category not found');
    return item.id;
  };
  const updateProductCount=()=>{
    const heading=[...document.querySelectorAll('.orderhead')].find(x=>x.querySelector('h1')?.textContent?.trim()==='Products');
    const note=heading?.querySelector('.muted'); if(note)note.textContent=`${document.querySelectorAll('.producttable .tablerow').length} products loaded`;
  };
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('.delete-btn'); if(!b||b.dataset.safaArchiveBusy==='1')return;
    const productRow=b.closest('.tablerow'),categoryRow=b.closest('.category-row'); if(!productRow&&!categoryRow)return;
    e.preventDefault(); e.stopImmediatePropagation(); b.dataset.safaArchiveBusy='1';
    try{
      const type=productRow?'product':'category';
      if(!confirm(`Move this ${type} to the archive?`))return;
      const name=productRow?.querySelector('.admin-product-name b')?.textContent||categoryRow?.querySelector('b')?.textContent||'';
      await archive(type,await findId(type,name));
      (productRow||categoryRow).remove(); if(type==='product')updateProductCount();
    }catch(err){alert(err.message||'Archive failed')}
    finally{delete b.dataset.safaArchiveBusy}
  },true);

  const prepareImage=file=>new Promise(resolve=>{
    if(!file||!/^(image)\//i.test(file.type))return resolve(file);
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
      try{
        const max=2000,w=img.naturalWidth||1,h=img.naturalHeight||1,s=Math.min(1,max/Math.max(w,h));
        const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(w*s)); canvas.height=Math.max(1,Math.round(h*s));
        const ctx=canvas.getContext('2d',{alpha:true}); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
        try{ctx.filter='contrast(1.035) saturate(1.045) brightness(1.01)'}catch{}
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>{URL.revokeObjectURL(url); if(!blob)return resolve(file); const base=file.name.replace(/\.[^.]+$/,'')||'product'; resolve(new File([blob],`${base}.webp`,{type:'image/webp',lastModified:Date.now()}))},'image/webp',0.92);
      }catch{URL.revokeObjectURL(url);resolve(file)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve(file)}; img.src=url;
  });
  const wireImageInput=input=>{
    if(input.dataset.safaEnhancer==='1')return; input.dataset.safaEnhancer='1';
    input.addEventListener('change',async()=>{
      if(input.dataset.safaReplay==='1')return;
      const file=input.files?.[0]; if(!file)return;
      try{
        const enhanced=await prepareImage(file); if(enhanced===file)return;
        const dt=new DataTransfer(); dt.items.add(enhanced); input.dataset.safaReplay='1'; input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); setTimeout(()=>delete input.dataset.safaReplay,0);
      }catch{}
    });
  };
  const apply=()=>{
    document.querySelectorAll('.productform input[type="file"]').forEach(wireImageInput);
    const styleId='safa-quantity-click-fix'; if(document.getElementById(styleId))return;
    const style=document.createElement('style'); style.id=styleId; style.textContent='.product-options,.quantity-picker{position:relative!important;z-index:50!important;pointer-events:auto!important}.quantity-picker button{position:relative!important;z-index:51!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}'; document.head.appendChild(style);
  };
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true}); apply();
})();
