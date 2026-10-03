(() => {
  const style = document.createElement('style');
  style.textContent = `
    .safa-product-rating{display:flex;align-items:center;gap:7px;margin:6px 0 10px;font-size:12px;letter-spacing:.02em;color:#8a6a3a;min-height:18px}
    .safa-product-rating .stars{font-size:14px;letter-spacing:1px;white-space:nowrap}
    .safa-product-rating .count{color:#777;letter-spacing:0}
    .safa-modal-rating{margin:4px 0 14px}
  `;
  document.head.appendChild(style);

  let ratings = new Map();
  let loading = false;

  const ratingText = (row) => {
    const count = Number(row.purchase_count || 0);
    const rating = Number(row.purchase_rating || 0);
    if (!count || !rating) return { stars: '☆☆☆☆☆', label: 'No purchases yet' };
    const whole = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars = '★'.repeat(whole) + (half ? '½' : '') + '☆'.repeat(Math.max(0, 5 - whole - (half ? 1 : 0)));
    return { stars, label: `${rating.toFixed(1)} · ${count} ${count === 1 ? 'purchase' : 'purchases'}` };
  };

  const productName = (node) => {
    const heading = node.querySelector('h3');
    return heading?.textContent?.trim() || '';
  };

  const attach = () => {
    if (!ratings.size) return;
    document.querySelectorAll('.product').forEach(card => {
      const name = productName(card);
      const row = ratings.get(name);
      if (!row || card.querySelector('.safa-product-rating')) return;
      const price = card.querySelector('.price');
      if (!price) return;
      const wrap = document.createElement('div');
      wrap.className = 'safa-product-rating';
      const text = ratingText(row);
      wrap.innerHTML = `<span class="stars" aria-label="${text.label}">${text.stars}</span><span class="count">${text.label}</span>`;
      price.insertAdjacentElement('afterend', wrap);
    });

    document.querySelectorAll('.modal-card').forEach(card => {
      const heading = card.querySelector('h2');
      const name = heading?.textContent?.trim() || '';
      const row = ratings.get(name);
      if (!row || card.querySelector('.safa-modal-rating')) return;
      const description = heading?.nextElementSibling;
      if (!heading || !description) return;
      const wrap = document.createElement('div');
      wrap.className = 'safa-product-rating safa-modal-rating';
      const text = ratingText(row);
      wrap.innerHTML = `<span class="stars" aria-label="${text.label}">${text.stars}</span><span class="count">${text.label}</span>`;
      description.insertAdjacentElement('afterend', wrap);
    });
  };

  const load = async () => {
    if (loading) return;
    loading = true;
    try {
      const res = await fetch('/api/product-ratings', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) return;
      const rows = await res.json();
      if (!Array.isArray(rows)) return;
      ratings = new Map(rows.map(row => [String(row.name_en || ''), row]).filter(([name]) => name));
      attach();
    } catch {}
    finally { loading = false; }
  };

  const observer = new MutationObserver(() => attach());
  window.addEventListener('DOMContentLoaded', () => {
    load();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  if (document.readyState !== 'loading') {
    load();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
