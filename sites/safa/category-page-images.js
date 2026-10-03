(function(){
  async function addCategoryImages(){
    const cards=document.querySelectorAll('.category-page .cat');
    if(!cards.length)return;
    try{
      const [cr,pr]=await Promise.all([fetch('/api/categories',{credentials:'same-origin'}),fetch('/api/products',{credentials:'same-origin'})]);
      if(!cr.ok||!pr.ok)return;
      const categories=await cr.json();
      const products=await pr.json();
      const normalize=v=>String(v||'').toLowerCase().trim();
      const fallback={
        skincare:'https://images.unsplash.com/photo-1556229010-9f7e3f2f9d5a?auto=format&fit=crop&w=900&q=85',
        'face care':'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
        'hair care':'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85',
        'body care':'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85',
        'lip care':'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85'
      };
      cards.forEach((card,index)=>{
        const c=categories[index];
        if(!c)return;
        const name=normalize(c.name_en);
        const product=(Array.isArray(products)?products:[]).find(p=>String(p.category_id)===String(c.id)&&p.images?.[0]?.url)
          ||(Array.isArray(products)?products:[]).find(p=>normalize(p.category_en)===name&&p.images?.[0]?.url);
        const image=c.category_image_url||c.image_url||product?.images?.[0]?.url||fallback[name];
        if(image){
          const safe=String(image).replace(/"/g,'%22');
          card.style.backgroundImage='linear-gradient(180deg,transparent 30%,#211f1bcc 100%),url("'+safe+'")';
          card.style.backgroundSize='cover,cover';
          card.style.backgroundPosition='center,center';
          card.style.backgroundRepeat='no-repeat';
          card.classList.add('category-page-image');
        }
      });
    }catch{}
  }
  function run(){setTimeout(addCategoryImages,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
})();
