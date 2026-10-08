/* VK_ETN — browser database (replaces the old backend).
 * All data lives in the visitor's browser (IndexedDB, falls back to memory).
 * It answers the same paths the old server used ("/api/store", "/api/auth", ...), so the
 * storefront, dashboard and the /app Vue frontend keep working without any server code.
 * Initial data comes from /vk/data/seed.json (falls back to window.VK_DATA defaults).
 */
(function (root) {
  'use strict';

  var DB_NAME = 'vk_etn_db';
  var STORE = 'kv';
  var KEYS = ['products', 'categories', 'orders', 'settings', 'reviews'];
  var SEED_URL = '/vk/data/seed.json';

  var clone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };

  // ---------- storage (IndexedDB key/value) ----------
  var mem = new Map();
  var dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve) {
      try {
        if (!root.indexedDB) return resolve(null);
        var req = root.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
        req.onblocked = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return dbPromise;
  }
  async function get(key, fallback) {
    var db = await openDb();
    if (!db) return mem.has(key) ? clone(mem.get(key)) : fallback;
    return new Promise(function (resolve) {
      try {
        var r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result === undefined ? fallback : r.result); };
        r.onerror = function () { resolve(fallback); };
      } catch (e) { resolve(fallback); }
    });
  }
  async function set(key, value) {
    var v = clone(value);
    var db = await openDb();
    if (!db) { mem.set(key, v); return; }
    return new Promise(function (resolve, reject) {
      try {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(v, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error || new Error('Storage error')); };
        tx.onabort = function () { reject(tx.error || new Error('Storage full')); };
      } catch (e) { reject(e); }
    });
  }
  async function del(key) {
    var db = await openDb();
    if (!db) { mem.delete(key); return; }
    return new Promise(function (resolve) {
      var tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve; tx.onerror = resolve;
    });
  }

  // ---------- helpers ----------
  async function sha256(text) {
    try {
      if (root.crypto && root.crypto.subtle && root.TextEncoder) {
        var buf = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
    } catch (e) { /* fall through */ }
    // fallback (non-secure context): FNV-1a based hex
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < text.length; i++) { h1 ^= text.charCodeAt(i); h1 = Math.imul(h1, 16777619); h2 = Math.imul(h2 ^ h1, 2654435761); }
    return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, '0');
  }
  var hashPassword = function (p) { return sha256('vk_etn:' + p); };
  function randomToken() {
    var a = new Uint8Array(24);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(a); else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function publicUser(u) {
    return { id: u.id, name: u.name, email: u.email, phone: u.phone || '', role: u.role, avatar: u.avatar || '', favorites: Array.isArray(u.favorites) ? u.favorites : [], createdAt: u.createdAt };
  }
  var round1 = function (n) { return Math.round(n * 10) / 10; };
  var ok = function (data) { return { status: 200, data: data }; };
  var fail = function (status, error) { return { status: status, data: { error: error } }; };

  // ---------- first run: seed data + demo admin ----------
  var readyPromise = null;
  function ensure() {
    if (readyPromise) return readyPromise;
    readyPromise = (async function () {
      var missing = [];
      for (var i = 0; i < KEYS.length; i++) if ((await get(KEYS[i])) === undefined) missing.push(KEYS[i]);
      if (missing.length) {
        var seed = null;
        try {
          var res = await fetch(SEED_URL, { cache: 'no-store' });
          if (res.ok) seed = await res.json();
        } catch (e) { /* offline */ }
        var D = root.VK_DATA;
        var defaults = {
          products: seed && seed.products || (D && D.products),
          categories: seed && seed.categories || (D && D.categories),
          settings: seed && seed.settings || (D && D.settings),
          orders: seed && seed.orders || (D && D.seedOrders ? D.seedOrders() : undefined),
          reviews: seed && seed.reviews || (D && D.seedReviews ? D.seedReviews() : undefined),
        };
        for (var j = 0; j < missing.length; j++) if (defaults[missing[j]] !== undefined) await set(missing[j], defaults[missing[j]]);
      }
      var users = await get('users', []);
      if (!users.some(function (u) { return u.role === 'admin'; })) {
        users.push({ id: 1, name: 'VK Admin', email: 'admin@vk.com', phone: '012 345 678', passwordHash: await hashPassword('admin123'), role: 'admin', avatar: '', favorites: [], createdAt: new Date().toISOString() });
        await set('users', users);
      }
      if ((await get('sessions')) === undefined) await set('sessions', {});
    })().catch(function (e) { readyPromise = null; throw e; });
    return readyPromise;
  }

  async function currentUser(token) {
    if (!token) return null;
    var sessions = await get('sessions', {});
    var id = sessions[token];
    if (!id) return null;
    var users = await get('users', []);
    return users.find(function (u) { return u.id === id; }) || null;
  }

  async function readAll(isAdmin) {
    var out = {};
    for (var i = 0; i < KEYS.length; i++) { var v = await get(KEYS[i]); if (v !== undefined) out[KEYS[i]] = v; }
    if (out.settings && out.settings.khqr && !isAdmin) {
      out.settings.khqr = Object.assign({}, out.settings.khqr, { token: '', hasToken: !!out.settings.khqr.token });
    }
    return out;
  }

  // ---------- routes ----------
  async function route(method, path, body, token) {
    await ensure();
    var me = await currentUser(token);
    var isAdmin = !!(me && me.role === 'admin');

    if (path === '/api/health') return ok({ ok: true, mode: 'browser', storage: (await openDb()) ? 'indexeddb' : 'memory' });

    // ----- store -----
    if (path === '/api/store') {
      if (method === 'GET') return ok(await readAll(isAdmin));
      if (method === 'POST') {
        var data = (body && body.data) || {};
        for (var k in data) if (KEYS.indexOf(k) > -1 && (await get(k)) === undefined) await set(k, data[k]);
        return ok(await readAll(isAdmin));
      }
    }
    var m = path.match(/^\/api\/store\/([a-z]+)$/);
    if (m) {
      var key = m[1];
      if (KEYS.indexOf(key) < 0) return fail(404, 'Unknown key');
      if (method === 'PUT') {
        if (!isAdmin) return fail(token ? 403 : 401, 'Admin only');
        if (!body || body.value === undefined) return fail(400, 'Missing value');
        var value = body.value;
        if (key === 'settings' && value && value.khqr) {
          var prev = await get('settings', {});
          if (!value.khqr.token && value.khqr.keepToken && prev.khqr && prev.khqr.token) value.khqr.token = prev.khqr.token;
          delete value.khqr.keepToken; delete value.khqr.hasToken;
        }
        await set(key, value);
        return ok({ ok: true });
      }
      if (key === 'orders' && method === 'POST') {
        var order = body && body.item;
        if (!order || !Array.isArray(order.items) || !order.items.length) return fail(400, 'Invalid order');
        var products = await get('products', []);
        for (var a = 0; a < order.items.length; a++) {
          var it = order.items[a]; var p = products.find(function (x) { return x.id === it.id; });
          if (p && p.stock < it.qty) return fail(409, 'Not enough stock for ' + p.name);
        }
        order.items.forEach(function (it2) {
          var p2 = products.find(function (x) { return x.id === it2.id; });
          if (p2) { p2.stock = Math.max(0, p2.stock - it2.qty); p2.sold = (p2.sold || 0) + it2.qty; }
        });
        var orders = await get('orders', []);
        orders.unshift(order);
        await set('products', products);
        await set('orders', orders);
        return ok({ ok: true, item: order, products: products });
      }
      if (key === 'orders' && method === 'PATCH') {
        var list = await get('orders', []);
        var o = list.find(function (x) { return x.id === (body && body.id); });
        if (!o) return fail(404, 'Not found');
        o.paid = !!body.paid;
        if (o.paid && o.status === 'pending') o.status = 'processing';
        await set('orders', list);
        return ok({ ok: true, item: o });
      }
      return fail(405, 'Not allowed');
    }

    // ----- auth -----
    if (path === '/api/auth') {
      if (method === 'GET') return ok({ user: me ? publicUser(me) : null });
      var b = body || {};
      var email = String(b.email || '').trim().toLowerCase();
      var password = String(b.password || '');
      var users = await get('users', []);
      var sessions = await get('sessions', {});
      if (b.action === 'register') {
        var name = String(b.name || '').trim();
        if (!name || !email || password.length < 6) return fail(400, 'invalid');
        if (users.some(function (u) { return u.email === email; })) return fail(409, 'exists');
        var nu = { id: users.reduce(function (n, u) { return Math.max(n, u.id); }, 0) + 1, name: name, email: email, phone: b.phone || '', passwordHash: await hashPassword(password), role: 'customer', avatar: '', favorites: [], createdAt: new Date().toISOString() };
        users.push(nu); await set('users', users);
        var t1 = randomToken(); sessions[t1] = nu.id; await set('sessions', sessions);
        return ok({ user: publicUser(nu), token: t1 });
      }
      if (b.action === 'login') {
        var hash = await hashPassword(password);
        var u = users.find(function (x) { return x.email === email; });
        if (!u || u.passwordHash !== hash) return fail(401, 'credentials');
        var t2 = randomToken(); sessions[t2] = u.id; await set('sessions', sessions);
        return ok({ user: publicUser(u), token: t2 });
      }
      if (b.action === 'logout') { if (token) { delete sessions[token]; await set('sessions', sessions); } return ok({ ok: true }); }
      return fail(400, 'Unknown action');
    }

    // ----- users -----
    if (path === '/api/users') {
      var all = await get('users', []);
      if (method === 'GET') {
        if (!isAdmin) return fail(token ? 403 : 401, 'Admin only');
        return ok({ users: all.slice().sort(function (x, y) { return String(y.createdAt).localeCompare(String(x.createdAt)); }).map(publicUser) });
      }
      if (method === 'DELETE') {
        if (!isAdmin) return fail(token ? 403 : 401, 'Admin only');
        var ids = (body && body.ids) || [];
        var keep = all.filter(function (x) { return x.role === 'admin' || !(body && body.all) && ids.indexOf(x.id) < 0; });
        await set('users', keep);
        var ss = await get('sessions', {}); var alive = keep.map(function (x) { return x.id; });
        Object.keys(ss).forEach(function (tk) { if (alive.indexOf(ss[tk]) < 0) delete ss[tk]; });
        await set('sessions', ss);
        return ok({ ok: true });
      }
      if (method === 'PATCH') {
        if (!me) return fail(401, 'Login required');
        var pb = body || {};
        var self = all.find(function (x) { return x.id === me.id; });
        if (pb.email) {
          var em = String(pb.email).trim().toLowerCase();
          if (all.some(function (x) { return x.email === em && x.id !== me.id; })) return fail(409, 'Email already used');
          self.email = em;
        }
        if (pb.name) self.name = String(pb.name).trim();
        if (pb.phone !== undefined) self.phone = String(pb.phone);
        if (pb.avatar !== undefined) self.avatar = String(pb.avatar);
        if (Array.isArray(pb.favorites)) self.favorites = pb.favorites.map(String).slice(0, 500);
        if (pb.password) {
          if (String(pb.password).length < 6) return fail(400, 'Password too short');
          self.passwordHash = await hashPassword(String(pb.password));
        }
        await set('users', all);
        return ok({ user: publicUser(self) });
      }
    }

    // ----- reviews -----
    if (path === '/api/reviews') {
      if (!me) return fail(401, 'Login required');
      var reviews = await get('reviews', []);
      var prods = await get('products', []);
      if (method === 'POST') {
        var rb = body || {};
        var rating = Math.min(5, Math.max(1, parseInt(rb.rating, 10) || 0));
        var text = String(rb.text || '').trim().slice(0, 1000);
        if (!rb.productId || !rating || text.length < 2) return fail(400, 'invalid');
        var pr = prods.find(function (x) { return x.id === rb.productId; });
        if (!pr) return fail(404, 'Product not found');
        var review = { id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), productId: pr.id, userId: me.id, name: me.name, avatar: me.avatar || '', rating: rating, text: text, createdAt: new Date().toISOString() };
        reviews.unshift(review);
        var n = Number(pr.reviews) || 0;
        pr.rating = round1(((Number(pr.rating) || 0) * n + rating) / (n + 1)); pr.reviews = n + 1;
        await set('reviews', reviews); await set('products', prods);
        return ok({ review: review, product: { id: pr.id, rating: pr.rating, reviews: pr.reviews } });
      }
      if (method === 'DELETE') {
        var rids = (body && body.ids) || [];
        var removing = reviews.filter(function (r) { return rids.indexOf(r.id) > -1 && (isAdmin || r.userId === me.id); });
        removing.forEach(function (r) {
          var p3 = prods.find(function (x) { return x.id === r.productId; });
          if (p3 && !r.seed) { var c = Number(p3.reviews) || 0; if (c > 1) { p3.rating = round1(Math.max(0, ((Number(p3.rating) || 0) * c - r.rating) / (c - 1))); p3.reviews = c - 1; } }
        });
        var gone = removing.map(function (r) { return r.id; });
        await set('reviews', reviews.filter(function (r) { return gone.indexOf(r.id) < 0; }));
        await set('products', prods);
        return ok({ ok: true, removed: gone, products: prods });
      }
    }

    // ----- KHQR check (no server = demo mode; real Bakong verification needs a server) -----
    if (path === '/api/khqr/check' && method === 'POST') {
      if (!body || !body.qr) return fail(400, 'Missing qr');
      return ok({ paid: null, demo: true, hash: await sha256(String(body.qr)) });
    }

    return fail(404, 'Not found');
  }

  /** request('/api/store', { method, body, token }) -> { status, data } */
  async function request(path, opts) {
    opts = opts || {};
    var method = (opts.method || 'GET').toUpperCase();
    var clean = String(path).split('?')[0];
    try {
      var res = await route(method, clean, clone(opts.body), opts.token || '');
      return { status: res.status, data: clone(res.data) };
    } catch (e) {
      return { status: 500, data: { error: (e && e.message) || 'Storage error' } };
    }
  }

  /** Export / import / reset the whole browser database (used by Settings → Data). */
  async function exportAll() {
    await ensure();
    var out = {};
    for (var i = 0; i < KEYS.length; i++) out[KEYS[i]] = await get(KEYS[i]);
    return out;
  }
  async function importAll(data) {
    for (var i = 0; i < KEYS.length; i++) if (data && data[KEYS[i]] !== undefined) await set(KEYS[i], data[KEYS[i]]);
  }
  async function resetAll() {
    for (var i = 0; i < KEYS.length; i++) await del(KEYS[i]);
    readyPromise = null;
    await ensure();
  }

  root.VK_DB = { request: request, ensure: ensure, exportAll: exportAll, importAll: importAll, resetAll: resetAll };
})(typeof window !== 'undefined' ? window : globalThis);
