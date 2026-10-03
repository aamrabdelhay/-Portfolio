(() => {
  const CART_KEY = 'safaCart';
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;

  // Retire the old persistent cart. The active cart lives only in this browsing session.
  try { nativeRemove.call(localStorage, CART_KEY); } catch {}

  Storage.prototype.getItem = function (key) {
    if (key === CART_KEY && this === localStorage) return nativeGet.call(sessionStorage, CART_KEY);
    return nativeGet.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (key === CART_KEY && this === localStorage) return nativeSet.call(sessionStorage, CART_KEY, value);
    return nativeSet.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (key === CART_KEY && this === localStorage) return nativeRemove.call(sessionStorage, CART_KEY);
    return nativeRemove.call(this, key);
  };
})();
