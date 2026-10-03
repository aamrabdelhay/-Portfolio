(function(){
  const FILE_TYPES='image/png,image/jpeg,image/webp,image/gif,image/avif';
  function nativeSet(input,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(input,value);else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function addPreview(label,url){
    let preview=label.querySelector('.category-image-preview');
    if(!preview){preview=document.createElement('img');preview.className='category-image-preview';preview.alt='Category preview';label.insertBefore(preview,label.firstChild)}
    if(url)preview.src=url;else preview.removeAttribute('src');
  }
  function enhance(){
    document.querySelectorAll('label').forEach(label=>{
      const text=(label.textContent||'').trim();
      if(!/^Image URL/.test(text)||label.querySelector('.category-image-file'))return;
      const input=label.querySelector('input');
      if(!input)return;
      const wrap=document.createElement('div');wrap.className='category-image-upload';
      const file=document.createElement('input');file.type='file';file.accept=FILE_TYPES;file.className='category-image-file';
      const status=document.createElement('span');status.className='category-image-status';status.textContent='Choose a new image';
      wrap.appendChild(file);wrap.appendChild(status);label.appendChild(wrap);
      if(input.value)addPreview(label,input.value);
      file.addEventListener('change',async()=>{
        const image=file.files?.[0];if(!image)return;
        status.textContent='Uploading…';file.disabled=true;
        try{
          const fd=new FormData();fd.append('file',image);fd.append('folder','categories');
          const r=await fetch('/api/admin/upload',{method:'POST',body:fd,credentials:'same-origin'});
          const x=await r.json().catch(()=>({}));
          if(!r.ok)throw Error(x.error||'Image upload failed');
          nativeSet(input,x.url||'');addPreview(label,x.url||'');status.textContent='Image uploaded — save category to apply it';
        }catch(error){status.textContent=error.message||'Image upload failed';file.value=''}finally{file.disabled=false}
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
})();
