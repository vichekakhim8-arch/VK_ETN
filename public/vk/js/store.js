/* VK_ETN — global reactive store (Vue 3) */
(function () {
  const { reactive, computed, watch } = Vue;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const S = reactive({
    ready: false,
    lang: localStorage.getItem('vk_lang') || 'en',
    dark: document.documentElement.classList.contains('dark'),
    products: [], categories: [], orders: [], reviews: [], settings: clone(VK_DATA.settings),
    token: localStorage.getItem('vk_token') || '',
    user: localStorage.getItem('vk_token') ? LS.get('vk_user', null) : null,
    authReady: false,
    cart: LS.get('vk_cart', []), wishlist: LS.get('vk_wish', []), coupon: null,
    toasts: [], confirm: null
  });

  watch(() => S.cart, (v) => LS.set('vk_cart', v), { deep: true });
  watch(() => S.wishlist, (v) => LS.set('vk_wish', v), { deep: true });

  function t(key) {
    const d = VK_I18N[S.lang] || VK_I18N.en;
    return d[key] !== undefined ? d[key] : (VK_I18N.en[key] !== undefined ? VK_I18N.en[key] : key);
  }
  // Load the font faces a language needs (Khmer glyphs are downloaded on first use otherwise -> visible font swap)
  function loadLangFonts(l) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const sample = l === 'km' ? 'កខគឃងក្សាំ' : 'Aa';
    const fam = l === 'km' ? '"Kantumruy Pro"' : '"Inter"';
    return Promise.all(['400', '500', '600'].map((w) => document.fonts.load(w + ' 15px ' + fam, sample).catch(() => {}))).catch(() => {});
  }
  // Instant, flicker-free switch: Vue reactivity updates only the translated text in place.
  // No reload, no route change, no remount, auth/session untouched.
  function setLang(l) {
    if (l !== 'en' && l !== 'km') return;
    if (l === S.lang) return;
    S.lang = l;
    try { localStorage.setItem('vk_lang', l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
  }
  function toggleDark() {
    S.dark = !S.dark;
    document.documentElement.classList.toggle('dark', S.dark);
    localStorage.setItem('vk_theme', S.dark ? 'dark' : 'light');
  }

  let toastId = 0;
  function toast(msg, type = 'success') {
    const id = ++toastId;
    S.toasts.push({ id, msg, type });
    setTimeout(() => { const i = S.toasts.findIndex((x) => x.id === id); if (i > -1) S.toasts.splice(i, 1); }, 3200);
  }
  function askConfirm(opts) {
    return new Promise((resolve) => { S.confirm = Object.assign({ title: t('areYouSure'), text: t('cannotUndo'), danger: true }, opts, { resolve }); });
  }

  async function api(url, opts = {}) {
    // No backend: every request is answered by the browser database (localdb.js)
    const sentToken = S.token;
    const res = await VK_DB.request(url, { method: opts.method || 'GET', body: opts.body, token: S.token });
    const data = res.data || {};
    if (res.status >= 400) {
      // stored session no longer exists -> genuine invalid session
      if (res.status === 401 && sentToken && sentToken === S.token && !url.startsWith('/api/auth')) logout(true);
      const err = new Error(data.error || 'Request failed'); err.status = res.status; err.data = data; throw err;
    }
    return data;
  }

  function mergeSettings(s) {
    const d = clone(VK_DATA.settings);
    const out = Object.assign(d, s || {});
    out.khqr = Object.assign(clone(VK_DATA.settings.khqr), (s && s.khqr) || {});
    out.discount = Object.assign(clone(VK_DATA.settings.discount), (s && s.discount) || {});
    if (!Array.isArray(out.coupons)) out.coupons = [];
    if (!Array.isArray(out.hero)) out.hero = clone(VK_DATA.settings.hero);
    out.promo = Object.assign(clone(VK_DATA.settings.promo), (s && s.promo) || {});
    out.about = Object.assign({ en: '', km: '' }, (s && s.about) || {});
    return out;
  }

  async function load() {
    try {
      let data = await api('/api/store');
      const defaults = { products: VK_DATA.products, categories: VK_DATA.categories, settings: VK_DATA.settings };
      const missing = {};
      Object.keys(defaults).forEach((k) => { if (data[k] === undefined) missing[k] = defaults[k]; });
      if (data.orders === undefined) missing.orders = VK_DATA.seedOrders();
      if (data.reviews === undefined) missing.reviews = VK_DATA.seedReviews();
      if (Object.keys(missing).length) data = await api('/api/store', { method: 'POST', body: { data: missing } });
      S.products = data.products || [];
      S.categories = data.categories || [];
      S.orders = data.orders || [];
      S.reviews = data.reviews || [];
      S.settings = mergeSettings(data.settings);
    } catch (e) {
      S.products = clone(VK_DATA.products); S.categories = clone(VK_DATA.categories); S.orders = VK_DATA.seedOrders(); S.reviews = VK_DATA.seedReviews();
      toast(t('offlineMode') + ': ' + e.message, 'error');
    }
    await initAuth();
    document.title = S.settings.siteName + ' — Technology Store';
    S.ready = true;
  }

  // ===== Auth initialization =====
  // App start -> restore stored session -> verify it once -> authReady = true -> router may run protected checks.
  async function verifySession() {
    const token = S.token;
    if (!token) return;
    let data;
    try {
      const res = await VK_DB.request('/api/auth', { token });
      if (res.status !== 200) return; // storage problem: keep the session
      data = res.data;
    } catch (e) { return; }
    if (token !== S.token) return; // user logged in/out meanwhile: ignore stale answer
    if (data && typeof data === 'object' && 'user' in data) {
      if (data.user && data.user.id) setUser(data.user, token);
      else if (data.user === null) logout(true); // server explicitly says this token is not a valid session
    }
  }
  let authPromise = null;
  function initAuth() {
    if (!authPromise) authPromise = verifySession().finally(() => { S.authReady = true; });
    return authPromise;
  }

  async function save(key) {
    try { await api('/api/store/' + key, { method: 'PUT', body: { value: S[key] } }); return true; }
    catch (e) { toast(e.status === 403 ? 'Admin login required' : e.message, 'error'); return false; }
  }

  let favTimer;
  function syncFavs() {
    if (!S.user) return;
    clearTimeout(favTimer);
    favTimer = setTimeout(() => api('/api/users', { method: 'PATCH', body: { favorites: [...S.wishlist] } }).catch(() => {}), 500);
  }
  function setUser(user, token) {
    S.user = user; S.token = token;
    LS.set('vk_user', user); localStorage.setItem('vk_token', token);
    if (user && Array.isArray(user.favorites)) {
      const merged = [...new Set([...user.favorites, ...S.wishlist])];
      S.wishlist.splice(0, S.wishlist.length, ...merged);
      if (merged.length !== user.favorites.length) syncFavs();
    }
  }
  async function login(email, password) {
    const r = await api('/api/auth', { method: 'POST', body: { action: 'login', email, password } });
    setUser(r.user, r.token); return r.user;
  }
  async function register(payload) {
    const r = await api('/api/auth', { method: 'POST', body: Object.assign({ action: 'register' }, payload) });
    setUser(r.user, r.token); return r.user;
  }
  function logout(silent) {
    if (S.token) VK_DB.request('/api/auth', { method: 'POST', body: { action: 'logout' }, token: S.token }).catch(() => {});
    S.user = null; S.token = '';
    localStorage.removeItem('vk_user'); localStorage.removeItem('vk_token');
    S.wishlist.splice(0);
    if (!silent) toast(t('logout'), 'info');
  }
  async function updateProfile(payload) {
    const r = await api('/api/users', { method: 'PATCH', body: payload });
    if (r.user) setUser(r.user, S.token);
    return r.user;
  }

  // ===== Pricing =====
  function discountOf(p) {
    if (!p) return 0;
    const g = S.settings.discount && S.settings.discount.active ? Number(S.settings.discount.percent) || 0 : 0;
    return Math.max(Number(p.discount) || 0, g);
  }
  function priceOf(p) { return +(p.price * (1 - discountOf(p) / 100)).toFixed(2); }
  function money(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(d, withTime) {
    const x = new Date(d);
    const opts = { day: '2-digit', month: 'short', year: 'numeric' };
    if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
    return x.toLocaleString('en-GB', opts);
  }
  function L(v) { if (!v) return ''; if (typeof v === 'string') return v; return v[S.lang] || v.en || ''; }
  function tagline() {
    const v = S.settings.tagline;
    if (v && typeof v === 'object') return v[S.lang] || v.en || '';
    if (!v || v === VK_DATA.settings.tagline) return t('authTitle');
    return v;
  }
  function catName(id) { const c = S.categories.find((x) => x.id === id); return c ? (c.name[S.lang] || c.name.en) : id; }
  function productById(id) { return S.products.find((p) => p.id === id); }

  // ===== Cart =====
  function addToCart(p, qty = 1) {
    if (!p || p.stock <= 0) { toast(t('outOfStock'), 'error'); return; }
    const line = S.cart.find((x) => x.id === p.id);
    const current = line ? line.qty : 0;
    const next = Math.min(p.stock, current + qty);
    if (line) line.qty = next; else S.cart.push({ id: p.id, qty: next });
    toast(t('added') + ': ' + p.name);
  }
  function setQty(id, qty) {
    const line = S.cart.find((x) => x.id === id); const p = productById(id);
    if (!line) return;
    line.qty = Math.max(1, Math.min(p ? p.stock : 99, qty));
  }
  function removeFromCart(id) { const i = S.cart.findIndex((x) => x.id === id); if (i > -1) S.cart.splice(i, 1); }
  function toggleWish(id) {
    const i = S.wishlist.indexOf(id);
    if (i > -1) { S.wishlist.splice(i, 1); toast(t('removedFav'), 'info'); } else { S.wishlist.push(id); toast(t('addedFav')); }
    syncFavs();
  }
  function clearWish() { S.wishlist.splice(0); syncFavs(); }

  // ===== Reviews / comments =====
  async function addReview(productId, rating, text) {
    const r = await api('/api/reviews', { method: 'POST', body: { productId, rating, text } });
    S.reviews.unshift(r.review);
    const p = productById(productId);
    if (p && r.product) { p.rating = r.product.rating; p.reviews = r.product.reviews; }
    return r.review;
  }
  async function deleteReviews(ids) {
    const r = await api('/api/reviews', { method: 'DELETE', body: { ids } });
    S.reviews = S.reviews.filter((x) => !r.removed.includes(x.id));
    if (r.products) S.products = r.products;
    return r.removed;
  }
  function timeAgo(d) {
    const s = Math.max(1, Math.floor((Date.now() - new Date(d)) / 1000));
    const km = S.lang === 'km';
    const units = [[31536000, km ? 'ឆ្នាំ' : 'y'], [2592000, km ? 'ខែ' : 'mo'], [86400, km ? 'ថ្ងៃ' : 'd'], [3600, km ? 'ម៉ោង' : 'h'], [60, km ? 'នាទី' : 'min']];
    for (const [sec, u] of units) if (s >= sec) return Math.floor(s / sec) + (km ? ' ' + u + 'មុន' : u + ' ago');
    return km ? 'ឥឡូវនេះ' : 'just now';
  }

  const cartLines = computed(() => S.cart.map((l) => { const p = productById(l.id); return p ? { ...l, product: p, price: priceOf(p), line: priceOf(p) * l.qty } : null; }).filter(Boolean));
  const cartCount = computed(() => S.cart.reduce((a, b) => a + b.qty, 0));
  const totals = computed(() => {
    const subtotal = +cartLines.value.reduce((a, b) => a + b.line, 0).toFixed(2);
    const discount = S.coupon ? +(subtotal * S.coupon.percent / 100).toFixed(2) : 0;
    const after = subtotal - discount;
    const shipping = subtotal === 0 || after >= Number(S.settings.freeShippingOver) ? 0 : Number(S.settings.shippingFee);
    return { subtotal, discount, shipping, total: +(after + shipping).toFixed(2) };
  });
  function applyCoupon(code) {
    const c = (S.settings.coupons || []).find((x) => x.active && x.code.toLowerCase() === String(code).trim().toLowerCase());
    S.coupon = c ? { code: c.code, percent: Number(c.percent) } : null;
    toast(c ? t('couponApplied') : t('couponInvalid'), c ? 'success' : 'error');
    return !!c;
  }

  async function placeOrder(info) {
    const tt = totals.value;
    const order = {
      id: 'VK' + String(Date.now()).slice(-7),
      userId: S.user ? S.user.id : null,
      customer: info.customer,
      items: cartLines.value.map((l) => ({ id: l.id, name: l.product.name, image: l.product.images[0], price: l.price, qty: l.qty, category: l.product.category })),
      subtotal: tt.subtotal, discount: tt.discount, coupon: S.coupon ? S.coupon.code : '', shipping: tt.shipping, total: tt.total,
      payment: info.payment, paid: false, status: 'pending', note: info.note || '', createdAt: new Date().toISOString()
    };
    const r = await api('/api/store/orders', { method: 'POST', body: { item: order } });
    S.orders.unshift(r.item);
    if (r.products) S.products = r.products;
    S.cart.splice(0); S.coupon = null;
    return r.item;
  }
  async function markOrderPaid(id) {
    const r = await api('/api/store/orders', { method: 'PATCH', body: { id, paid: true } });
    const o = S.orders.find((x) => x.id === id);
    if (o) Object.assign(o, r.item);
    return r.item;
  }

  function khqrString(amount, billNumber) {
    const k = S.settings.khqr;
    return VK_UTIL.khqrPayload({ accountId: k.accountId, merchantName: k.merchantName, city: k.city, currency: k.currency, amount, billNumber, storeLabel: S.settings.siteName });
  }

  function readFileAsDataURL(file, maxW = 900) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const c = document.createElement('canvas'); c.width = img.width * scale; c.height = img.height * scale;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject; img.src = reader.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  window.VK = {
    S, t, setLang, loadLangFonts, initAuth, verifySession, toggleDark, toast, askConfirm, api, load, save, login, register, logout, updateProfile,
    L, tagline, discountOf, priceOf, money, fmtDate, catName, productById, addToCart, setQty, removeFromCart, toggleWish, clearWish, addReview, deleteReviews, timeAgo,
    cartLines, cartCount, totals, applyCoupon, placeOrder, markOrderPaid, khqrString, readFileAsDataURL, clone
  };
})();
