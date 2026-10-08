/* VK_ETN — storefront layout (responsive app-like), home & shop (view all) */
(function () {
  const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;
  const { S, t } = VK;
  const { clickOutside, Logo, LangSwitch, ThemeToggle, Stars, LiveSearch } = VK_UI;

  const iconBtn = 'relative grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition';

  // ================= HEADER =================
  const SiteHeader = {
    components: { Logo, LangSwitch, ThemeToggle, LiveSearch },
    directives: { clickOutside },
    setup() {
      const router = VueRouter.useRouter();
      const route = VueRouter.useRoute();
      const q = ref('');
      const scrolled = ref(false);
      const drawer = ref(false);
      const mSearch = ref(false);
      const catOpen = ref(false);
      const userOpen = ref(false);
      const onScroll = () => { scrolled.value = window.scrollY > 8; };
      onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
      onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
      watch(() => route.fullPath, () => { drawer.value = false; catOpen.value = false; userOpen.value = false; mSearch.value = false; });
      watch(drawer, (v) => { document.body.style.overflow = v ? 'hidden' : ''; });
      const search = () => router.push({ path: '/shop', query: q.value ? { q: q.value } : {} });
      const logout = () => { VK.logout(); router.push('/'); };
      return { q, scrolled, drawer, mSearch, catOpen, userOpen, search, logout, VK, route, iconBtn };
    },
    template: `
    <header class="sticky top-0 z-40 transition-all duration-300 no-print" :class="scrolled ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-white dark:bg-slate-950 border-b border-transparent'">
      <div class="mx-auto flex h-16 lg:h-[72px] max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-6">
        <button @click="drawer=true" :class="iconBtn" class="lg:hidden -ml-1" aria-label="menu"><i class="fa-solid fa-bars-staggered"></i></button>
        <Logo class="lg:mr-4" />
        <nav class="ml-4 hidden items-center gap-7 text-[14px] font-medium lg:flex">
          <router-link to="/" class="nav-link text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition" exact-active-class="!text-brand-700 dark:!text-brand-400">{{ t('home') }}</router-link>
          <router-link to="/shop" class="nav-link text-slate-600 dark:text-slate-300 hover:text-brand-600 transition" :class="route.path==='/shop' && 'active !text-brand-700 dark:!text-brand-400'">{{ t('shop') }}</router-link>
          <div class="relative" v-click-outside="() => catOpen=false">
            <button @click="catOpen=!catOpen" class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition">{{ t('categories') }} <i class="fa-solid fa-chevron-down text-[9px] transition" :class="catOpen && 'rotate-180'"></i></button>
            <Transition name="pop">
              <div v-if="catOpen" class="absolute left-1/2 top-9 w-[440px] -translate-x-1/2 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl">
                <router-link v-for="c in S.categories" :key="c.id" :to="{path:'/shop', query:{cat:c.id}}" class="flex items-center gap-3 rounded-xl p-2.5 hover:bg-brand-50 dark:hover:bg-slate-800 transition">
                  <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400"><i class="fa-solid" :class="c.icon"></i></span>
                  <span class="text-sm">{{ c.name[S.lang] || c.name.en }}</span>
                </router-link>
              </div>
            </Transition>
          </div>
          <router-link to="/about" class="nav-link text-slate-600 dark:text-slate-300 hover:text-brand-600 transition" exact-active-class="!text-brand-700 dark:!text-brand-400">{{ t('about') }}</router-link>
          <router-link to="/contact" class="nav-link text-slate-600 dark:text-slate-300 hover:text-brand-600 transition" exact-active-class="!text-brand-700 dark:!text-brand-400">{{ t('contact') }}</router-link>
        </nav>
        <LiveSearch class="ml-auto hidden md:block w-56 xl:w-72" />
        <div class="ml-auto md:ml-0 flex items-center gap-1 sm:gap-1.5">
          <button @click="mSearch=!mSearch" :class="iconBtn" class="md:hidden"><i class="fa-solid" :class="mSearch ? 'fa-xmark' : 'fa-magnifying-glass'"></i></button>
          <router-link v-if="S.user && S.user.role==='admin'" to="/admin" class="hidden lg:flex h-10 items-center gap-2 rounded-[5px] bg-brand-600 px-3.5 text-[13px] font-medium text-white hover:bg-brand-700 transition"><i class="fa-solid fa-gauge-high text-xs"></i>{{ t('dashboard') }}</router-link>
          <LangSwitch class="hidden sm:block" />
          <ThemeToggle />
          <router-link to="/favorites" :class="iconBtn" class="hidden lg:grid" :title="t('favorites')">
            <i class="fa-regular fa-heart text-[17px]"></i>
            <Transition name="pop"><span v-if="S.wishlist.length" :key="S.wishlist.length" class="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white ring-2 ring-white dark:ring-slate-950">{{ S.wishlist.length }}</span></Transition>
          </router-link>
          <div class="relative hidden lg:block" v-click-outside="() => userOpen=false">
            <button @click="userOpen=!userOpen" :class="iconBtn" class="overflow-hidden">
              <img v-if="S.user && S.user.avatar" :src="S.user.avatar" class="h-8 w-8 rounded-full object-cover">
              <span v-else-if="S.user" class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-medium text-white">{{ S.user.name[0] }}</span>
              <i v-else class="fa-regular fa-user text-[17px]"></i>
            </button>
            <Transition name="pop">
              <div v-if="userOpen" class="absolute right-0 top-12 w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl">
                <template v-if="S.user">
                  <div class="flex items-center gap-3 px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <img v-if="S.user.avatar" :src="S.user.avatar" class="h-9 w-9 rounded-full object-cover"><span v-else class="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm text-white">{{ S.user.name[0] }}</span>
                    <div class="min-w-0"><p class="font-medium text-sm truncate">{{ S.user.name }}</p><p class="text-xs text-slate-500 truncate">{{ S.user.email }}</p></div>
                  </div>
                  <router-link v-if="S.user.role==='admin'" to="/admin" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-gauge w-4 text-brand-600"></i>{{ t('dashboard') }}</router-link>
                  <router-link :to="{path:'/account', query:{tab:'profile'}}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-user w-4 text-brand-600"></i>{{ t('profile') }}</router-link>
                  <router-link :to="{path:'/account', query:{tab:'orders'}}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-box w-4 text-brand-600"></i>{{ t('myOrders') }}</router-link>
                  <router-link to="/favorites" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-heart w-4 text-brand-600"></i>{{ t('favorites') }}</router-link>
                  <button @click="logout" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-solid fa-arrow-right-from-bracket w-4"></i>{{ t('logout') }}</button>
                </template>
                <template v-else>
                  <router-link to="/login" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-right-to-bracket w-4 text-brand-600"></i>{{ t('login') }}</router-link>
                  <router-link to="/register" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-user-plus w-4 text-brand-600"></i>{{ t('register') }}</router-link>
                </template>
              </div>
            </Transition>
          </div>
          <router-link to="/cart" :class="iconBtn">
            <i class="fa-solid fa-cart-shopping text-[17px]"></i>
            <Transition name="pop"><span v-if="VK.cartCount.value" :key="VK.cartCount.value" class="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-medium text-white ring-2 ring-white dark:ring-slate-950">{{ VK.cartCount.value }}</span></Transition>
          </router-link>
        </div>
      </div>
      <!-- mobile search -->
      <Transition name="slide-down">
        <div v-if="mSearch" class="md:hidden border-t border-slate-100 dark:border-slate-800 px-3 py-2.5"><LiveSearch full autofocus /></div>
      </Transition>
      <!-- mobile drawer -->
      <Teleport to="body">
        <Transition name="fade"><div v-if="drawer" class="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="drawer=false"></div></Transition>
        <Transition name="drawer">
          <aside v-if="drawer" class="fixed inset-y-0 left-0 z-[61] flex w-[84%] max-w-[320px] flex-col bg-white dark:bg-slate-950 shadow-2xl lg:hidden">
            <div class="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4"><Logo small /><button @click="drawer=false" :class="iconBtn"><i class="fa-solid fa-xmark"></i></button></div>
            <div class="flex-1 overflow-y-auto p-3">
              <router-link v-if="S.user" :to="{path:'/account', query:{tab:'profile'}}" class="mb-3 flex items-center gap-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 p-3">
                <img v-if="S.user.avatar" :src="S.user.avatar" class="h-11 w-11 rounded-full object-cover"><span v-else class="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-white">{{ S.user.name[0] }}</span>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ S.user.name }}</p><p class="truncate text-xs text-slate-500">{{ S.user.email }}</p></div><i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
              </router-link>
              <div v-else class="mb-3 grid grid-cols-2 gap-2">
                <router-link to="/login" class="rounded-xl bg-brand-600 py-2.5 text-center text-sm font-medium text-white">{{ t('login') }}</router-link>
                <router-link to="/register" class="rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-center text-sm font-medium">{{ t('register') }}</router-link>
              </div>
              <p class="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('menu') }}</p>
              <router-link v-for="m in [['/', 'fa-house', 'home'], ['/shop', 'fa-store', 'shop'], ['/favorites', 'fa-heart', 'favorites'], ['/about', 'fa-circle-info', 'about'], ['/contact', 'fa-envelope', 'contact']]" :key="m[0]" :to="m[0]" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-slate-800" exact-active-class="bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><i class="fa-solid w-5 text-center text-slate-400" :class="m[1]"></i>{{ t(m[2]) }}</router-link>
              <router-link v-if="S.user && S.user.role==='admin'" to="/admin" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-gauge w-5 text-center text-slate-400"></i>{{ t('dashboard') }}</router-link>
              <p class="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('categories') }}</p>
              <router-link v-for="c in S.categories" :key="c.id" :to="{path:'/shop', query:{cat:c.id}}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800">
                <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs"><i class="fa-solid" :class="c.icon"></i></span>{{ c.name[S.lang] || c.name.en }}
              </router-link>
            </div>
            <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 safe-bottom">
              <LangSwitch up /><button v-if="S.user" @click="logout" class="text-sm text-red-500"><i class="fa-solid fa-arrow-right-from-bracket mr-1.5"></i>{{ t('logout') }}</button>
            </div>
          </aside>
        </Transition>
      </Teleport>
    </header>`
  };

  // ================= MOBILE BOTTOM NAV (app-like) =================
  const BottomNav = {
    setup() {
      const route = VueRouter.useRoute();
      const items = computed(() => [
        { to: '/', icon: 'fa-house', label: 'home', match: (p) => p === '/' },
        { to: '/shop', icon: 'fa-store', label: 'shop', match: (p) => p.startsWith('/shop') },
        { to: '/favorites', icon: 'fa-heart', label: 'favorites', match: (p) => p.startsWith('/favorites'), badge: S.wishlist.length, red: true },
        { to: '/cart', icon: 'fa-cart-shopping', label: 'cart', match: (p) => p.startsWith('/cart') || p.startsWith('/checkout'), badge: VK.cartCount.value },
        { to: S.user ? '/account' : '/login', icon: 'fa-user', label: 'account', match: (p) => p.startsWith('/account') || p.startsWith('/login') || p.startsWith('/register') }
      ]);
      const hidden = computed(() => /^\/product\/[^/]+\/?$/.test(route.path));
      return { items, route, hidden };
    },
    template: `
    <Transition name="sheet">
      <nav v-if="!hidden" class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg lg:hidden no-print safe-bottom">
        <div class="mx-auto grid h-16 max-w-lg grid-cols-5">
          <router-link v-for="it in items" :key="it.label" :to="it.to" class="relative flex flex-col items-center justify-center gap-1 text-[10.5px] transition" :class="it.match(route.path) ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'">
            <span class="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand-600 transition-all duration-300" :class="it.match(route.path) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'"></span>
            <span class="relative">
              <i class="text-[18px] transition-transform duration-300" :class="[it.match(route.path) ? 'fa-solid -translate-y-0.5' : (it.icon==='fa-heart' || it.icon==='fa-user' ? 'fa-regular' : 'fa-solid'), it.icon]"></i>
              <span v-if="it.badge" class="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-medium text-white" :class="it.red ? 'bg-red-500' : 'bg-brand-600'">{{ it.badge }}</span>
            </span>
            <span class="max-w-full truncate px-1">{{ t(it.label) }}</span>
          </router-link>
        </div>
      </nav>
    </Transition>`
  };

  // ================= FOOTER =================
  const SiteFooter = {
    components: { Logo },
    setup() {
      const email = ref('');
      const sub = () => { if (!email.value.includes('@')) return VK.toast(t('yourEmail'), 'error'); email.value = ''; VK.toast(t('subscribed')); };
      return { email, sub, year: new Date().getFullYear(), VK };
    },
    template: `
    <footer class="relative mt-16 sm:mt-20 overflow-hidden bg-brand-900 dark:bg-brand-950 text-brand-50 no-print">
      <i class="fa-solid fa-leaf pointer-events-none absolute -bottom-6 -right-4 text-[140px] text-brand-800/60 rotate-12"></i>
      <div class="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 sm:px-6 sm:py-14 lg:grid-cols-4">
        <div class="col-span-2 lg:col-span-1">
          <Logo light />
          <p class="mt-3 text-sm text-brand-100/80">{{ VK.tagline() }}</p>
          <div class="mt-5 space-y-2 text-sm text-brand-100/80">
            <p><i class="fa-solid fa-phone w-5 text-brand-300"></i>{{ S.settings.phone }}</p>
            <p><i class="fa-solid fa-envelope w-5 text-brand-300"></i>{{ S.settings.email }}</p>
            <p class="flex"><i class="fa-solid fa-location-dot w-5 mt-1 text-brand-300"></i><span class="flex-1">{{ S.settings.address }}</span></p>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-white">{{ t('usefulLinks') }}</h4>
          <ul class="mt-4 space-y-2.5 text-sm text-brand-100/80">
            <li><router-link to="/" class="hover:text-white transition">{{ t('home') }}</router-link></li>
            <li><router-link to="/shop" class="hover:text-white transition">{{ t('shop') }}</router-link></li>
            <li><router-link to="/favorites" class="hover:text-white transition">{{ t('favorites') }}</router-link></li>
            <li><router-link to="/about" class="hover:text-white transition">{{ t('about') }}</router-link></li>
            <li><router-link to="/contact" class="hover:text-white transition">{{ t('contact') }}</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-white">{{ t('followUs') }}</h4>
          <div class="mt-4 flex flex-wrap gap-2.5">
            <a :href="S.settings.facebook" target="_blank" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white hover:text-brand-800 transition"><i class="fa-brands fa-facebook-f"></i></a>
            <a :href="S.settings.telegram" target="_blank" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white hover:text-brand-800 transition"><i class="fa-brands fa-telegram"></i></a>
            <a :href="S.settings.youtube" target="_blank" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white hover:text-brand-800 transition"><i class="fa-brands fa-youtube"></i></a>
            <a :href="S.settings.tiktok" target="_blank" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white hover:text-brand-800 transition"><i class="fa-brands fa-tiktok"></i></a>
          </div>
          <div class="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2">
            <span class="rounded bg-khqr-red px-2 py-0.5 text-xs font-semibold text-white">KHQR</span><span class="text-xs font-medium text-slate-700">Bakong</span>
          </div>
        </div>
        <div class="col-span-2 lg:col-span-1">
          <h4 class="font-medium text-white">{{ t('newsletter') }}</h4>
          <p class="mt-4 text-sm text-brand-100/80">{{ t('newsletterDesc') }}</p>
          <form @submit.prevent="sub" class="mt-4 flex overflow-hidden rounded-full bg-white p-1">
            <input v-model="email" type="email" :placeholder="t('yourEmail')" class="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-700 outline-none">
            <button class="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 transition"><i class="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      </div>
      <div class="relative border-t border-white/10">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-center sm:justify-between gap-3 px-6 py-5 text-xs text-brand-100/70">
          <p>© {{ year }} {{ S.settings.siteName }}. {{ t('rights') }}</p>
          <p class="flex gap-4"><a href="#" @click.prevent class="hover:text-white">{{ t('terms') }}</a><span>|</span><a href="#" @click.prevent class="hover:text-white">{{ t('privacy') }}</a></p>
        </div>
      </div>
    </footer>`
  };

  // ================= PRODUCT CARD (responsive) =================
  const ProductCard = {
    props: { p: Object, list: Boolean },
    components: { Stars },
    setup() { return { VK }; },
    template: `
    <div class="group relative flex h-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-soft lg:hover:-translate-y-1 transition duration-300" :class="list ? 'flex-row' : 'flex-col'">
      <router-link :to="'/product/'+p.id" class="zoom-wrap relative block bg-brand-50/70 dark:bg-slate-800/60" :class="list ? 'w-32 shrink-0 sm:w-56' : 'aspect-square sm:aspect-[4/3.4]'">
        <img :src="p.images[0]" :alt="p.name" loading="lazy" class="h-full w-full object-cover">
        <span v-if="VK.discountOf(p)" class="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full bg-brand-600 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-white shadow">-{{ VK.discountOf(p) }}%</span>
        <span v-if="p.stock<=0" class="absolute inset-0 grid place-items-center bg-white/60 dark:bg-slate-900/60 text-xs sm:text-sm font-medium">{{ t('outOfStock') }}</span>
      </router-link>
      <button @click="VK.toggleWish(p.id)" class="absolute right-2 top-2 sm:right-3 sm:top-3 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm hover:scale-110 active:scale-95 transition" :aria-label="t('favorites')">
        <i class="text-sm" :class="S.wishlist.includes(p.id) ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-slate-600 dark:text-slate-300'"></i>
      </button>
      <div class="flex flex-1 flex-col p-3 sm:p-4 min-w-0">
        <p class="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 truncate">{{ VK.catName(p.category) }}</p>
        <router-link :to="'/product/'+p.id" class="mt-0.5 text-[13px] sm:text-[15px] font-medium leading-snug hover:text-brand-600 transition line-clamp-2">{{ p.name }}</router-link>
        <p v-if="list" class="mt-1 hidden text-sm text-slate-500 line-clamp-2 sm:block">{{ p.short }}</p>
        <div class="mt-1 flex items-center gap-1"><Stars :value="p.rating" size="text-[10px] sm:text-xs" /><span class="text-[10px] sm:text-xs text-slate-400">({{ p.reviews }})</span></div>
        <div class="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span class="text-[15px] sm:text-lg font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }}</span>
          <span v-if="VK.discountOf(p)" class="text-[11px] sm:text-xs text-slate-400 line-through">{{ VK.money(p.price) }}</span>
        </div>
        <div class="mt-auto pt-2.5 sm:pt-3"><button @click="VK.addToCart(p)" :disabled="p.stock<=0" class="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-brand-700 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-brand-800 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 transition" :class="list && 'sm:w-48'">
          <i class="fa-solid fa-cart-shopping text-[11px]"></i><span class="truncate">{{ t('addToCart') }}</span>
        </button></div>
      </div>
    </div>`
  };

  const SectionTitle = {
    props: { kicker: String, title: String },
    template: `<div><p class="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[.18em] text-brand-600 dark:text-brand-400"><span class="h-px w-6 sm:w-8 bg-brand-600 dark:bg-brand-400"></span>{{ kicker }}</p><h2 class="mt-1.5 text-xl sm:text-3xl font-semibold tracking-tight">{{ title }}</h2></div>`
  };

  // Horizontal scroll product row (mobile swipe, desktop arrows)
  const ProductRow = {
    props: { kicker: String, title: String, items: Array, link: [String, Object] },
    components: { ProductCard, SectionTitle },
    setup() {
      const el = ref(null);
      const scroll = (d) => el.value && el.value.scrollBy({ left: d * el.value.clientWidth * 0.8, behavior: 'smooth' });
      return { el, scroll };
    },
    template: `
    <section class="mx-auto max-w-7xl pt-12 sm:pt-16">
      <div class="flex items-end justify-between gap-4 px-4 sm:px-6">
        <SectionTitle :kicker="kicker" :title="title" />
        <div class="flex items-center gap-2">
          <router-link v-if="link" :to="link" class="text-sm font-medium text-brand-700 dark:text-brand-400 sm:mr-2 whitespace-nowrap">{{ t('viewAll') }} <i class="fa-solid fa-arrow-right text-xs"></i></router-link>
          <button @click="scroll(-1)" class="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition"><i class="fa-solid fa-chevron-left text-sm"></i></button>
          <button @click="scroll(1)" class="hidden sm:grid h-10 w-10 place-items-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition"><i class="fa-solid fa-chevron-right text-sm"></i></button>
        </div>
      </div>
      <div ref="el" class="scroll-row mt-5 sm:mt-7 px-4 sm:px-6 pb-3 scroll-smooth sm:gap-5">
        <div v-for="p in items" :key="p.id" class="w-[46%] min-w-[150px] max-w-[200px] sm:w-[230px] sm:max-w-none lg:w-[calc((100%_-_60px)/4)]"><ProductCard :p="p" /></div>
      </div>
    </section>`
  };

  // ================= HOME =================
  const HomePage = {
    components: { ProductCard, SectionTitle, ProductRow },
    setup() {
      const cur = ref(0);
      const slides = computed(() => {
        const list = (S.settings.hero || []).filter((h) => h.active !== false && h.image);
        const src = list.length ? list : VK_DATA.settings.hero;
        return src.map((h) => ({ img: h.image, t1: VK.L(h.title1), t2: VK.L(h.title2), d: VK.L(h.desc), btn: VK.L(h.button) || t('discover'), to: h.link || '/shop' }));
      });
      watch(() => slides.value.length, (n) => { if (cur.value >= n) cur.value = 0; });
      const promo = computed(() => S.settings.promo || {});
      let timer; let sx = 0;
      const restart = () => { clearInterval(timer); timer = setInterval(() => { cur.value = (cur.value + 1) % slides.value.length; }, 6000); };
      const go = (i) => { cur.value = (i + slides.value.length) % slides.value.length; restart(); };
      const ts = (e) => { sx = e.touches[0].clientX; };
      const te = (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 45) go(cur.value + (dx < 0 ? 1 : -1)); };
      onMounted(restart); onBeforeUnmount(() => clearInterval(timer));
      const best = computed(() => [...S.products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 10));
      const latest = computed(() => [...S.products].reverse().slice(0, 8));
      const catRows = computed(() => S.categories.map((c) => ({ c, items: S.products.filter((p) => p.category === c.id) })).filter((r) => r.items.length >= 2).slice(0, 3));
      const maxDisc = computed(() => Math.max(20, ...S.products.map((p) => VK.discountOf(p))));
      return { slides, cur, go, ts, te, best, latest, catRows, maxDisc, promo, VK };
    },
    template: `
    <div>
      <!-- HERO -->
      <section class="px-3 sm:px-4 pt-2 sm:pt-3">
        <div class="relative mx-auto h-[420px] sm:h-[480px] max-w-[1400px] overflow-hidden rounded-[5px] bg-brand-50 dark:bg-slate-900" @touchstart.passive="ts" @touchend="te">
          <img v-for="(s,i) in slides" :key="s.img" :src="s.img" class="absolute inset-0 h-full w-full object-cover object-[70%_center] sm:object-right transition-all duration-1000 ease-out" :class="i===cur ? 'opacity-100 scale-100' : 'opacity-0 scale-105'" alt="" :loading="i===0 ? 'eager' : 'lazy'">
          <div class="absolute inset-0 bg-gradient-to-t from-white via-white/75 to-white/0 sm:bg-gradient-to-r sm:from-white/95 sm:via-white/70 sm:to-transparent dark:from-slate-950 dark:via-slate-950/75 sm:dark:from-slate-950/95 sm:dark:via-slate-950/70"></div>
          <div class="relative mx-auto flex h-full max-w-7xl flex-col justify-end pb-12 px-6 sm:justify-center sm:pb-0 sm:px-16">
            <Transition name="page" mode="out-in">
              <div v-if="slides[cur]" :key="cur" class="max-w-lg">
                <span class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 dark:bg-slate-900/80 dark:border-brand-800 px-3 py-1 text-[11px] sm:text-xs font-medium text-brand-700 dark:text-brand-300"><i class="fa-solid fa-star text-[9px]"></i>{{ t('newArrival') }}</span>
                <h1 class="mt-3 sm:mt-4 text-[28px] sm:text-5xl font-semibold leading-tight tracking-tight">{{ slides[cur].t1 }}<br><span class="text-brand-600 dark:text-brand-400">{{ slides[cur].t2 }}</span></h1>
                <p class="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-none">{{ slides[cur].d }}</p>
                <router-link :to="slides[cur].to" class="mt-5 sm:mt-7 inline-flex items-center gap-3 rounded-[5px] bg-brand-700 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-brand-700/25 hover:bg-brand-800 hover:gap-4 transition-all">{{ slides[cur].btn }} <i class="fa-solid fa-chevron-right text-xs"></i></router-link>
              </div>
            </Transition>
            <div class="mt-10 hidden md:flex flex-wrap gap-8 text-xs text-slate-600 dark:text-slate-300">
              <div class="flex items-center gap-3"><i class="fa-solid fa-truck-fast text-xl text-brand-600 dark:text-brand-400"></i><div><p class="font-medium text-slate-800 dark:text-white">{{ t('fastDelivery') }}</p><p>{{ t('fastDeliveryDesc') }}</p></div></div>
              <div class="flex items-center gap-3"><i class="fa-solid fa-shield-halved text-xl text-brand-600 dark:text-brand-400"></i><div><p class="font-medium text-slate-800 dark:text-white">{{ t('securePay') }}</p><p>{{ t('securePayDesc') }}</p></div></div>
              <div class="flex items-center gap-3"><i class="fa-solid fa-headset text-xl text-brand-600 dark:text-brand-400"></i><div><p class="font-medium text-slate-800 dark:text-white">{{ t('support') }}</p><p>{{ t('supportDesc') }}</p></div></div>
            </div>
          </div>
          <button @click="go(cur-1)" class="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:grid h-11 w-11 place-items-center rounded-full bg-white dark:bg-slate-800 shadow-lg hover:scale-110 transition"><i class="fa-solid fa-chevron-left"></i></button>
          <button @click="go(cur+1)" class="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:grid h-11 w-11 place-items-center rounded-full bg-white dark:bg-slate-800 shadow-lg hover:scale-110 transition"><i class="fa-solid fa-chevron-right"></i></button>
          <div class="absolute bottom-4 sm:bottom-5 left-6 sm:left-1/2 flex sm:-translate-x-1/2 gap-2">
            <button v-for="(s,i) in slides" :key="i" @click="go(i)" class="keep-round h-2 sm:h-2.5 rounded-full transition-all duration-300" :class="i===cur ? 'w-7 sm:w-8 bg-brand-600' : 'w-2 sm:w-2.5 bg-brand-200 dark:bg-slate-600'"></button>
          </div>
        </div>
      </section>

      <!-- QUICK FEATURES (mobile chips) -->
      <section class="scroll-row px-4 pt-4 md:hidden">
        <div v-for="f in [['fa-truck-fast','fastDelivery'],['fa-shield-halved','securePay'],['fa-certificate','original'],['fa-headset','support']]" :key="f[1]" class="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs"><i class="fa-solid text-brand-600" :class="f[0]"></i>{{ t(f[1]) }}</div>
      </section>

      <!-- CATEGORIES (scroll on mobile) -->
      <section class="mx-auto max-w-7xl pt-10 sm:pt-16">
        <div class="flex items-end justify-between gap-4 px-4 sm:px-6">
          <SectionTitle :kicker="t('ourCategories')" :title="t('browseCategory')" />
          <router-link to="/shop" class="inline-flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-400 hover:gap-3 transition-all whitespace-nowrap"><span class="hidden sm:inline">{{ t('viewAllCategories') }}</span><span class="sm:hidden">{{ t('viewAll') }}</span> <i class="fa-solid fa-arrow-right text-xs"></i></router-link>
        </div>
        <div class="scroll-row mt-5 sm:mt-7 px-4 sm:px-6 pb-2 lg:grid lg:grid-cols-7 lg:gap-5 lg:overflow-visible">
          <router-link v-for="(c,i) in S.categories" :key="c.id" :to="{path:'/shop',query:{cat:c.id}}" class="group w-[84px] sm:w-[120px] lg:w-auto text-center fade-up" :style="{animationDelay: i*50+'ms'}">
            <div class="zoom-wrap aspect-square overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-brand-50 dark:bg-slate-900 group-hover:border-brand-400 group-hover:shadow-soft transition">
              <img :src="c.image" :alt="c.name.en" loading="lazy" class="h-full w-full object-cover">
            </div>
            <p class="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 group-hover:text-brand-600 transition truncate">{{ c.name[S.lang] || c.name.en }}</p>
          </router-link>
        </div>
      </section>

      <!-- BEST SELLERS (scroll) -->
      <ProductRow :kicker="t('featured')" :title="t('bestSellers')" :items="best" link="/shop" />

      <!-- PROMO (dynamic from dashboard) -->
      <section v-if="promo.active !== false" class="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-12">
        <div class="relative overflow-hidden rounded-[5px] bg-brand-50 dark:bg-slate-900">
          <img :src="promo.image || '/vk/img/banners/promo.jpg'" class="absolute inset-0 h-full w-full object-cover object-[75%_center] sm:object-right" alt="" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-r from-brand-50 via-brand-50/85 to-brand-50/20 sm:to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/20"></div>
          <div class="relative max-w-md p-6 sm:p-12">
            <span class="rounded-[5px] border border-brand-300 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-[11px] sm:text-xs font-medium text-brand-700 dark:text-brand-300">{{ S.settings.discount.active ? S.settings.discount.label : (VK.L(promo.label) || t('specialOffer')) }}</span>
            <h3 class="mt-3 sm:mt-4 text-2xl sm:text-4xl font-semibold">{{ S.settings.discount.active ? t('upTo') + ' -' + maxDisc + '%' : (VK.L(promo.title) || t('upTo') + ' -' + maxDisc + '%') }}</h3>
            <p class="text-base sm:text-xl font-medium">{{ VK.L(promo.subtitle) || t('onSelection') }}</p>
            <p class="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-[230px] sm:max-w-none">{{ VK.L(promo.desc) || t('offerDesc') }}</p>
            <router-link :to="promo.link || '/shop?sale=1'" class="mt-5 sm:mt-6 inline-flex items-center gap-2 rounded-[5px] border-[1.5px] border-brand-700 dark:border-brand-400 px-5 py-2 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-700 hover:text-white transition">{{ VK.L(promo.button) || t('seeOffer') }} <i class="fa-solid fa-chevron-right text-xs"></i></router-link>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="mx-auto hidden max-w-7xl px-4 sm:px-6 pt-8 md:block">
        <div class="grid gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-brand-50/50 dark:bg-slate-900/60 p-5 md:grid-cols-4">
          <div v-for="f in [['fa-certificate','original','originalDesc'],['fa-truck-fast','fastDelivery','deliveryAll'],['fa-shield-halved','securePay','securePayDesc'],['fa-headset','support','supportDesc']]" :key="f[1]" class="flex items-center gap-4 px-3">
            <i class="fa-solid text-2xl text-brand-600 dark:text-brand-400" :class="f[0]"></i>
            <div><p class="text-sm font-medium">{{ t(f[1]) }}</p><p class="text-xs text-slate-500">{{ t(f[2]) }}</p></div>
          </div>
        </div>
      </section>

      <!-- CATEGORY ROWS (scroll) -->
      <ProductRow v-for="r in catRows" :key="r.c.id" :kicker="t('categories')" :title="r.c.name[S.lang] || r.c.name.en" :items="r.items" :link="{path:'/shop',query:{cat:r.c.id}}" />

      <!-- LATEST (scroll on mobile, grid on desktop) -->
      <section class="mx-auto max-w-7xl pt-12 sm:pt-16">
        <div class="flex items-end justify-between gap-4 px-4 sm:px-6">
          <SectionTitle :kicker="t('newArrivals')" :title="t('latest')" />
          <router-link to="/shop" class="inline-flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-400 hover:gap-3 transition-all whitespace-nowrap">{{ t('viewAll') }} <i class="fa-solid fa-arrow-right text-xs"></i></router-link>
        </div>
        <div class="scroll-row mt-5 sm:mt-7 px-4 sm:px-6 pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-5 md:overflow-visible">
          <div v-for="p in latest" :key="p.id" class="w-[46%] min-w-[150px] max-w-[200px] md:w-auto md:max-w-none"><ProductCard :p="p" /></div>
        </div>
      </section>
    </div>`
  };

  // ================= SHOP / VIEW ALL =================
  const ShopPage = {
    components: { ProductCard, Stars },
    setup() {
      const route = VueRouter.useRoute();
      const router = VueRouter.useRouter();
      const maxPrice = computed(() => Math.ceil(Math.max(100, ...S.products.map((p) => p.price)) / 100) * 100);
      const f = Vue.reactive({ q: '', cat: 'all', min: 0, max: 99999, rating: 0, stock: false, sale: false, sort: 'newest' });
      const layout = ref('grid');
      const drawer = ref(false);
      const sync = () => { f.q = route.query.q || ''; f.cat = route.query.cat || 'all'; f.sale = route.query.sale === '1'; };
      watch(() => route.query, sync, { immediate: true });
      watch(maxPrice, (m) => { if (f.max > m) f.max = m; }, { immediate: true });
      watch(drawer, (v) => { document.body.style.overflow = v ? 'hidden' : ''; });
      onBeforeUnmount(() => { document.body.style.overflow = ''; });
      const setCat = (c) => { router.replace({ path: '/shop', query: Object.assign({}, route.query, { cat: c === 'all' ? undefined : c }) }); };
      const count = (c) => S.products.filter((p) => c === 'all' || p.category === c).length;
      const list = computed(() => {
        let r = S.products.filter((p) => {
          const pr = VK.priceOf(p);
          if (f.cat !== 'all' && p.category !== f.cat) return false;
          if (f.q && !(p.name + ' ' + p.brand + ' ' + p.short).toLowerCase().includes(String(f.q).toLowerCase())) return false;
          if (pr < f.min || pr > f.max) return false;
          if (f.rating && p.rating < f.rating) return false;
          if (f.stock && p.stock <= 0) return false;
          if (f.sale && !VK.discountOf(p)) return false;
          return true;
        });
        const s = { priceLow: (a, b) => VK.priceOf(a) - VK.priceOf(b), priceHigh: (a, b) => VK.priceOf(b) - VK.priceOf(a), topRated: (a, b) => b.rating - a.rating, bestSelling: (a, b) => (b.sold || 0) - (a.sold || 0) }[f.sort];
        return s ? [...r].sort(s) : [...r].reverse();
      });
      const activeCount = computed(() => (f.min > 0 ? 1 : 0) + (f.max < maxPrice.value ? 1 : 0) + (f.rating ? 1 : 0) + (f.stock ? 1 : 0) + (f.sale ? 1 : 0));
      const clear = () => { Object.assign(f, { q: '', min: 0, max: maxPrice.value, rating: 0, stock: false, sale: false, sort: 'newest' }); router.replace('/shop'); };
      return { f, list, layout, drawer, setCat, count, clear, maxPrice, activeCount };
    },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-8">
      <div class="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200/70 dark:border-slate-800 px-5 py-5 sm:px-10 sm:py-8">
        <p class="text-xs text-slate-500"><router-link to="/" class="hover:text-brand-600">{{ t('home') }}</router-link> / {{ t('shop') }}</p>
        <h1 class="mt-1.5 text-2xl sm:text-3xl font-semibold">{{ f.cat==='all' ? t('allProducts') : VK.catName(f.cat) }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ list.length }} {{ t('results') }}</p>
      </div>

      <!-- mobile category chips (scroll) -->
      <div class="sticky top-16 z-30 -mx-4 mt-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur py-2.5 lg:hidden">
        <div class="scroll-row px-4 gap-2">
          <button @click="setCat('all')" class="rounded-full px-4 py-2 text-xs font-medium transition border" :class="f.cat==='all' ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 dark:border-slate-700'">{{ t('all') }} · {{ count('all') }}</button>
          <button v-for="c in S.categories" :key="c.id" @click="setCat(c.id)" class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition border whitespace-nowrap" :class="f.cat===c.id ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 dark:border-slate-700'"><i class="fa-solid text-[10px]" :class="c.icon"></i>{{ c.name[S.lang] || c.name.en }}</button>
        </div>
      </div>

      <div class="mt-3 lg:mt-8 grid gap-8 lg:grid-cols-[270px_1fr]">
        <!-- Sidebar (sticky desktop / bottom sheet mobile) -->
        <Transition name="fade"><div v-if="drawer" class="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="drawer=false"></div></Transition>
        <aside class="fixed inset-x-0 bottom-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-950 p-5 pb-8 transition-transform duration-300 lg:static lg:z-auto lg:max-h-none lg:translate-y-0 lg:rounded-none lg:bg-transparent lg:p-0 lg:overflow-visible" :class="drawer ? 'translate-y-0' : 'translate-y-full'">
          <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 lg:hidden"></div>
          <div class="lg:sticky lg:top-24 space-y-5 lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:bg-white lg:dark:bg-slate-900 lg:p-5">
            <div class="flex items-center justify-between"><h3 class="font-medium"><i class="fa-solid fa-sliders mr-2 text-brand-600"></i>{{ t('filters') }}</h3><button class="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 lg:hidden" @click="drawer=false"><i class="fa-solid fa-xmark text-sm"></i></button></div>
            <div class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 focus-within:border-brand-500 transition"><i class="fa-solid fa-magnifying-glass text-xs text-slate-400"></i><input v-model="f.q" :placeholder="t('search')" class="w-full bg-transparent text-sm outline-none"></div>
            <div class="hidden lg:block">
              <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('category') }}</p>
              <button @click="setCat('all')" class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition" :class="f.cat==='all' ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'"><span><i class="fa-solid fa-border-all mr-2 w-4"></i>{{ t('all') }}</span><span class="text-xs opacity-70">{{ count('all') }}</span></button>
              <button v-for="c in S.categories" :key="c.id" @click="setCat(c.id)" class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition" :class="f.cat===c.id ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'"><span><i class="fa-solid mr-2 w-4" :class="c.icon"></i>{{ c.name[S.lang] || c.name.en }}</span><span class="text-xs opacity-70">{{ count(c.id) }}</span></button>
            </div>
            <div>
              <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('priceRange') }}</p>
              <div class="flex items-center gap-2 text-sm">
                <input type="number" v-model.number="f.min" min="0" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 outline-none focus:border-brand-500">
                <span class="text-slate-400">—</span>
                <input type="number" v-model.number="f.max" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1.5 outline-none focus:border-brand-500">
              </div>
              <input type="range" v-model.number="f.max" :min="0" :max="maxPrice" step="10" class="mt-3 w-full">
            </div>
            <div>
              <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('rating') }}</p>
              <label v-for="r in [0,4.5,4]" :key="r" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50 dark:hover:bg-slate-800">
                <input type="radio" :value="r" v-model="f.rating"><span v-if="r===0">{{ t('all') }}</span><span v-else class="flex items-center gap-1"><Stars :value="r" /> {{ t('andUp') }}</span>
              </label>
            </div>
            <div class="space-y-2 text-sm">
              <label class="flex cursor-pointer items-center gap-2"><input type="checkbox" v-model="f.stock">{{ t('onlyInStock') }}</label>
              <label class="flex cursor-pointer items-center gap-2"><input type="checkbox" v-model="f.sale">{{ t('onSale') }}</label>
            </div>
            <div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button @click="clear" class="w-full rounded-xl border border-brand-600 py-2.5 lg:py-2 text-sm font-medium text-brand-700 dark:text-brand-400 hover:bg-brand-600 hover:text-white transition"><i class="fa-solid fa-rotate-left mr-2"></i>{{ t('clearFilters') }}</button>
              <button @click="drawer=false" class="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white lg:hidden">{{ list.length }} {{ t('results') }}</button>
            </div>
          </div>
        </aside>
        <!-- Products -->
        <div>
          <div class="mb-4 sm:mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
            <button @click="drawer=true" class="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 text-sm lg:hidden"><i class="fa-solid fa-sliders"></i>{{ t('filters') }}<span v-if="activeCount" class="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] text-white">{{ activeCount }}</span></button>
            <p class="hidden text-sm text-slate-500 sm:block"><span class="font-medium text-slate-800 dark:text-white">{{ list.length }}</span> {{ t('results') }}</p>
            <div class="ml-auto flex items-center gap-2">
              <select v-model="f.sort" class="h-10 max-w-[150px] sm:max-w-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-brand-500">
                <option value="newest">{{ t('newest') }}</option><option value="priceLow">{{ t('priceLow') }}</option><option value="priceHigh">{{ t('priceHigh') }}</option><option value="topRated">{{ t('topRated') }}</option><option value="bestSelling">{{ t('bestSelling') }}</option>
              </select>
              <div class="flex h-10 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                <button @click="layout='grid'" class="grid w-8 place-items-center rounded-lg transition" :class="layout==='grid' ? 'bg-brand-600 text-white' : 'text-slate-500'"><i class="fa-solid fa-grip text-sm"></i></button>
                <button @click="layout='list'" class="grid w-8 place-items-center rounded-lg transition" :class="layout==='list' ? 'bg-brand-600 text-white' : 'text-slate-500'"><i class="fa-solid fa-list text-sm"></i></button>
              </div>
            </div>
          </div>
          <TransitionGroup name="list" tag="div" class="relative grid gap-3 sm:gap-5" :class="layout==='grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'">
            <ProductCard v-for="p in list" :key="p.id" :p="p" :list="layout==='list'" />
          </TransitionGroup>
          <div v-if="!list.length" class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-20 text-center text-slate-500">
            <i class="fa-solid fa-box-open text-4xl text-brand-300"></i><p class="mt-3">{{ t('noProducts') }}</p>
            <button @click="clear" class="mt-4 text-sm font-medium text-brand-600">{{ t('clearFilters') }}</button>
          </div>
        </div>
      </div>
    </div>`
  };

  window.VK_SHOP = { SiteHeader, SiteFooter, BottomNav, ProductCard, ProductRow, SectionTitle, HomePage, ShopPage };
})();
