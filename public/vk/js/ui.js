/* VK_ETN — shared UI components */
(function () {
  const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, h } = Vue;
  const { S, t } = VK;

  const clickOutside = {
    mounted(el, binding) {
      el.__co = (e) => { if (!el.contains(e.target)) binding.value(e); };
      document.addEventListener('mousedown', el.__co);
    },
    unmounted(el) { document.removeEventListener('mousedown', el.__co); }
  };

  const Toasts = {
    template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm no-print">
      <TransitionGroup name="toast">
        <div v-for="x in S.toasts" :key="x.id" class="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft backdrop-blur bg-white/95 dark:bg-slate-900/95"
          :class="x.type==='error' ? 'border-red-200 dark:border-red-900' : x.type==='info' ? 'border-slate-200 dark:border-slate-700' : 'border-brand-200 dark:border-brand-800'">
          <i class="fa-solid mt-0.5" :class="x.type==='error' ? 'fa-circle-xmark text-red-500' : x.type==='info' ? 'fa-circle-info text-slate-500' : 'fa-circle-check text-brand-600'"></i>
          <p class="text-sm flex-1">{{ x.msg }}</p>
        </div>
      </TransitionGroup>
    </div>`
  };

  const ConfirmDialog = {
    setup() {
      const close = (v) => { if (S.confirm) { S.confirm.resolve(v); S.confirm = null; } };
      return { close };
    },
    template: `
    <Transition name="modal">
      <div v-if="S.confirm" class="fixed inset-0 z-[90] grid place-items-center bg-slate-900/50 backdrop-blur-sm p-4" @click.self="close(false)">
        <div class="modal-card w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl">
          <div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full" :class="S.confirm.danger ? 'bg-red-50 text-red-500 dark:bg-red-950' : 'bg-brand-50 text-brand-600'">
            <i class="fa-solid text-xl" :class="S.confirm.danger ? 'fa-trash-can' : 'fa-circle-question'"></i>
          </div>
          <h3 class="text-lg font-medium">{{ S.confirm.title }}</h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ S.confirm.text }}</p>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button class="rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition" @click="close(false)">{{ t('cancel') }}</button>
            <button class="rounded-xl py-2.5 text-sm font-medium text-white transition" :class="S.confirm.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-600 hover:bg-brand-700'" @click="close(true)">{{ t('confirm') }}</button>
          </div>
        </div>
      </div>
    </Transition>`
  };

  const Modal = {
    props: { show: Boolean, title: String, size: { type: String, default: 'max-w-2xl' } },
    emits: ['close'],
    template: `
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="show" class="fixed inset-0 z-[80] flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-3 sm:p-6" @click.self="$emit('close')">
          <div class="modal-card flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl sm:max-h-[calc(100dvh-3rem)]" :class="size">
            <div class="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h3 class="text-lg font-medium">{{ title }}</h3>
              <button class="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto p-6"><slot /></div>
            <div v-if="$slots.footer" class="flex shrink-0 justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4"><slot name="footer" /></div>
          </div>
        </div>
      </Transition>
    </Teleport>`
  };

  const AnimatedNumber = {
    props: { value: { type: Number, default: 0 }, format: { type: String, default: 'int' }, duration: { type: Number, default: 1400 } },
    setup(props) {
      const display = ref(0);
      let raf = null;
      const run = (from, to) => {
        cancelAnimationFrame(raf);
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / props.duration);
          const e = 1 - Math.pow(1 - p, 3);
          display.value = from + (to - from) * e;
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      };
      onMounted(() => run(0, props.value));
      watch(() => props.value, (n, o) => run(o || 0, n));
      onBeforeUnmount(() => cancelAnimationFrame(raf));
      const text = computed(() => props.format === 'money' ? VK.money(display.value) : props.format === 'percent' ? display.value.toFixed(1) + '%' : props.format === 'decimal' ? display.value.toFixed(1) : Math.round(display.value).toLocaleString('en-US'));
      return { text };
    },
    template: `<span>{{ text }}</span>`
  };

  const Stars = {
    props: { value: { type: Number, default: 0 }, size: { type: String, default: 'text-xs' } },
    template: `<span class="inline-flex items-center gap-0.5 text-brand-600 dark:text-brand-400" :class="size">
      <i v-for="i in 5" :key="i" class="fa-star" :class="value >= i ? 'fa-solid' : value >= i - 0.5 ? 'fa-solid fa-star-half-stroke' : 'fa-regular'"></i></span>`
  };

  const Logo = {
    props: { light: Boolean, small: Boolean },
    setup() {
      const parts = computed(() => {
        const n = S.settings.siteName || 'VK_ETN';
        const i = n.indexOf('_');
        return i > 0 ? [n.slice(0, i), n.slice(i)] : [n.slice(0, Math.ceil(n.length / 2)), n.slice(Math.ceil(n.length / 2))];
      });
      return { parts };
    },
    template: `
    <router-link to="/" class="flex items-center gap-2.5 shrink-0">
      <img v-if="S.settings.logo" :src="S.settings.logo" class="rounded-xl object-cover" :class="small ? 'h-9 w-9' : 'h-10 w-10'" alt="logo">
      <span v-else class="grid place-items-center rounded-xl border-2" :class="[small ? 'h-9 w-9' : 'h-10 w-10', light ? 'border-white/80 text-white' : 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400']">
        <i class="fa-solid fa-bag-shopping"></i>
      </span>
      <span class="font-semibold tracking-tight" :class="small ? 'text-xl' : 'text-2xl'">
        <span :class="light ? 'text-white' : 'text-slate-900 dark:text-white'">{{ parts[0] }}</span><span :class="light ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400'">{{ parts[1] }}</span>
      </span>
    </router-link>`
  };

  // ===== Language dropdown (English / Khmer) =====
  const LangSwitch = {
    props: { up: Boolean },
    directives: { clickOutside },
    setup() {
      const open = ref(false);
      const langs = [{ code: 'en', flag: '🇬🇧', label: 'English', short: 'EN' }, { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្មែរ', short: 'ខ្មែរ' }];
      const cur = computed(() => langs.find((l) => l.code === S.lang) || langs[0]);
      const pick = (c) => { open.value = false; VK.setLang(c); };
      return { open, langs, cur, pick };
    },
    template: `
    <div class="relative" v-click-outside="() => open=false">
      <button type="button" @click="open=!open" class="flex h-10 items-center gap-1.5 rounded-[5px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium hover:border-brand-500 transition" :title="t('language')">
        <span class="text-[15px] leading-none">{{ cur.flag }}</span><span>{{ cur.short }}</span><i class="fa-solid fa-chevron-down text-[9px] text-slate-400 transition" :class="open && 'rotate-180'"></i>
      </button>
      <Transition name="pop">
        <div v-if="open" class="absolute right-0 z-[70] w-40 overflow-hidden rounded-[5px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-xl" :class="up ? 'bottom-12' : 'top-12'">
          <button v-for="l in langs" :key="l.code" type="button" @click="pick(l.code)" class="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-[13px] transition" :class="S.lang===l.code ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800'">
            <span class="text-base leading-none">{{ l.flag }}</span><span class="flex-1 text-left">{{ l.label }}</span><i v-if="S.lang===l.code" class="fa-solid fa-check text-[11px]"></i>
          </button>
        </div>
      </Transition>
    </div>`
  };

  // ===== Input with icon (icon becomes active when focused / filled) =====
  const InputField = {
    props: { modelValue: [String, Number], icon: String, type: { type: String, default: 'text' }, label: String, placeholder: String, required: Boolean, autocomplete: String, name: String },
    emits: ['update:modelValue'],
    setup(props) {
      const focused = ref(false); const show = ref(false);
      const realType = computed(() => props.type === 'password' && show.value ? 'text' : props.type);
      const active = computed(() => focused.value || (props.modelValue !== undefined && props.modelValue !== ''));
      return { focused, show, realType, active };
    },
    template: `
    <label class="block">
      <span v-if="label" class="mb-1 block text-[12.5px] font-medium text-slate-600 dark:text-slate-300">{{ label }}<span v-if="required" class="text-red-500"> *</span></span>
      <span class="relative flex items-center">
        <i class="fa-solid pointer-events-none absolute left-3 w-4 text-center text-[13px] transition-colors duration-200" :class="[icon, focused ? 'text-brand-600 dark:text-brand-400' : active ? 'text-brand-500/80' : 'text-slate-400']"></i>
        <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" @focus="focused=true" @blur="focused=false"
          :type="realType" :placeholder="placeholder" :required="required" :autocomplete="autocomplete" :name="name"
          class="h-[42px] w-full rounded-[5px] border bg-white pl-9 text-[13.5px] outline-none transition duration-200 placeholder:text-slate-400 dark:bg-slate-900"
          :class="[type==='password' ? 'pr-10' : 'pr-3', focused ? 'border-brand-500 ring-[3px] ring-brand-500/15' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600']">
        <button v-if="type==='password'" type="button" tabindex="-1" @click="show=!show" class="absolute right-1.5 grid h-8 w-8 place-items-center rounded-[5px] text-slate-400 hover:text-brand-600 transition"><i class="fa-regular text-[13px]" :class="show ? 'fa-eye-slash' : 'fa-eye'"></i></button>
      </span>
    </label>`
  };

  // ===== Live search with product image + text =====
  const LiveSearch = {
    props: { autofocus: Boolean, full: Boolean },
    directives: { clickOutside },
    setup(props) {
      const router = VueRouter.useRouter();
      const q = ref(''); const open = ref(false); const active = ref(-1); const input = ref(null);
      const norm = (s) => String(s || '').toLowerCase();
      const all = computed(() => {
        const s = norm(q.value.trim()); if (!s) return [];
        return S.products.filter((p) => norm(p.name + ' ' + p.brand + ' ' + VK.catName(p.category) + ' ' + p.category).includes(s));
      });
      const results = computed(() => (q.value.trim() ? all.value.slice(0, 6) : [...S.products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4)));
      const cats = computed(() => { const s = norm(q.value.trim()); return s ? S.categories.filter((c) => norm(c.name.en + ' ' + c.name.km).includes(s)).slice(0, 3) : []; });
      watch(q, () => { active.value = -1; open.value = true; });
      const close = () => { open.value = false; active.value = -1; };
      const go = (p) => { close(); q.value = ''; if (input.value) input.value.blur(); router.push('/product/' + p.id); };
      const submit = () => {
        if (active.value >= 0 && results.value[active.value]) return go(results.value[active.value]);
        close(); if (input.value) input.value.blur();
        router.push({ path: '/shop', query: q.value.trim() ? { q: q.value.trim() } : {} });
      };
      const key = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); open.value = true; active.value = Math.min(results.value.length - 1, active.value + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(-1, active.value - 1); }
        else if (e.key === 'Escape') { close(); e.target.blur(); }
      };
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const hl = (text) => {
        const s = q.value.trim(); const safe = esc(text); if (!s) return safe;
        const i = norm(text).indexOf(norm(s)); if (i < 0) return safe;
        return esc(text.slice(0, i)) + '<mark class="bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 rounded-sm px-0.5">' + esc(text.slice(i, i + s.length)) + '</mark>' + esc(text.slice(i + s.length));
      };
      onMounted(() => { if (props.autofocus && input.value) setTimeout(() => input.value.focus(), 60); });
      return { q, open, active, input, all, results, cats, close, go, submit, key, hl, VK };
    },
    template: `
    <div class="relative" v-click-outside="close">
      <form @submit.prevent="submit" class="flex h-10 items-center gap-2 rounded-[5px] border border-transparent bg-slate-100 px-3 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-brand-500/15 dark:bg-slate-800/80 dark:focus-within:bg-slate-900">
        <i class="fa-solid fa-magnifying-glass text-[13px] text-slate-400"></i>
        <input ref="input" v-model="q" @focus="open=true" @keydown="key" :placeholder="t('searchProduct')" class="w-full bg-transparent text-[13.5px] outline-none placeholder:text-slate-400" autocomplete="off">
        <button v-if="q" type="button" @click="q=''; input.focus()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xs"></i></button>
      </form>
      <Transition name="pop">
        <div v-if="open" class="absolute top-full z-[70] mt-2 overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" :class="full ? 'left-0 right-0' : 'right-0 w-[min(92vw,400px)]'">
          <div class="max-h-[65vh] overflow-y-auto p-1.5">
            <p class="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ q.trim() ? t('searchResults') + ' (' + all.length + ')' : t('popular') }}</p>
            <button v-for="(p,i) in results" :key="p.id" type="button" @click="go(p)" @mouseenter="active=i" class="flex w-full items-center gap-3 rounded-[5px] p-2 text-left transition" :class="active===i ? 'bg-brand-50 dark:bg-slate-800' : ''">
              <img :src="p.images[0]" class="h-12 w-12 shrink-0 rounded-[5px] bg-brand-50 object-cover" loading="lazy">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13.5px] font-medium" v-html="hl(p.name)"></span>
                <span class="block truncate text-[11.5px] text-slate-500">{{ VK.catName(p.category) }} · {{ p.brand }} · <span :class="p.stock>0 ? 'text-brand-600' : 'text-red-500'">{{ p.stock>0 ? t('inStock') : t('outOfStock') }}</span></span>
              </span>
              <span class="text-right"><span class="block text-[13.5px] font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }}</span><span v-if="VK.discountOf(p)" class="block text-[11px] text-slate-400 line-through">{{ VK.money(p.price) }}</span></span>
            </button>
            <div v-if="q.trim() && !all.length" class="px-3 py-8 text-center text-sm text-slate-500"><i class="fa-solid fa-magnifying-glass mb-2 block text-2xl text-brand-200"></i>{{ t('noResults') }} “{{ q }}”</div>
            <div v-if="cats.length" class="flex flex-wrap gap-1.5 border-t border-slate-100 px-2.5 py-2.5 dark:border-slate-800">
              <router-link v-for="c in cats" :key="c.id" :to="{path:'/shop', query:{cat:c.id}}" @click="close(); q=''" class="flex items-center gap-1.5 rounded-[5px] bg-slate-100 px-2.5 py-1 text-xs hover:bg-brand-50 dark:bg-slate-800"><i class="fa-solid text-[10px] text-brand-600" :class="c.icon"></i>{{ c.name[S.lang] || c.name.en }}</router-link>
            </div>
          </div>
          <button v-if="q.trim() && all.length" type="button" @click="active=-1; submit()" class="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 py-2.5 text-[13px] font-medium text-brand-700 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-brand-300">{{ t('viewAllResults') }} ({{ all.length }}) <i class="fa-solid fa-arrow-right text-[11px]"></i></button>
        </div>
      </Transition>
    </div>`
  };

  const ThemeToggle = {
    setup() { return { VK }; },
    template: `
    <button @click="VK.toggleDark()" class="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition" :title="S.dark ? t('lightMode') : t('darkMode')">
      <Transition name="pop" mode="out-in">
        <i v-if="S.dark" key="s" class="fa-solid fa-sun text-amber-400"></i>
        <i v-else key="m" class="fa-solid fa-moon text-slate-600"></i>
      </Transition>
    </button>`
  };

  // ===== Date range dropdown =====
  const iso = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const DateRange = {
    props: { modelValue: { type: Object, required: true } },
    emits: ['update:modelValue'],
    directives: { clickOutside },
    setup(props, { emit }) {
      const open = ref(false);
      const customMode = ref(false);
      watch(open, (v) => { if (!v) customMode.value = false; });
      const from = ref(props.modelValue.from || iso(new Date()));
      const to = ref(props.modelValue.to || iso(new Date()));
      const range = computed(() => VK_UTIL.getRange(props.modelValue.preset, props.modelValue));
      const label = computed(() => props.modelValue.preset === 'custom' ? t('customRange') : t(props.modelValue.preset === 'all' ? 'allTime' : props.modelValue.preset));
      const pick = (p) => {
        const r = VK_UTIL.getRange(p, {});
        from.value = iso(r.from); to.value = iso(r.to);
        emit('update:modelValue', { preset: p, from: from.value, to: to.value });
        open.value = false;
      };
      const applyCustom = () => {
        if (!from.value || !to.value) return;
        if (from.value > to.value) { const x = from.value; from.value = to.value; to.value = x; }
        emit('update:modelValue', { preset: 'custom', from: from.value, to: to.value });
        open.value = false;
      };
      return { open, customMode, from, to, range, label, pick, applyCustom, presets: VK_UTIL.PRESETS, fmt: (d) => VK.fmtDate(d) };
    },
    template: `
    <div class="relative" v-click-outside="() => open=false">
      <button @click="open=!open" class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm font-medium hover:border-brand-500 transition">
        <i class="fa-regular fa-calendar text-brand-600 dark:text-brand-400"></i>
        <span>{{ label }}</span>
        <i class="fa-solid fa-chevron-down text-[10px] transition" :class="open && 'rotate-180'"></i>
      </button>
      <Transition name="pop">
        <div v-if="open" class="fixed inset-x-3 top-20 z-50 max-h-[80vh] overflow-y-auto sm:overflow-hidden sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[540px] sm:max-h-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
          <div class="grid sm:grid-cols-[200px_1fr]">
            <div class="border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-2">
              <p class="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('quickSelect') }}</p>
              <div class="max-h-72 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-1">
                <button @click="pick('all')" class="rounded-lg px-3 py-1.5 text-left text-sm transition" :class="modelValue.preset==='all' && !customMode ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'">{{ t('allTime') }}</button>
                <button v-for="p in presets" :key="p" @click="pick(p)" class="rounded-lg px-3 py-1.5 text-left text-sm transition" :class="modelValue.preset===p && !customMode ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'">{{ t(p) }}</button>
                <button @click="customMode=true" class="rounded-lg px-3 py-1.5 text-left text-sm transition" :class="modelValue.preset==='custom' || customMode ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'">{{ t('customRange') }}</button>
              </div>
            </div>
            <div class="p-4">
              <p class="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">{{ t('custom') }}</p>
              <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('from') }}</label>
              <input type="date" v-model="from" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:[color-scheme:dark]">
              <label class="mt-3 block text-xs font-medium text-slate-500 mb-1">{{ t('to') }}</label>
              <input type="date" v-model="to" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:[color-scheme:dark]">
              <div class="mt-4 rounded-xl bg-brand-50 dark:bg-brand-950/50 px-3 py-2.5 text-xs text-brand-800 dark:text-brand-200">
                {{ t('from') }}: <b>{{ fmt(from) }}</b> → {{ t('to') }}: <b>{{ fmt(to) }}</b>
              </div>
              <button @click="applyCustom" class="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition">{{ t('applyRange') }}</button>
            </div>
          </div>
          <div class="border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500">
            <i class="fa-regular fa-clock mr-1"></i>{{ fmt(range.from) }} → {{ fmt(range.to) }}
          </div>
        </div>
      </Transition>
    </div>`
  };

  // ===== Export menu =====
  const ExportMenu = {
    props: { rows: { type: Array, default: () => [] }, columns: { type: Array, default: () => [] }, filename: { type: String, default: 'export' }, title: { type: String, default: 'Report' } },
    directives: { clickOutside },
    setup(props) {
      const open = ref(false);
      const matrix = () => props.rows.map((r) => props.columns.map((c) => (r[c.key] === undefined || r[c.key] === null ? '' : r[c.key])));
      const heads = () => props.columns.map((c) => c.label);
      const stamp = () => new Date().toISOString().slice(0, 10);
      const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
      const excel = () => {
        const ws = XLSX.utils.aoa_to_sheet([heads(), ...matrix()]);
        ws['!cols'] = props.columns.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${props.filename}-${stamp()}.xlsx`);
      };
      const csv = () => {
        const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
        const text = [heads(), ...matrix()].map((r) => r.map(esc).join(',')).join('\n');
        download(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }), `${props.filename}-${stamp()}.csv`);
      };
      const pdf = () => {
        const doc = new jspdf.jsPDF({ orientation: props.columns.length > 5 ? 'landscape' : 'portrait' });
        doc.setFontSize(16); doc.setTextColor(21, 108, 83); doc.text(`${S.settings.siteName} — ${props.title}`, 14, 16);
        doc.setFontSize(9); doc.setTextColor(120); doc.text('Generated: ' + new Date().toLocaleString('en-GB'), 14, 22);
        doc.autoTable({ head: [heads()], body: matrix().map((r) => r.map(String)), startY: 27, styles: { fontSize: 8.5 }, headStyles: { fillColor: [21, 108, 83] }, alternateRowStyles: { fillColor: [238, 248, 244] } });
        doc.save(`${props.filename}-${stamp()}.pdf`);
      };
      const print = () => {
        const w = window.open('', '_blank', 'width=1000,height=700');
        const rows = matrix().map((r) => '<tr>' + r.map((v) => `<td>${String(v).replace(/</g, '&lt;')}</td>`).join('') + '</tr>').join('');
        w.document.write(`<html><head><title>${props.title}</title><style>body{font-family:Inter,'Kantumruy Pro',Arial,sans-serif;padding:24px;color:#111}h2{color:#156c53;margin:0}p{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{background:#156c53;color:#fff;text-align:left;padding:8px}td{border-bottom:1px solid #e5e7eb;padding:7px 8px}tr:nth-child(even) td{background:#eef8f4}</style></head><body><h2>${S.settings.siteName} — ${props.title}</h2><p>Printed: ${new Date().toLocaleString('en-GB')} · ${props.rows.length} rows</p><table><thead><tr>${heads().map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`);
        w.document.close();
      };
      const run = (fn) => { open.value = false; try { fn(); VK.toast(t('export') + ' ✓'); } catch (e) { VK.toast(e.message, 'error'); } };
      return { open, run, excel, csv, pdf, print };
    },
    template: `
    <div class="relative" v-click-outside="() => open=false">
      <button @click="open=!open" class="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition shadow-sm">
        <span>📤</span> {{ t('export') }} <i class="fa-solid fa-chevron-down text-[10px] transition" :class="open && 'rotate-180'"></i>
      </button>
      <Transition name="pop">
        <div v-if="open" class="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-2xl">
          <button @click="run(excel)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 transition">📊 Excel</button>
          <button @click="run(csv)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 transition">📄 CSV</button>
          <button @click="run(pdf)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 transition">📑 PDF</button>
          <button @click="run(print)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 transition">🖨️ {{ t('print') }}</button>
        </div>
      </Transition>
    </div>`
  };

  // ===== QR / KHQR / Barcode =====
  const QrCode = {
    props: { text: String },
    setup(props) {
      const src = computed(() => {
        if (!props.text || typeof qrcode === 'undefined') return '';
        const qr = qrcode(0, 'M'); qr.addData(props.text); qr.make();
        return qr.createDataURL(8, 0);
      });
      return { src };
    },
    template: `<img v-if="src" :src="src" alt="QR code">`
  };

  const KhqrCard = {
    props: { amount: Number, billNumber: String, payload: String, cfg: Object },
    components: { QrCode },
    setup(props) {
      const k = computed(() => props.cfg || S.settings.khqr);
      const payload = computed(() => props.payload || (props.cfg ? VK_UTIL.khqrPayload(Object.assign({}, props.cfg, { amount: props.amount, billNumber: props.billNumber, storeLabel: S.settings.siteName })) : VK.khqrString(props.amount, props.billNumber)));
      const amt = computed(() => k.value.currency === 'KHR' ? Math.round(props.amount * 4100).toLocaleString('en-US') : Number(props.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      return { k, payload, amt };
    },
    template: `
    <div class="khqr-card mx-auto">
      <div class="khqr-head"><span class="khqr-logo">KHQR</span></div>
      <div class="khqr-body">
        <div class="khqr-name">{{ k.merchantName }}</div>
        <div class="khqr-amount">{{ amt }}<small>{{ k.currency }}</small></div>
      </div>
      <div class="khqr-sep"></div>
      <div class="khqr-qr">
        <QrCode :text="payload" />
        <div class="khqr-center">{{ k.currency === 'KHR' ? '៛' : '$' }}</div>
      </div>
    </div>`
  };

  const Barcode = {
    props: { value: String, height: { type: Number, default: 50 } },
    setup(props) {
      const el = ref(null);
      const draw = () => { if (el.value && window.JsBarcode && props.value) JsBarcode(el.value, props.value, { format: 'CODE128', height: props.height, width: 1.8, fontSize: 13, margin: 0, displayValue: true, background: 'transparent' }); };
      onMounted(draw); watch(() => props.value, () => nextTick(draw));
      return { el };
    },
    template: `<svg ref="el" class="mx-auto max-w-full"></svg>`
  };

  const MapPicker = {
    props: { lat: Number, lng: Number, editable: { type: Boolean, default: true }, height: { type: String, default: '300px' } },
    emits: ['update', 'address'],
    setup(props, { emit }) {
      const el = ref(null); let map, marker;
      const icon = () => L.divIcon({ className: '', html: '<div style="transform:translate(-50%,-100%);color:#156c53;font-size:34px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))"><i class="fa-solid fa-location-dot"></i></div>', iconSize: [0, 0] });
      const geocode = async (lat, lng) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`);
          const d = await r.json(); if (d && d.display_name) emit('address', d.display_name);
        } catch (e) { /* ignore */ }
      };
      const setPos = (lat, lng, pan) => { marker.setLatLng([lat, lng]); if (pan) map.setView([lat, lng], 15); emit('update', { lat, lng }); geocode(lat, lng); };
      onMounted(() => {
        if (!window.L) return;
        const lat = props.lat || S.settings.storeLat, lng = props.lng || S.settings.storeLng;
        map = L.map(el.value, { scrollWheelZoom: false }).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        marker = L.marker([lat, lng], { draggable: props.editable, icon: icon() }).addTo(map);
        if (props.editable) {
          map.on('click', (e) => setPos(e.latlng.lat, e.latlng.lng));
          marker.on('dragend', () => { const p = marker.getLatLng(); setPos(p.lat, p.lng); });
        }
        setTimeout(() => map.invalidateSize(), 350);
      });
      onBeforeUnmount(() => { if (map) map.remove(); });
      const locate = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((p) => setPos(p.coords.latitude, p.coords.longitude, true), () => VK.toast(t('locationDenied'), 'error'));
      };
      return { el, locate };
    },
    template: `
    <div class="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div ref="el" :style="{height}"></div>
      <button v-if="editable" type="button" @click="locate" class="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-brand-700 shadow-lg hover:bg-brand-50 transition"><i class="fa-solid fa-location-crosshairs"></i>{{ t('useMyLocation') }}</button>
    </div>`
  };

  const ViewSwitch = {
    props: { modelValue: String },
    emits: ['update:modelValue'],
    template: `
    <div class="flex h-10 items-center rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-900">
      <button @click="$emit('update:modelValue','table')" class="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition" :class="modelValue==='table' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-brand-600'"><i class="fa-solid fa-table-list"></i><span class="hidden sm:inline">{{ t('table') }}</span></button>
      <button @click="$emit('update:modelValue','cards')" class="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition" :class="modelValue==='cards' ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-brand-600'"><i class="fa-solid fa-grip"></i><span class="hidden sm:inline">{{ t('cards') }}</span></button>
    </div>`
  };

  const Pager = {
    props: { page: Number, pages: Number, total: Number, size: Number },
    emits: ['update:page', 'update:size'],
    template: `
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
      <div class="flex items-center gap-2 text-slate-500">
        <select :value="size" @change="$emit('update:size', +$event.target.value); $emit('update:page', 1)" class="select-chevron cursor-pointer appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-2.5 pr-7 py-1 text-sm outline-none transition duration-200 hover:border-brand-400 focus:border-brand-500">
          <option v-for="n in [6,10,20,50]" :key="n" :value="n">{{ n }}</option>
        </select>{{ t('perPage') }} · {{ total }} {{ t('results') }}
      </div>
      <div class="flex items-center gap-1">
        <button :disabled="page<=1" @click="$emit('update:page', page-1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-brand-500 transition"><i class="fa-solid fa-chevron-left text-xs"></i></button>
        <span class="px-3 text-slate-500">{{ page }} {{ t('of') }} {{ Math.max(1,pages) }}</span>
        <button :disabled="page>=pages" @click="$emit('update:page', page+1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:border-brand-500 transition"><i class="fa-solid fa-chevron-right text-xs"></i></button>
      </div>
    </div>`
  };

  // ===== Image library: pick an image from the /vk/img folders (manifest.json) =====
  const ImageLibrary = {
    props: { show: Boolean },
    emits: ['close', 'pick'],
    components: { Modal },
    setup(props, { emit }) {
      const folders = ref({}); const tab = ref('products'); const q = ref(''); const loading = ref(false);
      const load = async () => {
        loading.value = true;
        try { const r = await fetch('/vk/img/manifest.json', { cache: 'no-store' }); folders.value = await r.json(); } catch (e) { folders.value = {}; }
        loading.value = false;
      };
      watch(() => props.show, (v) => { if (v) load(); });
      const files = computed(() => (folders.value[tab.value] || []).filter((f) => !q.value || f.toLowerCase().includes(q.value.toLowerCase())));
      const pick = (f) => { emit('pick', '/vk/img/' + tab.value + '/' + f); emit('close'); };
      return { folders, tab, q, loading, files, pick };
    },
    template: `
    <Modal :show="show" :title="t('chooseFromFolder')" size="max-w-3xl" @close="$emit('close')">
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="(list, name) in folders" :key="name" type="button" @click="tab=name" class="flex h-9 items-center gap-2 rounded-[5px] px-3 text-xs font-medium transition" :class="tab===name ? 'bg-brand-600 text-white' : 'border border-slate-200 dark:border-slate-700'"><i class="fa-regular fa-folder"></i>{{ name }} <span class="opacity-70">{{ list.length }}</span></button>
        <input v-model="q" :placeholder="t('search')" class="ml-auto h-9 w-40 rounded-[5px] border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700">
      </div>
      <p class="mt-2 font-mono text-[11px] text-slate-400">/vk/img/{{ tab }}/</p>
      <div v-if="loading" class="mt-3 grid grid-cols-4 gap-3"><div v-for="i in 8" :key="i" class="shimmer aspect-square rounded-[5px]"></div></div>
      <div v-else class="mt-3 grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
        <button v-for="f in files" :key="f" type="button" @click="pick(f)" class="group overflow-hidden rounded-[5px] border border-slate-200 text-left transition hover:border-brand-500 hover:shadow dark:border-slate-700">
          <img :src="'/vk/img/' + tab + '/' + f" loading="lazy" class="aspect-square w-full object-cover">
          <p class="truncate px-1.5 py-1 text-[10.5px] text-slate-500 group-hover:text-brand-600">{{ f }}</p>
        </button>
      </div>
      <p v-if="!loading && !files.length" class="py-10 text-center text-sm text-slate-500">{{ t('noData') }} — {{ t('folderHint') }}</p>
    </Modal>`
  };

  window.VK_UI = { clickOutside, Toasts, ConfirmDialog, Modal, ImageLibrary, AnimatedNumber, Stars, Logo, LangSwitch, InputField, LiveSearch, ThemeToggle, DateRange, ExportMenu, QrCode, KhqrCard, Barcode, MapPicker, ViewSwitch, Pager, iso };
})();
