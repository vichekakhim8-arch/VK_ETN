/* VK_ETN — admin layout, dashboard & shared admin helpers */
(function () {
  const { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } = Vue;
  const { S, t } = VK;
  const { clickOutside, Logo, LangSwitch, ThemeToggle, DateRange, ExportMenu, AnimatedNumber } = VK_UI;

  // ===== list composable: search, filter, select, paginate, view mode =====
  function useList(source, opts = {}) {
    const q = ref('');
    const page = ref(1);
    const size = ref(opts.size || 10);
    const view = ref(localStorage.getItem('vk_view_' + (opts.key || 'x')) || (window.innerWidth < 768 ? 'cards' : 'table'));
    watch(view, (v) => localStorage.setItem('vk_view_' + (opts.key || 'x'), v));
    const selected = ref([]);
    const filtered = computed(() => {
      const term = q.value.trim().toLowerCase();
      return source().filter((it) => (!term || (opts.text ? opts.text(it) : JSON.stringify(it)).toLowerCase().includes(term)) && (!opts.filter || opts.filter(it)));
    });
    const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)));
    const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value));
    watch([q, () => filtered.value.length], () => { if (page.value > pages.value) page.value = pages.value; });
    watch(q, () => { page.value = 1; });
    const idOf = opts.id || ((x) => x.id);
    const isSel = (it) => selected.value.includes(idOf(it));
    const toggle = (it) => { const id = idOf(it); const i = selected.value.indexOf(id); if (i > -1) selected.value.splice(i, 1); else selected.value.push(id); };
    const allOnPage = computed(() => paged.value.length > 0 && paged.value.every(isSel));
    const toggleAll = () => {
      if (allOnPage.value) selected.value = selected.value.filter((id) => !paged.value.some((x) => idOf(x) === id));
      else paged.value.forEach((x) => { if (!isSel(x)) selected.value.push(idOf(x)); });
    };
    return { q, page, size, view, selected, filtered, pages, paged, isSel, toggle, allOnPage, toggleAll };
  }

  // Common small UI pieces for admin pages
  const Card = { template: `<div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><slot /></div>` };
  const StatCard = {
    components: { AnimatedNumber },
    props: { icon: String, label: String, value: { type: [Number, String], default: 0 }, fmt: String, color: String, delay: { type: Number, default: 0 } },
    template: `
  <div class="fade-up group relative flex h-[120px] min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900" :style="{animationDelay: delay+'ms'}">
    <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 transition duration-500 group-hover:scale-125" :class="color"></div>
    <div class="relative min-w-0 flex-1">
      <p class="truncate text-sm text-slate-500 dark:text-slate-400">{{ label }}</p>
      <p class="mt-1 truncate text-2xl font-semibold tracking-tight"><AnimatedNumber :value="value" :format="fmt" /></p>
      <div v-if="$slots.sub" class="mt-1.5 truncate text-[13px] leading-snug sm:text-sm"><slot name="sub" /></div>
    </div>
    <span class="relative grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br text-white shadow-lg" :class="color"><i class="fa-solid" :class="icon"></i></span>
  </div>`
  };
  const SearchBox = {
    props: { modelValue: String, placeholder: String },
    emits: ['update:modelValue'],
    template: `<div class="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition">
      <i class="fa-solid fa-magnifying-glass text-xs text-slate-400"></i>
      <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :placeholder="placeholder || t('search')" class="w-full bg-transparent text-sm outline-none">
      <button v-if="modelValue" @click="$emit('update:modelValue','')" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark text-xs"></i></button></div>`
  };
  const SelectionBar = {
    props: { count: Number, total: Number },
    emits: ['delete', 'deleteAll', 'clear'],
    template: `
    <div class="flex flex-wrap items-center gap-2">
      <Transition name="pop">
        <div v-if="count" class="flex items-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 px-3 h-10 text-sm">
          <span class="font-medium text-brand-700 dark:text-brand-300">{{ count }} {{ t('selected') }}</span>
          <button @click="$emit('clear')" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xs"></i></button>
          <button @click="$emit('delete')" class="ml-1 rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition"><i class="fa-solid fa-trash-can mr-1"></i>{{ t('deleteSelected') }}</button>
        </div>
      </Transition>
      <button v-if="total" @click="$emit('deleteAll')" class="flex h-10 items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 px-3 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition"><i class="fa-solid fa-dumpster"></i><span class="hidden sm:inline">{{ t('deleteAll') }}</span></button>
    </div>`
  };
  const PageHead = {
    props: { title: String, sub: String },
    template: `<div class="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800"><div><h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1><p v-if="sub" class="mt-1 text-sm text-slate-500">{{ sub }}</p></div><div class="flex flex-wrap items-center gap-2"><slot /></div></div>`
  };
  const Empty = { template: `<div class="py-16 text-center text-slate-400"><i class="fa-solid fa-inbox text-4xl text-brand-200 dark:text-brand-900"></i><p class="mt-3 text-sm">{{ t('noData') }}</p></div>` };

  // ===== Chart.js wrapper =====
  // JSON-serialising the config drops functions (callbacks, formatters) — re-attach them afterwards
  const bindFns = (dst, src) => {
    if (!dst || !src || typeof dst !== 'object') return;
    Object.keys(src).forEach((k) => {
      const v = src[k];
      if (typeof v === 'function') dst[k] = v;
      else if (v && typeof v === 'object') bindFns(dst[k], v);
    });
  };

  const ChartBox = {
    props: { config: Object, height: { type: String, default: '300px' }, plugins: { type: Array, default: () => [] } },
    setup(props) {
      const el = ref(null); let chart = null;
      const plain = () => {
        const c = JSON.parse(JSON.stringify(props.config, (k, v) => (typeof v === 'function' ? undefined : v)));
        if (props.plugins.length) c.plugins = props.plugins;
        return c;
      };
      const draw = () => {
        if (!el.value || !window.Chart) return;
        if (chart) chart.destroy();
        chart = markRaw(new Chart(el.value, plain()));
        bindFns(chart.options, props.config.options || {});
        if (props.config.options && props.config.options.__tick) chart.options.scales.y.ticks.callback = props.config.options.__tick;
        chart.update();
      };
      // language / theme change: update labels & colours in place (no destroy -> no blank canvas, no re-animation)
      const refresh = () => {
        if (!chart || chart.config.type !== props.config.type) return draw();
        const c = plain(); chart.data.labels = c.data.labels;
        c.data.datasets.forEach((d, i) => { if (chart.data.datasets[i]) Object.assign(chart.data.datasets[i], d); });
        chart.options = c.options; bindFns(chart.options, props.config.options || {}); chart.update('none');
      };
      let langOrTheme = false;
      watch(() => [S.dark, S.lang], () => { langOrTheme = true; });
      onMounted(() => nextTick(draw));
      watch(() => props.config, () => nextTick(() => { if (langOrTheme) { langOrTheme = false; refresh(); } else draw(); }), { deep: true });
      onBeforeUnmount(() => chart && chart.destroy());
      return { el };
    },
    template: `<div :style="{ height }" class="relative w-full min-w-0 max-w-full"><canvas ref="el"></canvas></div>`
  };

  function chartTheme() {
    const grid = S.dark ? 'rgba(148,163,184,.12)' : 'rgba(15,69,56,.07)';
    const tick = S.dark ? '#94a3b8' : '#64748b';
    return { grid, tick };
  }

  // ===== Donut segment labels (counts + % drawn inside the slices) =====
  const DONUT_COLORS = ['#f59e0b', '#0ea5e9', '#156c53', '#ef4444'];
  const donutLabels = {
    id: 'vkDonutLabels',
    afterDatasetsDraw(chart) {
      const ds = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);
      if (!ds || !meta || meta.hidden || !ds.data.length) return;
      const total = ds.data.reduce((a, b) => a + (+b || 0), 0);
      if (!total) return;
      const ctx = chart.ctx;
      ctx.save();
      meta.data.forEach((arc, i) => {
        const value = +ds.data[i] || 0;
        if (!value || arc.endAngle - arc.startAngle < 0.35) return; // slice too thin for text
        const a = (arc.startAngle + arc.endAngle) / 2;
        const r = (arc.innerRadius + arc.outerRadius) / 2;
        const x = arc.x + Math.cos(a) * r;
        const y = arc.y + Math.sin(a) * r;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillText(Math.round((value / total) * 100) + '%', x, y - 7);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillText(String(value), x, y + 8);
      });
      ctx.restore();
    }
  };

  // ===== LAYOUT =====
  const AdminLayout = {
    components: { Logo, LangSwitch, ThemeToggle },
    directives: { clickOutside },
    setup() {
      const route = VueRouter.useRoute(); const router = VueRouter.useRouter();
      const collapsed = ref(localStorage.getItem('vk_sb') === '1');
      const mobileOpen = ref(false);
      const profileOpen = ref(false); const bellOpen = ref(false);
      watch(collapsed, (v) => localStorage.setItem('vk_sb', v ? '1' : '0'));
      watch(() => route.path, () => { mobileOpen.value = false; profileOpen.value = false; bellOpen.value = false; });
      const toggle = () => { if (window.innerWidth < 1024) mobileOpen.value = !mobileOpen.value; else collapsed.value = !collapsed.value; };
      onMounted(() => VK.load());
      const pending = computed(() => S.orders.filter((o) => o.status === 'pending'));
      const low = computed(() => S.products.filter((p) => p.stock <= S.settings.lowStock).length);
      const menu = computed(() => [
        { to: '/admin', icon: 'fa-gauge-high', label: 'overview2', exact: true },
        { to: '/admin/products', icon: 'fa-box', label: 'products' },
        { to: '/admin/orders', icon: 'fa-receipt', label: 'orders', badge: pending.value.length },
        { to: '/admin/customers', icon: 'fa-users', label: 'customers' },
        { to: '/admin/categories', icon: 'fa-layer-group', label: 'categories' },
        { to: '/admin/stock', icon: 'fa-warehouse', label: 'stock', badge: low.value, warn: true },
        { to: '/admin/discounts', icon: 'fa-tags', label: 'discounts' },
        { to: '/admin/reviews', icon: 'fa-comments', label: 'reviewsTitle' },
        { to: '/admin/settings', icon: 'fa-gear', label: 'settings' }
      ]);
      const isActive = (m) => m.exact ? route.path === m.to : route.path.startsWith(m.to);
      const title = computed(() => { const m = menu.value.find(isActive); return m ? t(m.label) : t('dashboard'); });
      const logout = () => { VK.logout(); router.push('/login'); };
      return { collapsed, mobileOpen, profileOpen, bellOpen, toggle, menu, isActive, title, logout, pending, VK };
    },
    template: `
    <div v-if="S.user" class="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Transition name="fade"><div v-if="mobileOpen" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" @click="mobileOpen=false"></div></Transition>
      <aside class="sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" :class="[collapsed ? 'collapsed lg:w-[84px] w-[264px]' : 'w-[264px]', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">
        <div class="flex h-[72px] items-center border-b border-slate-200 dark:border-slate-800 px-5 overflow-hidden">
          <router-link to="/admin" class="flex items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30"><img v-if="S.settings.logo" :src="S.settings.logo" class="h-full w-full rounded-xl object-cover"><i v-else class="fa-solid fa-bag-shopping"></i></span>
            <span class="sidebar-label text-xl font-semibold">{{ S.settings.siteName }}</span>
          </router-link>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
          <p class="sidebar-label px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[.2em] text-slate-400">{{ t('menu') }}</p>
          <router-link v-for="m in menu" :key="m.to" :to="m.to" :title="collapsed ? t(m.label) : ''" class="group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all duration-200" :class="isActive(m) ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand-700 dark:hover:text-brand-300'">
            <i class="fa-solid w-5 text-center text-[15px]" :class="m.icon"></i>
            <span class="sidebar-label flex-1">{{ t(m.label) }}</span>
            <span v-if="m.badge" class="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold transition-all" :class="[isActive(m) ? 'bg-white text-brand-700' : m.warn ? 'bg-amber-500 text-white' : 'bg-red-500 text-white', collapsed ? 'lg:absolute lg:right-1.5 lg:top-1' : '']">{{ m.badge }}</span>
          </router-link>
        </nav>
        <div class="space-y-1 border-t border-slate-200 dark:border-slate-800 p-3">
          <router-link to="/" class="flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 transition" :title="t('viewStore')"><i class="fa-solid fa-store w-5 text-center"></i><span class="sidebar-label">{{ t('viewStore') }}</span></router-link>
          <button @click="collapsed=!collapsed" class="hidden lg:flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-800 transition"><i class="fa-solid w-5 text-center transition-transform duration-300" :class="collapsed ? 'fa-angles-right' : 'fa-angles-left'"></i><span class="sidebar-label">{{ t('collapse') }}</span></button>
        </div>
      </aside>

      <div class="main-area" :class="collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'">
        <header class="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 px-4 backdrop-blur-lg sm:px-6">
          <button @click="toggle" class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition"><i class="fa-solid fa-bars-staggered"></i></button>
          <div class="min-w-0"><h2 class="truncate text-lg font-medium">{{ title }}</h2><p class="hidden text-xs text-slate-400 sm:block">{{ S.settings.siteName }} / {{ title }}</p></div>
          <div class="ml-auto flex items-center gap-2">
            <LangSwitch class="hidden sm:block" />
            <ThemeToggle />
            <div class="relative" v-click-outside="() => bellOpen=false">
              <button @click="bellOpen=!bellOpen" class="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition"><i class="fa-regular fa-bell"></i><span v-if="pending.length" class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span></button>
              <Transition name="pop">
                <div v-if="bellOpen" class="absolute right-0 top-12 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl">
                  <p class="px-3 py-2 text-sm font-medium">{{ t('pending') }} ({{ pending.length }})</p>
                  <div class="max-h-72 overflow-y-auto">
                    <router-link v-for="o in pending.slice(0,8)" :key="o.id" :to="{path:'/admin/orders', query:{q:o.id}}" class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-brand-50 dark:hover:bg-slate-800">
                      <span class="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-600"><i class="fa-solid fa-receipt text-sm"></i></span>
                      <span class="flex-1 text-sm"><b>{{ o.id }}</b><br><span class="text-xs text-slate-500">{{ o.customer.name }} · {{ VK.money(o.total) }}</span></span>
                    </router-link>
                    <p v-if="!pending.length" class="px-3 py-6 text-center text-sm text-slate-400">{{ t('noData') }}</p>
                  </div>
                </div>
              </Transition>
            </div>
            <div class="relative" v-click-outside="() => profileOpen=false">
              <button @click="profileOpen=!profileOpen" class="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 p-1 pr-3 hover:border-brand-500 transition">
                <img v-if="S.user.avatar" :src="S.user.avatar" class="h-8 w-8 rounded-full object-cover"><span v-else class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">{{ S.user.name[0] }}</span>
                <span class="hidden text-sm font-medium md:block">{{ S.user.name }}</span><i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </button>
              <Transition name="pop">
                <div v-if="profileOpen" class="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl">
                  <div class="border-b border-slate-100 dark:border-slate-800 px-3 py-2 mb-1"><p class="text-sm font-medium">{{ S.user.name }}</p><p class="text-xs text-slate-500">{{ S.user.email }}</p></div>
                  <router-link :to="{path:'/admin/settings', query:{tab:'admin'}}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-user-gear w-4 text-brand-600"></i>{{ t('adminProfile') }}</router-link>
                  <router-link to="/" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-solid fa-store w-4 text-brand-600"></i>{{ t('viewStore') }}</router-link>
                  <button @click="logout" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-solid fa-arrow-right-from-bracket w-4"></i>{{ t('logout') }}</button>
                </div>
              </Transition>
            </div>
          </div>
        </header>
        <main class="p-4 sm:p-6 lg:p-8">
          <router-view v-slot="{ Component, route }"><Transition name="page" mode="out-in"><component :is="Component" :key="route.path" /></Transition></router-view>
        </main>
      </div>
    </div>`
  };

  // ===== DASHBOARD =====
  function bucketize(orders, from, to) {
    const days = Math.max(1, Math.round((to - from) / VK_UTIL.DAY));
    const mode = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';
    const keys = []; const labels = [];
    const keyOf = (d) => {
      const x = new Date(d);
      if (mode === 'day') return VK_UI.iso(x);
      if (mode === 'week') { const s = new Date(x); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return VK_UI.iso(s); }
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
    };
    const cur = new Date(from);
    while (cur <= to) {
      const k = keyOf(cur);
      if (!keys.includes(k)) { keys.push(k); labels.push(mode === 'month' ? cur.toLocaleString('en-GB', { month: 'short', year: '2-digit' }) : cur.toLocaleString('en-GB', { day: '2-digit', month: 'short' })); }
      cur.setDate(cur.getDate() + (mode === 'month' ? 1 : 1));
      if (keys.length > 400) break;
    }
    const rev = keys.map(() => 0), cnt = keys.map(() => 0);
    orders.forEach((o) => { const i = keys.indexOf(keyOf(o.createdAt)); if (i > -1) { if (o.status !== 'cancelled') rev[i] += o.total; cnt[i]++; } });
    return { labels, rev: rev.map((v) => +v.toFixed(2)), cnt };
  }

  const AdminDashboard = {
    components: { DateRange, ExportMenu, AnimatedNumber, ChartBox, Card, StatCard },
    setup() {
      const range = ref({ preset: 'thisMonth', from: '', to: '' });
      const r = computed(() => {
        if (range.value.preset === 'all') { const ds = S.orders.map((o) => +new Date(o.createdAt)); return { from: VK_UTIL.sod(new Date(ds.length ? Math.min(...ds) : Date.now())), to: VK_UTIL.eod(new Date()) }; }
        return VK_UTIL.getRange(range.value.preset, range.value);
      });
      const inRange = (o, a, b) => { const d = new Date(o.createdAt); return d >= a && d <= b; };
      const cur = computed(() => S.orders.filter((o) => inRange(o, r.value.from, r.value.to)));
      const prev = computed(() => { const len = r.value.to - r.value.from; const b = new Date(r.value.from.getTime() - 1); const a = new Date(b.getTime() - len); return S.orders.filter((o) => inRange(o, a, b)); });
      const sum = (arr) => arr.filter((o) => o.status !== 'cancelled').reduce((a, b) => a + b.total, 0);
      const custs = (arr) => new Set(arr.map((o) => o.userId || o.customer.name)).size;
      const pct = (a, b) => (b ? ((a - b) / b) * 100 : a ? 100 : 0);
      const stats = computed(() => {
        const rv = sum(cur.value), rp = sum(prev.value);
        const oc = cur.value.length, op = prev.value.length;
        const cc = custs(cur.value), cp = custs(prev.value);
        const av = oc ? rv / oc : 0, ap = op ? rp / op : 0;
        return [
          { label: 'revenue', value: rv, fmt: 'money', icon: 'fa-sack-dollar', change: pct(rv, rp), color: 'from-brand-500 to-brand-700' },
          { label: 'totalOrders', value: oc, fmt: 'int', icon: 'fa-receipt', change: pct(oc, op), color: 'from-sky-500 to-sky-700' },
          { label: 'totalCustomers', value: cc, fmt: 'int', icon: 'fa-users', change: pct(cc, cp), color: 'from-violet-500 to-violet-700' },
          { label: 'avgOrder', value: av, fmt: 'money', icon: 'fa-chart-line', change: pct(av, ap), color: 'from-amber-500 to-orange-600' }
        ];
      });
      const lineCfg = computed(() => {
        const b = bucketize(cur.value, r.value.from, r.value.to); const th = chartTheme();
        const revC = '#156c53';                       // left axis  · revenue (line)
        const ordC = S.dark ? '#38bdf8' : '#0284c7';  // right axis · orders  (bars)
        return {
          type: 'line',
          data: { labels: b.labels, datasets: [
            { label: t('revenue'), data: b.rev, borderColor: revC, backgroundColor: S.dark ? 'rgba(69,163,131,.15)' : 'rgba(21,108,83,.10)', fill: true, tension: .4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointHoverBorderWeight: 3, pointHoverBorderColor: '#fff', pointBackgroundColor: revC, yAxisID: 'y' },
            { label: t('orders'), data: b.cnt, type: 'bar', backgroundColor: ordC + '59', borderColor: ordC, borderWidth: 1, borderRadius: 6, maxBarThickness: 18, yAxisID: 'y1' }
          ] },
          options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, animation: { duration: 1400, easing: 'easeOutQuart' },
            layout: { padding: { top: 12, bottom: 0, left: 0, right: 0 } },
            plugins: { legend: { labels: { color: th.tick, usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 12, weight: '500' } } },
              tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.dataset.yAxisID === 'y' ? VK.money(c.parsed.y) : c.parsed.y}` } } },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: th.tick, maxTicksLimit: 12, autoSkipPadding: 14, padding: 4 } },
              y: { position: 'left', beginAtZero: true, grace: '15%', grid: { color: th.grid }, border: { display: false },
                title: { display: true, text: t('revenue'), color: revC, font: { size: 11, weight: '600' }, padding: { top: 4 } },
                ticks: { color: th.tick, padding: 6 } },
              y1: { position: 'right', beginAtZero: true, grace: '30%', grid: { display: false }, border: { display: false },
                title: { display: true, text: t('orders'), color: ordC, font: { size: 11, weight: '600' }, padding: { top: 4 } },
                ticks: { color: th.tick, precision: 0, padding: 6 } }
            } }
        };
      });
      const STATUS = ['pending', 'processing', 'completed', 'cancelled'];
      const statusCounts = computed(() => STATUS.map((s) => cur.value.filter((o) => o.status === s).length));
      const statusTotal = computed(() => statusCounts.value.reduce((a, b) => a + b, 0));
      const statusCfg = computed(() => {
        return { type: 'doughnut',
          data: { labels: STATUS.map((s) => t(s)), datasets: [{ data: statusCounts.value, backgroundColor: DONUT_COLORS, borderColor: S.dark ? '#0f172a' : '#ffffff', borderWidth: 2, hoverOffset: 10 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '72%', layout: { padding: 8 },
            animation: { animateRotate: true, duration: 1400 },
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: (c) => { const n = +c.parsed || 0; const pct = statusTotal.value ? Math.round((n / statusTotal.value) * 100) : 0; return ` ${c.label}: ${n} (${pct}%)`; } } } } } };
      });
      const statusLegend = computed(() => STATUS.map((s, i) => ({
        key: s, label: t(s), color: DONUT_COLORS[i], count: statusCounts.value[i],
        pct: statusTotal.value ? Math.round((statusCounts.value[i] / statusTotal.value) * 100) : 0
      })));
      const catCfg = computed(() => {
        const th = chartTheme();
        const data = S.categories.map((c) => +cur.value.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.items.filter((i) => (i.category || (VK.productById(i.id) || {}).category) === c.id).reduce((x, i) => x + i.price * i.qty, 0), 0).toFixed(2));
        return { type: 'bar', data: { labels: S.categories.map((c) => c.name[S.lang] || c.name.en), datasets: [{ label: t('revenue'), data, backgroundColor: ['#156c53', '#238667', '#45a383', '#79c3a6', '#115744', '#acdcc8', '#0f4538'], borderRadius: 10, maxBarThickness: 36 }] },
          options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1400, easing: 'easeOutBack' }, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: th.tick } }, y: { grid: { color: th.grid }, ticks: { color: th.tick }, beginAtZero: true } } } };
      });
      const top = computed(() => {
        const m = {};
        cur.value.filter((o) => o.status !== 'cancelled').forEach((o) => o.items.forEach((i) => { m[i.id] = m[i.id] || { id: i.id, name: i.name, image: i.image, qty: 0, rev: 0 }; m[i.id].qty += i.qty; m[i.id].rev += i.price * i.qty; }));
        return Object.values(m).sort((a, b) => b.rev - a.rev).slice(0, 5);
      });
      const low = computed(() => S.products.filter((p) => p.stock <= S.settings.lowStock).sort((a, b) => a.stock - b.stock).slice(0, 5));
      const recent = computed(() => cur.value.slice(0, 6));
      const exportRows = computed(() => cur.value.map((o) => ({ id: o.id, date: VK.fmtDate(o.createdAt, true), customer: o.customer.name, items: o.items.length, total: o.total.toFixed(2), payment: o.payment.toUpperCase(), status: o.status })));
      const exportCols = computed(() => [{ key: 'id', label: t('orderNo') }, { key: 'date', label: t('date') }, { key: 'customer', label: t('customer') }, { key: 'items', label: t('items') }, { key: 'total', label: t('total') }, { key: 'payment', label: t('payment') }, { key: 'status', label: t('status') }]);
      const stCls = (s) => ({ pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' }[s]);
      const donutPlugins = [donutLabels];
      return { range, stats, lineCfg, statusCfg, statusLegend, statusTotal, donutPlugins, catCfg, top, low, recent, exportRows, exportCols, stCls, VK, r };
    },
    template: `
    <div>
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-2xl font-semibold">{{ t('welcomeAdmin') }}, {{ S.user.name }} 👋</h1><p class="mt-1 text-sm text-slate-500">{{ t('adminHint') }} · {{ VK.fmtDate(r.from) }} → {{ VK.fmtDate(r.to) }}</p></div>
        <div class="flex flex-wrap items-center gap-2"><DateRange v-model="range" /><ExportMenu :rows="exportRows" :columns="exportCols" filename="dashboard-orders" title="Orders report" /></div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="(s,i) in stats" :key="s.label" :icon="s.icon" :label="t(s.label)" :value="s.value" :fmt="s.fmt" :color="s.color" :delay="i*80">
          <template #sub><span class="inline-flex items-center gap-1 font-semibold" :class="s.change>=0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'"><i class="fa-solid" :class="s.change>=0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'"></i> <AnimatedNumber :value="Math.abs(s.change)" format="percent" /></span> <span class="font-medium text-slate-500 dark:text-slate-400">{{ t('vsPrev') }}</span></template>
        </StatCard>
      </div>
      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <Card class="flex min-w-0 flex-col p-5 xl:col-span-2">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 class="font-medium">{{ t('salesOverview') }}</h3><span class="truncate text-xs text-slate-400">{{ t(range.preset==='all'?'allTime':range.preset==='custom'?'customRange':range.preset) }}</span></div>
          <ChartBox :config="lineCfg" height="auto" class="min-h-[300px] flex-1" />
        </Card>
        <Card class="flex min-w-0 flex-col p-5">
          <h3 class="mb-4 font-medium">{{ t('ordersByStatus') }}</h3>
          <ChartBox :config="statusCfg" :plugins="donutPlugins" height="auto" class="min-h-[240px] flex-1" />
          <div v-if="statusTotal" class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div v-for="s in statusLegend" :key="s.key" class="flex min-w-0 items-center gap-2 text-[13px]">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }"></span>
              <span class="truncate font-medium text-slate-600 dark:text-slate-300">{{ s.label }}</span>
              <span class="ml-auto shrink-0 font-semibold tabular-nums text-slate-800 dark:text-slate-100">{{ s.count }}</span>
              <span class="w-9 shrink-0 text-right tabular-nums text-slate-500 dark:text-slate-400">{{ s.pct }}%</span>
            </div>
          </div>
          <p v-else class="mt-4 border-t border-slate-100 pt-3 text-center text-sm text-slate-400 dark:border-slate-800">{{ t('noData') }}</p>
        </Card>
      </div>
      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <Card class="min-w-0 p-5 xl:col-span-2"><h3 class="mb-4 font-medium">{{ t('salesByCategory') }}</h3><ChartBox :config="catCfg" height="280px" /></Card>
        <Card class="min-w-0 p-5">
          <h3 class="mb-4 font-medium">{{ t('topProducts') }}</h3>
          <div class="space-y-3">
            <div v-for="(p,i) in top" :key="p.id" class="flex items-center gap-3">
              <span class="w-4 text-xs font-semibold text-slate-400">{{ i+1 }}</span><img :src="p.image" class="h-11 w-11 rounded-xl object-cover">
              <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ p.name }}</p><p class="text-xs text-slate-500">{{ p.qty }} {{ t('sold') }}</p></div>
              <span class="text-sm font-medium text-brand-700 dark:text-brand-400">{{ VK.money(p.rev) }}</span>
            </div>
            <p v-if="!top.length" class="py-8 text-center text-sm text-slate-400">{{ t('noData') }}</p>
          </div>
        </Card>
      </div>
      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <Card class="min-w-0 overflow-hidden xl:col-span-2">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4"><h3 class="font-medium">{{ t('recentOrders') }}</h3><router-link to="/admin/orders" class="text-sm font-medium text-brand-600">{{ t('viewAll') }} →</router-link></div>
          <div class="overflow-x-auto"><table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th class="px-5 py-3">{{ t('orderNo') }}</th><th class="px-5 py-3">{{ t('customer') }}</th><th class="px-5 py-3">{{ t('date') }}</th><th class="px-5 py-3">{{ t('total') }}</th><th class="px-5 py-3">{{ t('status') }}</th></tr></thead>
            <tbody><tr v-for="o in recent" :key="o.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40"><td class="px-5 py-3 font-medium">{{ o.id }}</td><td class="px-5 py-3">{{ o.customer.name }}</td><td class="px-5 py-3 text-slate-500">{{ VK.fmtDate(o.createdAt) }}</td><td class="px-5 py-3 font-medium">{{ VK.money(o.total) }}</td><td class="px-5 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="stCls(o.status)">{{ t(o.status) }}</span></td></tr></tbody>
          </table><p v-if="!recent.length" class="py-10 text-center text-sm text-slate-400">{{ t('noData') }}</p></div>
        </Card>
        <Card class="min-w-0 p-5">
          <div class="mb-4 flex items-center justify-between"><h3 class="font-medium">{{ t('lowStock') }}</h3><router-link to="/admin/stock" class="text-sm font-medium text-brand-600">{{ t('viewAll') }} →</router-link></div>
          <div class="space-y-3">
            <div v-for="p in low" :key="p.id" class="flex items-center gap-3"><img :src="p.images[0]" class="h-11 w-11 rounded-xl object-cover"><div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ p.name }}</p><div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full" :class="p.stock ? 'bg-amber-500' : 'bg-red-500'" :style="{width: Math.max(4, p.stock / Math.max(1,S.settings.lowStock) * 100)+'%'}"></div></div></div><span class="text-sm font-semibold" :class="p.stock ? 'text-amber-500' : 'text-red-500'">{{ p.stock }}</span></div>
            <p v-if="!low.length" class="py-8 text-center text-sm text-slate-400">✓</p>
          </div>
        </Card>
      </div>
    </div>`
  };

  window.VK_ADMIN = { useList, Card, StatCard, SearchBox, SelectionBar, PageHead, Empty, ChartBox, AdminLayout, AdminDashboard };
})();
