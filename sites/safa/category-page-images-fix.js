(function(){
  async function addCategoryImages(){
    const cards=document.querySelectorAll('.category-page .cat');
    if(!cards.length)return;
    try{
      const [cr,pr]=await Promise.all([fetch('/api/categories'),fetch('/api/products')]);
      if(!cr.ok||!pr.ok)return;
      const categories=await cr.json();
      const products=await pr.json();
      const normalize=v=>String(v||'').toLowerCase().trim();
      cards.forEach((card,index)=>{
        const c=categories[index];
        if(!c)return;
        const product=products.find(p=>String(p.category_id)===String(c.id)&&p.images&&p.images[0]&&p.images[0].url)
          ||products.find(p=>normalize(p.category_en)===normalize(c.name_en)&&p.images&&p.images[0]&&p.images[0].url);
        const image=c.category_image_url||c.image_url||product?.images?.[0]?.url;
        if(image){
          card.style.backgroundImage=`linear-gradient(180deg,transparent 35%,#211f1bcc 100%),url(${JSON.stringify(image)})`;
          card.style.backgroundSize='cover,cover';
          card.style.backgroundPosition='center,center';
          card.style.backgroundRepeat='no-repeat';
        }
      });
    }catch{}
  }
  function run(){setTimeout(addCategoryImages,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
})();
