/* VK_ETN — router & app bootstrap (Vue 3 SPA, no page refresh) */
(function () {
  const { createApp, computed } = Vue;
  const { createRouter, createWebHistory } = VueRouter;
  const { S, t } = VK;
  const P = VK_PAGES, A = VK_ADMIN_PAGES;

  const StoreLayout = {
    components: { SiteHeader: VK_SHOP.SiteHeader, SiteFooter: VK_SHOP.SiteFooter, BottomNav: VK_SHOP.BottomNav },
    template: `
    <div class="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <main class="flex-1">
        <router-view v-slot="{ Component, route }"><Transition name="page" mode="out-in"><component :is="Component" :key="route.fullPath.split('?')[0]" /></Transition></router-view>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>`
  };

  const routes = [
    {
      path: '/', component: StoreLayout, children: [
        { path: '', component: VK_SHOP.HomePage },
        { path: 'shop', component: VK_SHOP.ShopPage },
        { path: 'product/:id', component: P.ProductPage },
        { path: 'product/:id/about', component: P.ProductAbout },
        { path: 'cart', component: P.CartPage },
        { path: 'checkout', component: P.CheckoutPage, meta: { auth: true } },
        { path: 'receipt/:id', component: P.ReceiptPage },
        { path: 'account', component: P.AccountPage, meta: { auth: true } },
        { path: 'favorites', component: P.FavoritesPage },
        { path: 'about', component: P.AboutPage },
        { path: 'contact', component: P.ContactPage }
      ]
    },
    { path: '/login', component: P.LoginPage, meta: { guest: true } },
    { path: '/register', component: P.RegisterPage, meta: { guest: true } },
    {
      path: '/admin', component: VK_ADMIN.AdminLayout, meta: { admin: true }, children: [
        { path: '', component: VK_ADMIN.AdminDashboard },
        { path: 'products', component: A.AdminProducts },
        { path: 'orders', component: A.AdminOrders },
        { path: 'customers', component: A.AdminCustomers },
        { path: 'categories', component: A.AdminCategories },
        { path: 'stock', component: A.AdminStock },
        { path: 'discounts', component: A.AdminDiscounts },
        { path: 'reviews', component: A.AdminReviews },
        { path: 'settings', component: A.AdminSettings }
      ]
    },
    { path: '/:pathMatch(.*)*', component: StoreLayout, children: [{ path: '', component: P.NotFound }] }
  ];

  const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, saved) { if (saved) return saved; if (to.path === from.path) return false; return { top: 0, behavior: 'smooth' }; }
  });

  router.beforeEach(async (to) => {
    const needsAuthState = to.matched.some((r) => r.meta.admin || r.meta.auth || r.meta.guest);
    // While authentication is initializing: wait, never redirect yet
    if (needsAuthState && !S.authReady) await VK.initAuth();
    const isAdmin = !!(S.user && S.user.role === 'admin');
    if (to.matched.some((r) => r.meta.admin) && !isAdmin) {
      // not an admin session: show login (the current session is NOT cleared)
      VK.toast(t('adminLoginRequired'), 'info');
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    if (to.matched.some((r) => r.meta.auth) && !S.user) { VK.toast(t('loginToCheckout'), 'info'); return { path: '/login', query: { redirect: to.fullPath } }; }
    if (to.matched.some((r) => r.meta.guest) && S.user) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '';
      // a customer asked for the dashboard: let them stay on the login page to sign in as admin (no loop)
      if (redirect.startsWith('/admin') && !isAdmin) return true;
      if (redirect && redirect.startsWith('/')) return redirect;
      return isAdmin ? '/admin' : '/';
    }
  });

  // If the session becomes invalid while on a protected page, go back to login
  Vue.watch(() => S.user, (u) => {
    if (!S.authReady) return;
    const r = router.currentRoute.value;
    if (r.matched.some((m) => m.meta.admin) && (!u || u.role !== 'admin')) router.replace({ path: '/login', query: { redirect: r.fullPath } });
    else if (r.matched.some((m) => m.meta.auth) && !u) router.replace({ path: '/login', query: { redirect: r.fullPath } });
  });

  const App = {
    components: { Toasts: VK_UI.Toasts, ConfirmDialog: VK_UI.ConfirmDialog },
    template: `
    <Transition name="fade" mode="out-in">
      <div v-if="!S.ready" key="l" class="boot-loader"><div class="boot-logo"><i class="fa-solid fa-bag-shopping"></i></div><p>{{ S.settings.siteName }}</p></div>
      <div v-else key="a"><router-view /></div>
    </Transition>
    <Toasts /><ConfirmDialog />`
  };

  const app = createApp(App);
  Object.assign(app.config.globalProperties, { S, t, VK, Math });
  app.directive('click-outside', VK_UI.clickOutside);
  app.use(router);

  // Startup: restore saved language + its fonts, restore/verify auth, load data -> then render (no English-first flash)
  const fontsReady = Promise.race([VK.loadLangFonts(S.lang), new Promise((r) => setTimeout(r, 1200))]);
  Promise.all([VK.load(), fontsReady]).then(() => {
    app.mount('#app');
    // preload the other language's font in the background so the first switch is instant
    setTimeout(() => VK.loadLangFonts(S.lang === 'km' ? 'en' : 'km'), 300);
  });
})();
