/* VK_ETN — product, read more, cart, checkout (map + KHQR), receipt (barcode), auth, account */
(function () {
  const { ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;
  const { S, t } = VK;
  const { Stars, Modal, KhqrCard, Barcode, MapPicker, Logo } = VK_UI;
  const { ProductCard, SectionTitle } = VK_SHOP;

  const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition';

  // ===== Gallery: thumbnails left (click to change), stable crossfade, click to open zoom viewer =====
  const Lightbox = {
    props: { images: Array, start: Number, name: String },
    emits: ['close'],
    setup(props, { emit }) {
      const idx = ref(props.start || 0); const zoom = ref(false); const origin = ref('50% 50%');
      const go = (d) => { zoom.value = false; idx.value = (idx.value + d + props.images.length) % props.images.length; };
      const toggle = (e) => { const r = e.currentTarget.getBoundingClientRect(); origin.value = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; zoom.value = !zoom.value; };
      const pan = (e) => { if (!zoom.value) return; const r = e.currentTarget.getBoundingClientRect(); origin.value = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; };
      const key = (e) => { if (e.key === 'Escape') emit('close'); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
      let sx = 0; const ts = (e) => { sx = e.touches[0].clientX; }; const te = (e) => { if (zoom.value) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); };
      onMounted(() => { window.addEventListener('keydown', key); document.body.style.overflow = 'hidden'; });
      onBeforeUnmount(() => { window.removeEventListener('keydown', key); document.body.style.overflow = ''; });
      return { idx, zoom, origin, go, toggle, pan, ts, te };
    },
    template: `
    <div class="fixed inset-0 z-[95] flex flex-col bg-slate-950/95 backdrop-blur" @touchstart.passive="ts" @touchend="te">
      <div class="flex items-center justify-between gap-3 p-4 text-white">
        <p class="truncate text-sm opacity-80">{{ name }} · {{ idx+1 }}/{{ images.length }}</p>
        <div class="flex items-center gap-2"><span class="hidden text-xs opacity-60 sm:inline"><i class="fa-solid fa-magnifying-glass-plus mr-1"></i>{{ t('clickToZoom') }}</span><button @click="$emit('close')" class="grid h-10 w-10 place-items-center rounded-[5px] bg-white/10 hover:bg-white/20 transition"><i class="fa-solid fa-xmark"></i></button></div>
      </div>
      <div class="relative flex min-h-0 flex-1 items-center justify-center px-4" @click.self="$emit('close')">
        <div class="relative max-h-full max-w-[min(100%,820px)] overflow-hidden rounded-[5px] bg-white" :class="zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'" @click="toggle" @mousemove="pan">
          <img :src="images[idx]" :key="idx" class="block max-h-[72vh] w-auto max-w-full object-contain transition-transform duration-300 ease-out fade-up" :style="{ transformOrigin: origin, transform: zoom ? 'scale(2.2)' : 'scale(1)' }" draggable="false">
        </div>
        <button v-if="images.length>1" @click="go(-1)" class="absolute left-4 hidden sm:grid h-12 w-12 place-items-center rounded-[5px] bg-white/10 text-white hover:bg-white/20"><i class="fa-solid fa-chevron-left"></i></button>
        <button v-if="images.length>1" @click="go(1)" class="absolute right-4 hidden sm:grid h-12 w-12 place-items-center rounded-[5px] bg-white/10 text-white hover:bg-white/20"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="no-scrollbar flex justify-center gap-2 overflow-x-auto p-4 safe-bottom">
        <button v-for="(im,i) in images" :key="i" @click="zoom=false; idx=i" class="h-14 w-14 shrink-0 overflow-hidden rounded-[5px] border-2 transition" :class="i===idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-90'"><img :src="im" class="h-full w-full object-cover"></button>
      </div>
    </div>`
  };

  const Gallery = {
    props: { images: Array, name: String, badge: Number },
    components: { Lightbox },
    setup(props) {
      const idx = ref(0); const box = ref(false); const thumbs = ref(null);
      watch(() => props.images, () => { idx.value = 0; });
      const go = (d) => { idx.value = (idx.value + d + props.images.length) % props.images.length; };
      const pick = (i) => { idx.value = i; };
      let sx = 0, sy = 0, swiped = false;
      const ts = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiped = false; };
      const te = (e) => { const dx = e.changedTouches[0].clientX - sx; const dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? 1 : -1); } };
      const openBox = () => { if (!swiped) box.value = true; swiped = false; };
      watch(idx, (i) => { const el = thumbs.value && thumbs.value.children[i]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
      return { idx, box, thumbs, go, pick, ts, te, openBox };
    },
    template: `
    <div class="flex flex-col-reverse gap-3 sm:flex-row">
      <div class="relative sm:w-[76px] sm:shrink-0">
        <div ref="thumbs" class="no-scrollbar flex gap-2.5 overflow-x-auto p-0.5 sm:absolute sm:inset-0 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
          <button v-for="(im,i) in images" :key="i" type="button" @click="pick(i)" class="relative h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 overflow-hidden rounded-[5px] border-2 bg-brand-50 dark:bg-slate-800 transition duration-200" :class="i===idx ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-brand-300'">
            <img :src="im" class="h-full w-full object-cover" loading="lazy" draggable="false">
          </button>
        </div>
      </div>
      <div class="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[5px] border border-slate-200 bg-brand-50/70 dark:border-slate-800 dark:bg-slate-900" @click="openBox" @touchstart.passive="ts" @touchend="te">
        <img v-for="(im,i) in images" :key="im + i" :src="im" :alt="name" draggable="false" class="absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-500 ease-out" :class="i===idx ? 'opacity-100' : 'opacity-0'" :loading="i===0 ? 'eager' : 'lazy'">
        <span v-if="badge" class="pointer-events-none absolute left-3 top-3 rounded-[5px] bg-brand-600 px-2.5 py-1 text-xs font-medium text-white">-{{ badge }}%</span>
        <span class="pointer-events-none absolute right-3 top-3 rounded-[5px] bg-black/45 px-2 py-1 text-[11px] text-white backdrop-blur">{{ idx+1 }}/{{ images.length }}</span>
        <span class="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-[5px] bg-white/90 px-2.5 py-1.5 text-[11px] text-slate-700 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100 dark:bg-slate-800/90 dark:text-slate-200 sm:flex"><i class="fa-solid fa-magnifying-glass-plus"></i>{{ t('zoomHint') }}</span>
        <template v-if="images.length>1">
          <button type="button" @click.stop="go(-1)" class="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-[5px] bg-white/95 opacity-0 shadow-md transition hover:bg-white group-hover:opacity-100 dark:bg-slate-800/95 sm:grid"><i class="fa-solid fa-chevron-left text-sm"></i></button>
          <button type="button" @click.stop="go(1)" class="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-[5px] bg-white/95 opacity-0 shadow-md transition hover:bg-white group-hover:opacity-100 dark:bg-slate-800/95 sm:grid"><i class="fa-solid fa-chevron-right text-sm"></i></button>
          <div class="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden"><span v-for="(im,i) in images" :key="i" class="keep-round h-1.5 rounded-full transition-all" :class="i===idx ? 'w-5 bg-brand-600' : 'w-1.5 bg-white/80'"></span></div>
        </template>
      </div>
      <Teleport to="body"><Transition name="fade"><Lightbox v-if="box" :images="images" :start="idx" :name="name" @close="box=false" /></Transition></Teleport>
    </div>`
  };

  const StarPicker = {
    props: { modelValue: Number },
    emits: ['update:modelValue'],
    setup() { const hover = ref(0); return { hover }; },
    template: `
    <div class="star-pick flex items-center gap-1" @mouseleave="hover=0">
      <button v-for="i in 5" :key="i" type="button" @mouseenter="hover=i" @click="$emit('update:modelValue', i)" class="p-0.5 text-2xl">
        <i class="fa-star" :class="(hover || modelValue) >= i ? 'fa-solid text-amber-400' : 'fa-regular text-slate-300 dark:text-slate-600'"></i>
      </button>
      <span class="ml-2 text-sm text-slate-500">{{ hover || modelValue }}/5</span>
    </div>`
  };

  // ===== Comments / reviews about a product =====
  const ReviewsSection = {
    props: { product: Object },
    components: { Stars, StarPicker },
    setup(props) {
      const router = VueRouter.useRouter(); const route = VueRouter.useRoute();
      const sort = ref('newest'); const limit = ref(5); const busy = ref(false);
      const form = reactive({ rating: 5, text: '' });
      const all = computed(() => S.reviews.filter((r) => r.productId === props.product.id));
      const list = computed(() => {
        const s = { newest: (a, b) => b.createdAt.localeCompare(a.createdAt), highest: (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt), lowest: (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt) }[sort.value];
        return [...all.value].sort(s);
      });
      const dist = computed(() => [5, 4, 3, 2, 1].map((n) => { const c = all.value.filter((r) => r.rating === n).length; return { n, c, pct: all.value.length ? (c / all.value.length) * 100 : 0 }; }));
      const submit = async () => {
        if (!S.user) return router.push({ path: '/login', query: { redirect: route.fullPath } });
        if (form.text.trim().length < 2) return VK.toast(t('fillRequired'), 'error');
        busy.value = true;
        try { await VK.addReview(props.product.id, form.rating, form.text.trim()); form.text = ''; form.rating = 5; sort.value = 'newest'; VK.toast(t('reviewPosted')); }
        catch (e) { VK.toast(e.message, 'error'); }
        busy.value = false;
      };
      const canDelete = (r) => S.user && (S.user.role === 'admin' || r.userId === S.user.id);
      const del = async (r) => { if (!(await VK.askConfirm({}))) return; try { await VK.deleteReviews([r.id]); VK.toast(t('deleted')); } catch (e) { VK.toast(e.message, 'error'); } };
      const colors = ['bg-brand-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'];
      const color = (name) => colors[(name || 'a').charCodeAt(0) % colors.length];
      return { sort, limit, busy, form, all, list, dist, submit, canDelete, del, color, VK };
    },
    template: `
    <div class="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
      <div class="space-y-5">
        <div class="rounded-2xl bg-brand-50/70 dark:bg-slate-800/50 p-5">
          <div class="flex items-end gap-3"><span class="text-5xl font-semibold leading-none">{{ Number(product.rating).toFixed(1) }}</span><span class="pb-1 text-sm text-slate-500">/ 5</span></div>
          <div class="mt-2"><Stars :value="product.rating" size="text-base" /></div>
          <p class="mt-1 text-xs text-slate-500">{{ t('basedOn') }} {{ product.reviews }} {{ t('reviews') }}</p>
          <div class="mt-4 space-y-1.5">
            <div v-for="d in dist" :key="d.n" class="flex items-center gap-2 text-xs"><span class="w-3 text-slate-500">{{ d.n }}</span><i class="fa-solid fa-star text-[10px] text-amber-400"></i>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-white dark:bg-slate-700"><div class="h-full rounded-full bg-amber-400 transition-all duration-700" :style="{width: d.pct + '%'}"></div></div><span class="w-5 text-right text-slate-500">{{ d.c }}</span></div>
          </div>
        </div>
        <form @submit.prevent="submit" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 class="font-medium">{{ t('writeReview') }}</h4>
          <template v-if="S.user">
            <p class="mt-3 text-xs text-slate-500">{{ t('yourRating') }}</p>
            <StarPicker v-model="form.rating" />
            <textarea v-model="form.text" rows="3" maxlength="1000" :placeholder="t('reviewPlaceholder')" class="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition"></textarea>
            <button :disabled="busy" class="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60 transition"><i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>{{ t('submitReview') }}</button>
          </template>
          <router-link v-else :to="{path:'/login', query:{redirect: $route.fullPath}}" class="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-600 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white transition"><i class="fa-solid fa-right-to-bracket"></i>{{ t('loginToReview') }}</router-link>
        </form>
      </div>
      <div>
        <div class="mb-4 flex items-center justify-between gap-3">
          <h4 class="font-medium">{{ t('comments') }} <span class="text-slate-400">({{ all.length }})</span></h4>
          <select v-model="sort" class="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none"><option value="newest">{{ t('newest') }}</option><option value="highest">{{ t('highest') }}</option><option value="lowest">{{ t('lowest') }}</option></select>
        </div>
        <TransitionGroup name="list" tag="div" class="relative space-y-3">
          <div v-for="r in list.slice(0, limit)" :key="r.id" class="w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div class="flex items-start gap-3">
              <img v-if="r.avatar" :src="r.avatar" class="h-10 w-10 rounded-full object-cover"><span v-else class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-medium text-white" :class="color(r.name)">{{ r.name[0] }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5"><p class="text-sm font-medium">{{ r.name }}</p><span v-if="!r.seed" class="rounded-full bg-brand-50 dark:bg-brand-950 px-2 py-0.5 text-[10px] text-brand-700 dark:text-brand-300"><i class="fa-solid fa-circle-check mr-0.5"></i>{{ t('verified') }}</span><span class="text-xs text-slate-400">· {{ VK.timeAgo(r.createdAt) }}</span></div>
                <Stars :value="r.rating" size="text-[11px]" />
                <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ r.text }}</p>
              </div>
              <button v-if="canDelete(r)" @click="del(r)" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 transition"><i class="fa-regular fa-trash-can text-sm"></i></button>
            </div>
          </div>
        </TransitionGroup>
        <p v-if="!all.length" class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-12 text-center text-sm text-slate-500"><i class="fa-regular fa-comments mb-2 block text-3xl text-brand-300"></i>{{ t('noReviews') }}</p>
        <button v-if="list.length > limit" @click="limit += 5" class="mt-4 w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium hover:border-brand-500 transition">{{ t('showMore') }} ({{ list.length - limit }})</button>
      </div>
    </div>`
  };

  const QtyStepper = {
    props: { modelValue: Number, max: Number },
    emits: ['update:modelValue'],
    template: `
    <div class="inline-flex h-11 items-center rounded-xl border border-slate-200 dark:border-slate-700">
      <button type="button" @click="$emit('update:modelValue', Math.max(1, modelValue-1))" class="grid h-full w-11 place-items-center hover:text-brand-600"><i class="fa-solid fa-minus text-xs"></i></button>
      <span class="w-10 text-center font-medium">{{ modelValue }}</span>
      <button type="button" @click="$emit('update:modelValue', Math.min(max||99, modelValue+1))" class="grid h-full w-11 place-items-center hover:text-brand-600"><i class="fa-solid fa-plus text-xs"></i></button>
    </div>`
  };

  const NotFound = { template: `<div class="mx-auto max-w-xl py-32 text-center"><p class="text-7xl font-semibold text-brand-600">404</p><p class="mt-3 text-slate-500">{{ t('noData') }}</p><router-link to="/" class="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm text-white">{{ t('home') }}</router-link></div>` };

  // ===== PRODUCT VIEW =====
  const ProductPage = {
    components: { Gallery, Stars, QtyStepper, ProductCard, SectionTitle, NotFound, ReviewsSection, ProductRow: VK_SHOP.ProductRow },
    setup() {
      const route = VueRouter.useRoute(); const router = VueRouter.useRouter();
      const p = computed(() => VK.productById(route.params.id));
      const qty = ref(1); const tab = ref('desc'); const tabsEl = ref(null);
      watch(() => route.params.id, () => { qty.value = 1; tab.value = 'desc'; });
      const related = computed(() => p.value ? S.products.filter((x) => x.category === p.value.category && x.id !== p.value.id).slice(0, 8) : []);
      const reviewCount = computed(() => p.value ? S.reviews.filter((r) => r.productId === p.value.id).length : 0);
      const buyNow = () => { VK.addToCart(p.value, qty.value); router.push('/checkout'); };
      const toReviews = () => { tab.value = 'reviews'; if (tabsEl.value) window.scrollTo({ top: tabsEl.value.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); };
      return { p, qty, tab, tabsEl, related, reviewCount, buyNow, toReviews, VK };
    },
    template: `
    <NotFound v-if="!p" />
    <div v-else>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-8">
        <p class="truncate text-xs text-slate-500"><router-link to="/" class="hover:text-brand-600">{{ t('home') }}</router-link> / <router-link :to="{path:'/shop',query:{cat:p.category}}" class="hover:text-brand-600">{{ VK.catName(p.category) }}</router-link> / <span class="text-slate-700 dark:text-slate-300">{{ p.name }}</span></p>
        <div class="mt-4 sm:mt-6 grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div class="lg:sticky lg:top-24 self-start"><Gallery :images="p.images" :name="p.name" :badge="VK.discountOf(p)" /></div>
          <div class="fade-up">
            <p class="text-xs sm:text-sm font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">{{ p.brand }}</p>
            <h1 class="mt-1 text-2xl sm:text-[34px] font-semibold leading-tight tracking-tight">{{ p.name }}</h1>
            <button @click="toReviews" class="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition"><Stars :value="p.rating" size="text-sm" /><span>{{ Number(p.rating).toFixed(1) }} · {{ p.reviews }} {{ t('reviews') }}</span><span>·</span><span>{{ p.sold || 0 }} {{ t('sold') }}</span></button>
            <div class="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span class="text-3xl sm:text-4xl font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }}</span>
              <span v-if="VK.discountOf(p)" class="pb-1 text-base sm:text-lg text-slate-400 line-through">{{ VK.money(p.price) }}</span>
              <span v-if="VK.discountOf(p)" class="mb-1.5 rounded-full bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 text-xs font-medium text-red-500">-{{ VK.discountOf(p) }}%</span>
            </div>
            <p class="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">{{ p.short }}</p>
            <div class="mt-5">
              <div class="flex justify-between text-sm"><span :class="p.stock>0 ? 'text-brand-600' : 'text-red-500'" class="font-medium"><i class="fa-solid fa-circle text-[7px] mr-1.5 align-middle"></i>{{ p.stock>0 ? t('inStock') : t('outOfStock') }}</span><span class="text-slate-500">{{ p.stock }} {{ t('left') }}</span></div>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700" :style="{width: Math.min(100, p.stock / (p.stock + (p.sold||1)) * 100 + 8) + '%'}"></div></div>
            </div>
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <QtyStepper v-model="qty" :max="p.stock" />
              <button @click="VK.addToCart(p, qty)" :disabled="p.stock<=0" class="hidden sm:flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50 transition"><i class="fa-solid fa-cart-shopping"></i>{{ t('addToCart') }}</button>
              <button @click="buyNow" :disabled="p.stock<=0" class="hidden sm:block h-11 rounded-xl border-[1.5px] border-brand-700 dark:border-brand-400 px-6 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-700 hover:text-white disabled:opacity-50 transition">{{ t('buyNow') }}</button>
              <button @click="VK.toggleWish(p.id)" class="hidden sm:grid h-11 w-11 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 transition"><i :class="S.wishlist.includes(p.id) ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'"></i></button>
            </div>
            <div class="mt-6 grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm sm:grid-cols-3">
              <div class="flex items-center gap-2"><i class="fa-solid fa-truck-fast text-brand-600"></i>{{ t('freeShipOver') }} {{ VK.money(S.settings.freeShippingOver) }}</div>
              <div class="flex items-center gap-2"><i class="fa-solid fa-shield-halved text-brand-600"></i>{{ t('yearWarranty') }}</div>
              <div class="flex items-center gap-2"><i class="fa-solid fa-rotate-left text-brand-600"></i>{{ t('easyReturn') }}</div>
            </div>
            <router-link :to="'/product/'+p.id+'/about'" class="group mt-5 flex items-center justify-between rounded-2xl bg-brand-50 dark:bg-brand-950/40 px-5 py-4 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition">
              <span><span class="block font-medium">{{ t('aboutProduct') }}</span><span class="text-xs text-slate-500">{{ t('overview') }} · {{ t('features') }} · {{ t('specs') }}</span></span>
              <span class="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300">{{ t('readMore') }} <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition"></i></span>
            </router-link>
          </div>
        </div>

        <div ref="tabsEl" class="mt-10 sm:mt-14 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8">
          <div class="no-scrollbar flex gap-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
            <button v-for="x in [['desc','description'],['specs','specs'],['reviews','reviewsTitle']]" :key="x[0]" @click="tab=x[0]" class="-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition" :class="tab===x[0] ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">{{ t(x[1]) }}<span v-if="x[0]==='reviews'" class="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px]">{{ reviewCount }}</span></button>
          </div>
          <Transition name="fade" mode="out-in">
            <div v-if="tab==='desc'" key="d" class="pt-6">
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">{{ p.details }}</p>
              <router-link :to="'/product/'+p.id+'/about'" class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-600">{{ t('readMore') }} <i class="fa-solid fa-arrow-right text-xs"></i></router-link>
            </div>
            <div v-else-if="tab==='specs'" key="s" class="pt-6 grid gap-x-10 sm:grid-cols-2">
              <div v-for="s in p.specs" :key="s.k" class="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 py-3 text-sm"><span class="text-slate-500">{{ s.k }}</span><span class="font-medium text-right">{{ s.v }}</span></div>
            </div>
            <div v-else key="r" class="pt-6"><ReviewsSection :product="p" /></div>
          </Transition>
        </div>
      </div>
      <ProductRow v-if="related.length" :kicker="VK.catName(p.category)" :title="t('related')" :items="related" :link="{path:'/shop',query:{cat:p.category}}" />

      <!-- mobile sticky action bar (app-like) -->
      <div class="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-3 backdrop-blur-lg lg:hidden no-print safe-bottom sm:hidden">
        <button @click="VK.toggleWish(p.id)" class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 dark:border-slate-700"><i :class="S.wishlist.includes(p.id) ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'"></i></button>
        <button @click="VK.addToCart(p, qty)" :disabled="p.stock<=0" class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-brand-700 text-sm font-medium text-brand-700 dark:border-brand-400 dark:text-brand-300 disabled:opacity-50"><i class="fa-solid fa-cart-plus"></i><span class="truncate">{{ t('addToCart') }}</span></button>
        <button @click="buyNow" :disabled="p.stock<=0" class="h-12 flex-1 rounded-xl bg-brand-700 text-sm font-medium text-white disabled:opacity-50"><span class="truncate">{{ t('buyNow') }}</span></button>
      </div>
    </div>`
  };

  // ===== READ MORE (left sticky image, right text) =====
  const ProductAbout = {
    components: { Gallery, Stars, NotFound, QtyStepper },
    setup() {
      const route = VueRouter.useRoute();
      const p = computed(() => VK.productById(route.params.id));
      const qty = ref(1);
      return { p, qty, VK };
    },
    template: `
    <NotFound v-if="!p" />
    <div v-else class="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <router-link :to="'/product/'+p.id" class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600"><i class="fa-solid fa-arrow-left"></i>{{ t('back') }}</router-link>
      <div class="mt-6 grid gap-10 lg:grid-cols-2">
        <div class="lg:sticky lg:top-24 self-start">
          <Gallery :images="p.images" :name="p.name" :badge="VK.discountOf(p)" />
          <div class="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div><p class="font-medium">{{ p.name }}</p><p class="text-xl font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }} <span v-if="VK.discountOf(p)" class="text-sm font-normal text-slate-400 line-through">{{ VK.money(p.price) }}</span></p></div>
            <button @click="VK.addToCart(p, qty)" :disabled="p.stock<=0" class="flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50 transition"><i class="fa-solid fa-cart-shopping"></i>{{ t('addToCart') }}</button>
          </div>
        </div>
        <article class="fade-up">
          <p class="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.18em] text-brand-600 dark:text-brand-400"><span class="h-px w-8 bg-brand-600"></span>{{ t('aboutProduct') }}</p>
          <h1 class="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">{{ p.name }}</h1>
          <div class="mt-3 flex items-center gap-3 text-sm text-slate-500"><Stars :value="p.rating" size="text-sm" />{{ p.rating }} · {{ p.reviews }} {{ t('reviews') }} · {{ p.brand }}</div>
          <p class="mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200">{{ p.short }}</p>
          <h2 class="mt-10 text-xl font-semibold">{{ t('overview') }}</h2>
          <div class="mt-3 space-y-4 leading-relaxed text-slate-600 dark:text-slate-300">
            <p v-for="(para,i) in (p.details||'').split('\\n').filter(Boolean)" :key="i">{{ para }}</p>
          </div>
          <template v-if="p.features && p.features.length">
            <h2 class="mt-10 text-xl font-semibold">{{ t('features') }}</h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
              <li v-for="f in p.features" :key="f" class="flex items-start gap-3 rounded-xl bg-brand-50/70 dark:bg-slate-900 p-3 text-sm"><i class="fa-solid fa-circle-check mt-0.5 text-brand-600"></i>{{ f }}</li>
            </ul>
          </template>
          <template v-if="p.specs && p.specs.length">
            <h2 class="mt-10 text-xl font-semibold">{{ t('specs') }}</h2>
            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div v-for="(s,i) in p.specs" :key="s.k" class="grid grid-cols-[140px_1fr] text-sm" :class="i%2 ? '' : 'bg-slate-50 dark:bg-slate-900'"><span class="px-4 py-3 text-slate-500">{{ s.k }}</span><span class="px-4 py-3 font-medium">{{ s.v }}</span></div>
            </div>
          </template>
          <template v-if="p.inBox && p.inBox.length">
            <h2 class="mt-10 text-xl font-semibold">{{ t('inBox') }}</h2>
            <div class="mt-4 flex flex-wrap gap-2"><span v-for="b in p.inBox" :key="b" class="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-sm"><i class="fa-solid fa-box-open mr-2 text-brand-600"></i>{{ b }}</span></div>
          </template>
          <h2 class="mt-10 text-xl font-semibold">{{ t('warranty') }}</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><i class="fa-solid fa-shield-halved text-xl text-brand-600"></i><p class="mt-2 font-medium">{{ t('yearWarranty') }}</p></div>
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><i class="fa-solid fa-rotate-left text-xl text-brand-600"></i><p class="mt-2 font-medium">{{ t('easyReturn') }}</p></div>
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><i class="fa-solid fa-certificate text-xl text-brand-600"></i><p class="mt-2 font-medium">{{ t('original') }}</p></div>
          </div>
        </article>
      </div>
    </div>`
  };

  // ===== CART =====
  const CartPage = {
    components: { QtyStepper },
    setup() { const code = ref(''); return { VK, code }; },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <h1 class="text-3xl font-semibold">{{ t('yourCart') }} <span class="text-base font-normal text-slate-500">({{ VK.cartCount.value }} {{ t('items') }})</span></h1>
      <div v-if="!VK.cartLines.value.length" class="mt-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 py-24 text-center">
        <i class="fa-solid fa-cart-shopping text-5xl text-brand-200"></i><p class="mt-4 text-slate-500">{{ t('emptyCart') }}</p>
        <router-link to="/shop" class="mt-6 inline-block rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-white hover:bg-brand-800">{{ t('continueShopping') }}</router-link>
      </div>
      <div v-else class="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <TransitionGroup name="list" tag="div" class="relative space-y-4">
          <div v-for="l in VK.cartLines.value" :key="l.id" class="flex w-full gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <router-link :to="'/product/'+l.id" class="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50"><img :src="l.product.images[0]" class="h-full w-full object-cover"></router-link>
            <div class="flex flex-1 flex-col">
              <div class="flex justify-between gap-3"><div><router-link :to="'/product/'+l.id" class="font-medium hover:text-brand-600">{{ l.product.name }}</router-link><p class="text-xs text-slate-500">{{ VK.catName(l.product.category) }}</p></div><p class="font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(l.line) }}</p></div>
              <div class="mt-auto flex items-center justify-between pt-2">
                <QtyStepper :modelValue="l.qty" :max="l.product.stock" @update:modelValue="v => VK.setQty(l.id, v)" />
                <button @click="VK.removeFromCart(l.id)" class="text-sm text-red-500 hover:text-red-600"><i class="fa-regular fa-trash-can mr-1"></i>{{ t('remove') }}</button>
              </div>
            </div>
          </div>
        </TransitionGroup>
        <aside class="lg:sticky lg:top-24 self-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 class="font-medium">{{ t('orderSummary') }}</h3>
          <form @submit.prevent="VK.applyCoupon(code)" class="mt-4 flex gap-2"><input v-model="code" :placeholder="t('coupon')" class="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm uppercase outline-none focus:border-brand-500"><button class="rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 px-4 text-sm font-medium text-white">{{ t('apply') }}</button></form>
          <p v-if="S.coupon" class="mt-2 text-xs text-brand-600"><i class="fa-solid fa-tag mr-1"></i>{{ S.coupon.code }} (-{{ S.coupon.percent }}%) <button class="ml-2 text-red-500" @click="S.coupon=null">×</button></p>
          <div class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">{{ t('subtotal') }}</span><span>{{ VK.money(VK.totals.value.subtotal) }}</span></div>
            <div v-if="VK.totals.value.discount" class="flex justify-between text-brand-600"><span>{{ t('discount') }}</span><span>-{{ VK.money(VK.totals.value.discount) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">{{ t('shipping') }}</span><span>{{ VK.totals.value.shipping ? VK.money(VK.totals.value.shipping) : t('free') }}</span></div>
            <div class="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-lg font-semibold"><span>{{ t('total') }}</span><span class="text-brand-700 dark:text-brand-400">{{ VK.money(VK.totals.value.total) }}</span></div>
          </div>
          <router-link to="/checkout" class="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 transition">{{ t('checkout') }} <i class="fa-solid fa-arrow-right"></i></router-link>
          <router-link to="/shop" class="mt-3 block text-center text-sm text-slate-500 hover:text-brand-600">{{ t('continueShopping') }}</router-link>
        </aside>
      </div>
    </div>`
  };

  // ===== KHQR payment modal (left: KHQR card · right: payment details) =====
  const KhqrModal = {
    props: { order: Object },
    emits: ['close', 'paid'],
    components: { KhqrCard },
    setup(props, { emit }) {
      const payload = ref(''); const left = ref(0); const total = ref(180); const state = ref('wait'); let timer, poll;
      const gen = () => {
        payload.value = VK.khqrString(props.order.total, props.order.id);
        total.value = Number(S.settings.khqr.expire) || 180; left.value = total.value; state.value = 'wait';
        clearInterval(timer); clearInterval(poll);
        timer = setInterval(() => { left.value--; if (left.value <= 0) { state.value = 'expired'; clearInterval(timer); clearInterval(poll); } }, 1000);
        poll = setInterval(() => check(true), 5000);
      };
      const success = async () => {
        clearInterval(timer); clearInterval(poll); state.value = 'success';
        try { await VK.markOrderPaid(props.order.id); } catch (e) { /* ignore */ }
        setTimeout(() => emit('paid'), 1600);
      };
      const check = async (silent) => {
        if (state.value !== 'wait' && state.value !== 'checking') return;
        try {
          if (!silent) state.value = 'checking';
          const r = await VK.api('/api/khqr/check', { method: 'POST', body: { qr: payload.value } });
          if (r.paid) return success();
          if (r.demo && !silent) { setTimeout(success, 1500); return; }
          if (!silent) { state.value = 'wait'; VK.toast(t('paymentNotReceived'), 'info'); }
        } catch (e) { if (!silent) state.value = 'wait'; }
      };
      onMounted(() => { gen(); document.body.style.overflow = 'hidden'; });
      onBeforeUnmount(() => { clearInterval(timer); clearInterval(poll); document.body.style.overflow = ''; });
      const mmss = computed(() => String(Math.floor(left.value / 60)).padStart(2, '0') + ':' + String(left.value % 60).padStart(2, '0'));
      const pct = computed(() => Math.max(0, (left.value / total.value) * 100));
      const k = computed(() => S.settings.khqr);
      const amountText = computed(() => k.value.currency === 'KHR' ? Math.round(props.order.total * 4100).toLocaleString('en-US') + ' ៛' : VK.money(props.order.total));
      const download = () => {
        const qr = qrcode(0, 'M'); qr.addData(payload.value); qr.make();
        const n = qr.getModuleCount(); const W = 600; const cell = Math.floor(470 / n); const size = cell * n;
        const H = 300 + size + 70; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
        const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
        g.fillStyle = '#ffffff'; rr(0, 0, W, H, 36); g.fill(); g.save(); rr(0, 0, W, H, 36); g.clip();
        g.fillStyle = '#E1232E'; g.fillRect(0, 0, W, 110);
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(W, 62); g.lineTo(W, 111); g.lineTo(W - 49, 111); g.closePath(); g.fill(); g.restore();
        g.fillStyle = '#fff'; g.font = '700 44px Inter, Arial'; g.textAlign = 'center'; g.fillText('KHQR', W / 2, 72);
        g.textAlign = 'left'; g.fillStyle = '#222'; g.font = '400 26px Inter, Arial'; g.fillText(k.value.merchantName, 50, 165);
        g.fillStyle = '#000'; g.font = '600 46px Inter, Arial'; g.fillText(k.value.currency === 'KHR' ? Math.round(props.order.total * 4100).toLocaleString('en-US') : Number(props.order.total).toFixed(2), 50, 225);
        const aw = g.measureText(k.value.currency === 'KHR' ? Math.round(props.order.total * 4100).toLocaleString('en-US') : Number(props.order.total).toFixed(2)).width;
        g.font = '500 24px Inter, Arial'; g.fillText(k.value.currency, 62 + aw, 225);
        g.strokeStyle = 'rgba(0,0,0,.2)'; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.moveTo(0, 262); g.lineTo(W, 262); g.stroke(); g.setLineDash([]);
        const ox = (W - size) / 2, oy = 290; g.fillStyle = '#000';
        for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) g.fillRect(ox + col * cell, oy + r * cell, cell, cell);
        g.beginPath(); g.arc(W / 2, oy + size / 2, 34, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
        g.beginPath(); g.arc(W / 2, oy + size / 2, 27, 0, Math.PI * 2); g.fillStyle = '#000'; g.fill();
        g.fillStyle = '#fff'; g.font = '600 30px Inter, Arial'; g.textAlign = 'center'; g.fillText(k.value.currency === 'KHR' ? '៛' : '$', W / 2, oy + size / 2 + 11);
        const name = 'KHQR-' + props.order.id + '.png';
        const save = (href, revoke) => { const a = document.createElement('a'); a.download = name; a.href = href; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000); VK.toast(t('downloadQr') + ' ✓'); };
        if (c.toBlob) c.toBlob((blob) => (blob ? save(URL.createObjectURL(blob), true) : save(c.toDataURL('image/png'))), 'image/png');
        else save(c.toDataURL('image/png'));
      };
      const banks = ['ABA', 'ACLEDA', 'Wing', 'Canadia', 'Prince', 'Sathapana', 'Bakong'];
      return { payload, left, state, gen, check, mmss, pct, k, amountText, download, banks, VK };
    },
    template: `
    <div class="fixed inset-0 z-[85] flex items-end justify-center bg-slate-900/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div class="modal-card relative w-full max-h-[94vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-[900px] sm:rounded-3xl md:grid md:grid-cols-[1.05fr_1fr] md:overflow-hidden">
        <!-- LEFT: KHQR (light background, padded) -->
        <div class="relative flex flex-col items-center justify-center gap-5 border-b border-slate-200 bg-slate-50 px-6 pb-7 pt-4 dark:border-slate-800 dark:bg-slate-800/40 sm:px-10 sm:py-10 md:border-b-0 md:border-r">
          <div class="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600 sm:hidden"></div>
          <div class="relative rounded-[5px] bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-5">
            <KhqrCard :amount="order.total" :bill-number="order.id" :payload="payload" />
            <Transition name="fade">
              <div v-if="state==='expired'" class="absolute inset-0 grid place-content-center gap-3 rounded-[5px] bg-white/95 text-center text-slate-800">
                <i class="fa-solid fa-clock-rotate-left text-4xl text-khqr-red"></i><p class="font-medium">{{ t('qrExpired') }}</p>
                <button @click="gen" class="mx-auto rounded-[5px] bg-khqr-red px-5 py-2 text-sm font-medium text-white">{{ t('regenerate') }}</button>
              </div>
            </Transition>
            <Transition name="fade">
              <div v-if="state==='success'" class="absolute inset-0 grid place-content-center gap-3 rounded-[5px] bg-white text-center text-slate-800">
                <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-3xl text-white fade-up"><i class="fa-solid fa-check"></i></div><p class="font-medium text-brand-700">{{ t('paymentSuccess') }}</p>
              </div>
            </Transition>
          </div>
          <div class="text-center">
            <p class="text-[13px] text-slate-600 dark:text-slate-300"><i class="fa-solid fa-mobile-screen-button mr-1.5 text-khqr-red"></i>{{ t('scanToPay') }}</p>
            <div class="mt-3 flex max-w-[330px] flex-wrap justify-center gap-1.5">
              <span v-for="b in banks" :key="b" class="rounded-[5px] border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{{ b }}</span>
            </div>
            <button @click="download" class="mt-4 inline-flex h-10 items-center gap-2 rounded-[5px] border border-khqr-red/30 bg-white px-4 text-[13px] font-medium text-khqr-red hover:bg-red-50 transition dark:bg-slate-900 dark:hover:bg-red-950/30"><i class="fa-solid fa-download"></i>{{ t('downloadQr') }} (PNG)</button>
          </div>
        </div>
        <!-- RIGHT: details -->
        <div class="flex flex-col p-5 sm:p-8">
          <div class="flex items-start justify-between gap-3">
            <div><p class="text-xs uppercase tracking-wider text-slate-400">{{ t('payment') }}</p><h3 class="mt-0.5 text-xl font-semibold">{{ t('payWithKhqr') }}</h3></div>
            <button @click="$emit('close')" class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"><i class="fa-solid fa-xmark text-sm"></i></button>
          </div>
          <div class="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-khqr-red text-[11px] font-semibold text-white">KHQR</span>
            <div class="min-w-0"><p class="truncate text-sm font-medium">{{ k.merchantName }}</p><p class="truncate text-xs text-slate-500">{{ k.accountId }} · {{ k.city }}</p></div>
          </div>
          <div class="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">{{ t('orderNo') }}</span><span class="font-medium">{{ order.id }}</span></div>
            <div class="mt-1.5 flex justify-between"><span class="text-slate-500">{{ t('date') }}</span><span>{{ VK.fmtDate(order.createdAt, true) }}</span></div>
            <div class="my-3 border-t border-dashed border-slate-300 dark:border-slate-700"></div>
            <div v-for="i in order.items.slice(0,3)" :key="i.id" class="mt-1.5 flex items-center gap-2"><img :src="i.image" class="h-8 w-8 rounded-lg object-cover"><span class="flex-1 truncate">{{ i.name }} <span class="text-slate-400">× {{ i.qty }}</span></span><span>{{ VK.money(i.price*i.qty) }}</span></div>
            <p v-if="order.items.length>3" class="mt-1.5 text-xs text-slate-400">+{{ order.items.length-3 }} {{ t('more') }}</p>
            <div class="my-3 border-t border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="flex items-end justify-between"><span class="text-slate-500">{{ t('amount') }}</span><span class="text-2xl font-semibold text-khqr-red">{{ amountText }}</span></div>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between text-sm"><span class="text-slate-500"><i class="fa-regular fa-clock mr-1.5"></i>{{ t('expiresIn') }}</span><span class="font-mono text-base font-medium" :class="left<30 ? 'text-red-500' : ''">{{ mmss }}</span></div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full transition-all duration-1000 ease-linear" :class="left<30 ? 'bg-red-500' : 'bg-khqr-red/80'" :style="{width: pct + '%'}"></div></div>
          </div>
          <ol class="mt-5 space-y-2.5 text-sm">
            <li v-for="(s,i) in ['step1','step2','step3']" :key="s" class="flex items-start gap-3"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-50 text-xs font-medium text-khqr-red dark:bg-red-950/40">{{ i+1 }}</span><span class="text-slate-600 dark:text-slate-300">{{ t(s) }}</span></li>
          </ol>
          <div class="mt-6 grid grid-cols-2 gap-2.5 md:mt-auto md:pt-6">
            <button @click="$emit('close')" class="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">{{ t('close') }}</button>
            <button @click="check(false)" :disabled="state!=='wait'" class="flex h-12 items-center justify-center gap-2 rounded-xl bg-khqr-red text-sm font-medium text-white hover:brightness-110 disabled:opacity-70 transition"><i class="fa-solid" :class="state==='checking' ? 'fa-spinner fa-spin' : state==='success' ? 'fa-check' : 'fa-circle-check'"></i>{{ state==='checking' ? t('checking') : state==='success' ? t('paid') : t('iPaid') }}</button>
          </div>
          <p class="mt-3 text-center text-[11px] text-slate-400"><i class="fa-solid fa-shield-halved mr-1"></i>{{ t('supportedBanks') }}<span v-if="!S.settings.khqr.hasToken && !S.settings.khqr.token"> · {{ t('demoMode') }}</span></p>
        </div>
      </div>
    </div>`
  };

  // ===== CHECKOUT (map + payment) =====
  const CheckoutPage = {
    components: { MapPicker, KhqrModal },
    setup() {
      const router = VueRouter.useRouter();
      const f = reactive({ name: S.user ? S.user.name : '', phone: S.user ? S.user.phone : '', address: '', note: '', lat: S.settings.storeLat, lng: S.settings.storeLng, payment: 'khqr' });
      const busy = ref(false); const pending = ref(null);
      onMounted(() => { if (!VK.cartLines.value.length) router.replace('/cart'); });
      const submit = async () => {
        if (!f.name || !f.phone || !f.address) return VK.toast(t('fillRequired'), 'error');
        busy.value = true;
        try {
          const order = await VK.placeOrder({ customer: { name: f.name, phone: f.phone, address: f.address, lat: f.lat, lng: f.lng }, payment: f.payment, note: f.note });
          VK.toast(t('orderPlaced'));
          if (f.payment === 'khqr') pending.value = order; else router.push('/receipt/' + order.id);
        } catch (e) { VK.toast(e.message, 'error'); }
        busy.value = false;
      };
      const done = () => { const id = pending.value.id; pending.value = null; router.push('/receipt/' + id); };
      return { f, busy, submit, pending, done, VK, inputCls };
    },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <h1 class="text-3xl font-semibold">{{ t('checkout') }}</h1>
      <form @submit.prevent="submit" class="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div class="space-y-6">
          <section class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 class="flex items-center gap-3 font-medium"><span class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm text-white">1</span>{{ t('delivery') }}</h3>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label class="mb-1.5 block text-sm font-medium">{{ t('fullName') }} *</label><input v-model="f.name" :class="inputCls" required></div>
              <div><label class="mb-1.5 block text-sm font-medium">{{ t('phone') }} *</label><input v-model="f.phone" :class="inputCls" placeholder="012 345 678" required></div>
              <div class="sm:col-span-2"><label class="mb-1.5 block text-sm font-medium">{{ t('address') }} *</label><textarea v-model="f.address" rows="2" :class="inputCls" required></textarea></div>
            </div>
            <p class="mt-5 mb-2 text-sm font-medium"><i class="fa-solid fa-map-location-dot mr-2 text-brand-600"></i>{{ t('pinMap') }}</p>
            <MapPicker :lat="f.lat" :lng="f.lng" @update="p => { f.lat = p.lat; f.lng = p.lng }" @address="a => f.address = a" height="320px" />
            <p class="mt-2 text-xs text-slate-500">{{ t('mapHint') }} · {{ f.lat.toFixed(5) }}, {{ f.lng.toFixed(5) }}</p>
            <div class="mt-4"><label class="mb-1.5 block text-sm font-medium">{{ t('note') }}</label><input v-model="f.note" :class="inputCls"></div>
          </section>
          <section class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 class="flex items-center gap-3 font-medium"><span class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm text-white">2</span>{{ t('payment') }}</h3>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition" :class="f.payment==='khqr' ? 'border-khqr-red bg-red-50/50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700'">
                <input type="radio" value="khqr" v-model="f.payment" class="sr-only">
                <span class="grid h-12 w-16 place-items-center rounded-lg bg-khqr-red text-xs font-extrabold tracking-wider text-white">KHQR</span>
                <span><span class="block font-medium">{{ t('khqr') }}</span><span class="text-xs text-slate-500">{{ t('khqrDesc') }}</span></span>
                <i v-if="f.payment==='khqr'" class="fa-solid fa-circle-check absolute right-3 top-3 text-khqr-red"></i>
              </label>
              <label class="relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition" :class="f.payment==='cod' ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/30' : 'border-slate-200 dark:border-slate-700'">
                <input type="radio" value="cod" v-model="f.payment" class="sr-only">
                <span class="grid h-12 w-16 place-items-center rounded-lg bg-brand-600 text-xl text-white"><i class="fa-solid fa-money-bill-wave"></i></span>
                <span><span class="block font-medium">{{ t('cod') }}</span><span class="text-xs text-slate-500">{{ t('codDesc') }}</span></span>
                <i v-if="f.payment==='cod'" class="fa-solid fa-circle-check absolute right-3 top-3 text-brand-600"></i>
              </label>
            </div>
          </section>
        </div>
        <aside class="lg:sticky lg:top-24 self-start rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 class="font-medium">{{ t('orderSummary') }}</h3>
          <div class="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            <div v-for="l in VK.cartLines.value" :key="l.id" class="flex items-center gap-3">
              <div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50"><img :src="l.product.images[0]" class="h-full w-full object-cover"><span class="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-brand-600 text-[10px] font-semibold text-white">{{ l.qty }}</span></div>
              <p class="flex-1 text-sm font-medium line-clamp-2">{{ l.product.name }}</p><p class="text-sm font-medium">{{ VK.money(l.line) }}</p>
            </div>
          </div>
          <div class="mt-5 space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-4 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">{{ t('subtotal') }}</span><span>{{ VK.money(VK.totals.value.subtotal) }}</span></div>
            <div v-if="VK.totals.value.discount" class="flex justify-between text-brand-600"><span>{{ t('discount') }} ({{ S.coupon.code }})</span><span>-{{ VK.money(VK.totals.value.discount) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">{{ t('shipping') }}</span><span>{{ VK.totals.value.shipping ? VK.money(VK.totals.value.shipping) : t('free') }}</span></div>
            <div class="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-lg font-semibold"><span>{{ t('total') }}</span><span class="text-brand-700 dark:text-brand-400">{{ VK.money(VK.totals.value.total) }}</span></div>
          </div>
          <button :disabled="busy" class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-60" :class="f.payment==='khqr' ? 'bg-khqr-red hover:brightness-110' : 'bg-brand-700 hover:bg-brand-800'">
            <i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : f.payment==='khqr' ? 'fa-qrcode' : 'fa-check'"></i>{{ t('placeOrder') }}
          </button>
        </aside>
      </form>
      <Transition name="modal"><KhqrModal v-if="pending" :order="pending" @close="done" @paid="done" /></Transition>
    </div>`
  };

  // ===== RECEIPT (barcode) =====
  const ReceiptPage = {
    components: { Barcode, Logo, NotFound, KhqrModal },
    setup() {
      const route = VueRouter.useRoute();
      const o = computed(() => S.orders.find((x) => x.id === route.params.id));
      const payOpen = ref(false);
      const print = () => window.print();
      const pdf = () => {
        const order = o.value; const doc = new jspdf.jsPDF({ unit: 'mm', format: [100, 170 + order.items.length * 8] });
        const W = 100; let y = 12;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(21, 108, 83); doc.text(S.settings.siteName, W / 2, y, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90); y += 5; doc.text(S.settings.address, W / 2, y, { align: 'center', maxWidth: 85 }); y += 7; doc.text(S.settings.phone + ' · ' + S.settings.email, W / 2, y, { align: 'center' });
        y += 5; doc.setDrawColor(200); doc.setLineDashPattern([1, 1], 0); doc.line(6, y, W - 6, y); y += 6;
        doc.setTextColor(20); doc.setFontSize(9);
        [[t('orderNo'), order.id], [t('date'), VK.fmtDate(order.createdAt, true)], [t('customer'), order.customer.name], [t('phone'), order.customer.phone], [t('payment'), order.payment === 'khqr' ? 'KHQR' : 'COD'], [t('status'), order.paid ? 'PAID' : 'UNPAID']].forEach(([k, v]) => { doc.text(String(k), 6, y); doc.text(String(v), W - 6, y, { align: 'right' }); y += 5; });
        doc.autoTable({ startY: y + 1, margin: { left: 6, right: 6 }, head: [['Item', 'Qty', 'Price']], body: order.items.map((i) => [i.name, i.qty, VK.money(i.price * i.qty)]), styles: { fontSize: 8 }, headStyles: { fillColor: [21, 108, 83] }, columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } } });
        y = doc.lastAutoTable.finalY + 6;
        [[t('subtotal'), VK.money(order.subtotal)], [t('discount'), '-' + VK.money(order.discount || 0)], [t('shipping'), VK.money(order.shipping)]].forEach(([k, v]) => { doc.text(k, 6, y); doc.text(v, W - 6, y, { align: 'right' }); y += 5; });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(t('total'), 6, y + 2); doc.text(VK.money(order.total), W - 6, y + 2, { align: 'right' }); y += 8;
        const c = document.createElement('canvas'); JsBarcode(c, order.id, { format: 'CODE128', height: 50, width: 2, fontSize: 16, margin: 4 });
        doc.addImage(c.toDataURL('image/png'), 'PNG', 20, y, 60, 22); y += 28;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90); doc.text('Thank you for shopping with us!', W / 2, y, { align: 'center' });
        doc.save('receipt-' + order.id + '.pdf');
      };
      const history = computed(() => {
        const ord = o.value; if (!ord) return [];
        const same = (x) => ord.userId ? x.userId === ord.userId : (!x.userId && x.customer && ord.customer && x.customer.phone === ord.customer.phone && x.customer.name === ord.customer.name);
        return S.orders.filter(same).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      });
      const spent = computed(() => history.value.filter((x) => x.status !== 'cancelled').reduce((s2, x) => s2 + x.total, 0));
      const stCls = (st) => ({ pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' }[st]);
      return { o, print, pdf, history, spent, stCls, payOpen, VK };
    },
    template: `
    <NotFound v-if="!o" />
    <div v-else class="mx-auto max-w-7xl px-4 sm:px-6 pt-5 sm:pt-10">
     <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-10">
      <aside class="no-print order-2 space-y-4 lg:order-1 lg:sticky lg:top-24">
        <div class="rounded-[5px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 font-medium text-white">{{ (o.customer.name||'?')[0] }}</span>
            <div class="min-w-0 flex-1"><p class="truncate font-medium">{{ o.customer.name }}</p><p class="truncate text-xs text-slate-500">{{ o.customer.phone }}</p></div>
          </div>
          <p class="mt-2 line-clamp-2 text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1 text-brand-600"></i>{{ o.customer.address }}</p>
          <div class="mt-3 grid grid-cols-2 gap-2 text-center">
            <div class="rounded-[5px] bg-slate-50 py-2 dark:bg-slate-800"><p class="font-semibold">{{ history.length }}</p><p class="text-[11px] text-slate-500">{{ t('orders') }}</p></div>
            <div class="rounded-[5px] bg-slate-50 py-2 dark:bg-slate-800"><p class="font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(spent) }}</p><p class="text-[11px] text-slate-500">{{ t('totalSpent') }}</p></div>
          </div>
        </div>
        <div class="overflow-hidden rounded-[5px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <p class="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-medium dark:border-slate-800"><span><i class="fa-solid fa-clock-rotate-left mr-2 text-brand-600"></i>{{ t('orderHistory') }}</span><span class="text-xs text-slate-400">{{ history.length }}</span></p>
          <div class="max-h-[340px] overflow-y-auto p-2">
            <router-link v-for="h in history" :key="h.id" :to="'/receipt/'+h.id" replace class="mb-1 flex items-center gap-3 rounded-[5px] border p-2.5 transition" :class="h.id===o.id ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'">
              <div class="flex shrink-0 -space-x-3"><img v-for="i in h.items.slice(0,2)" :key="i.id" :src="i.image" class="h-10 w-10 rounded-[5px] border-2 border-white object-cover dark:border-slate-900"></div>
              <div class="min-w-0 flex-1"><p class="text-[13px] font-medium">{{ h.id }}</p><p class="text-[11px] text-slate-500">{{ VK.fmtDate(h.createdAt) }} · {{ h.items.length }} {{ t('items') }}</p></div>
              <div class="text-right"><p class="text-[13px] font-semibold">{{ VK.money(h.total) }}</p><span class="rounded-[5px] px-1.5 py-0.5 text-[10px] font-medium" :class="stCls(h.status)">{{ t(h.status) }}</span></div>
            </router-link>
          </div>
        </div>
        <div class="rounded-[5px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <p class="border-b border-slate-100 px-4 py-3 text-sm font-medium dark:border-slate-800"><i class="fa-solid fa-box-open mr-2 text-brand-600"></i>{{ t('productsInOrder') }} <span class="text-slate-400">({{ o.id }})</span></p>
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <router-link v-for="i in o.items" :key="i.id" :to="'/product/'+i.id" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
              <img :src="i.image" class="h-14 w-14 shrink-0 rounded-[5px] object-cover">
              <div class="min-w-0 flex-1"><p class="truncate text-[13px] font-medium">{{ i.name }}</p><p class="text-xs text-slate-500">{{ i.qty }} × {{ VK.money(i.price) }}</p></div>
              <p class="text-[13px] font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(i.price*i.qty) }}</p>
            </router-link>
          </div>
        </div>
      </aside>
      <div class="order-1 min-w-0 lg:order-2">
      <div class="no-print mx-auto mb-6 flex max-w-md flex-wrap items-center justify-center gap-3">
        <button @click="print" class="flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-medium text-white hover:bg-brand-800"><i class="fa-solid fa-print"></i>{{ t('print') }}</button>
        <button @click="pdf" class="flex h-11 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-5 text-sm font-medium hover:border-brand-500"><i class="fa-solid fa-file-pdf text-red-500"></i>{{ t('downloadPdf') }}</button>
        <button v-if="o.payment==='khqr' && !o.paid && o.status!=='cancelled'" @click="payOpen=true" class="flex h-11 items-center gap-2 rounded-xl bg-khqr-red px-5 text-sm font-medium text-white hover:brightness-110"><i class="fa-solid fa-qrcode"></i>{{ t('payNow') }} · {{ t('downloadKhqr') }}</button>
        <router-link to="/shop" class="flex h-11 items-center gap-2 px-3 text-sm text-slate-500 hover:text-brand-600">{{ t('continueShopping') }}</router-link>
      </div>
      <div class="print-area receipt-paper mx-auto my-6 max-w-md rounded-sm px-8 py-10 shadow-2xl fade-up">
        <div class="text-center">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-2xl text-white"><i class="fa-solid fa-bag-shopping"></i></div>
          <h2 class="mt-3 text-2xl font-semibold text-brand-700">{{ S.settings.siteName }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ S.settings.address }}</p>
          <p class="text-xs text-slate-500">{{ S.settings.phone }} · {{ S.settings.email }}</p>
          <p class="mt-4 inline-block rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[.25em]">{{ t('receipt') }}</p>
        </div>
        <div class="dashed my-5"></div>
        <div class="space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">{{ t('orderNo') }}</span><b>{{ o.id }}</b></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('date') }}</span><span>{{ VK.fmtDate(o.createdAt, true) }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('customer') }}</span><span>{{ o.customer.name }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('phone') }}</span><span>{{ o.customer.phone }}</span></div>
          <div class="flex justify-between gap-6"><span class="text-slate-500 shrink-0">{{ t('address') }}</span><span class="text-right text-xs line-clamp-2">{{ o.customer.address }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('payment') }}</span><span><span v-if="o.payment==='khqr'" class="rounded bg-khqr-red px-1.5 text-[10px] font-extrabold text-white">KHQR</span><span v-else>{{ t('cod') }}</span></span></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('status') }}</span><span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="o.paid ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'">{{ o.paid ? t('paid') : t('unpaid') }}</span></div>
        </div>
        <div class="dashed my-5"></div>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-xs uppercase text-slate-400"><th class="pb-2 font-medium">{{ t('item') }}</th><th class="pb-2 text-center font-medium">{{ t('qty') }}</th><th class="pb-2 text-right font-medium">{{ t('price') }}</th></tr></thead>
          <tbody><tr v-for="i in o.items" :key="i.id"><td class="py-1.5 pr-2">{{ i.name }}<br><span class="text-xs text-slate-400">{{ VK.money(i.price) }}</span></td><td class="py-1.5 text-center">{{ i.qty }}</td><td class="py-1.5 text-right font-medium">{{ VK.money(i.price*i.qty) }}</td></tr></tbody>
        </table>
        <div class="dashed my-5"></div>
        <div class="space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">{{ t('subtotal') }}</span><span>{{ VK.money(o.subtotal) }}</span></div>
          <div v-if="o.discount" class="flex justify-between"><span class="text-slate-500">{{ t('discount') }} <span v-if="o.coupon">({{ o.coupon }})</span></span><span>-{{ VK.money(o.discount) }}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">{{ t('shipping') }}</span><span>{{ o.shipping ? VK.money(o.shipping) : t('free') }}</span></div>
          <div class="flex justify-between pt-2 text-xl font-semibold"><span>{{ t('total') }}</span><span class="text-brand-700">{{ VK.money(o.total) }}</span></div>
        </div>
        <div class="dashed my-6"></div>
        <Barcode :value="o.id" />
        <p class="mt-5 text-center text-sm font-medium">{{ t('thanks') }}</p>
        <p class="mt-1 text-center text-[11px] text-slate-400">{{ S.settings.siteName }} · {{ VK.tagline() }}</p>
      </div>
      </div>
     </div>
      <Transition name="modal"><KhqrModal v-if="payOpen" :order="o" @close="payOpen=false" @paid="payOpen=false" /></Transition>
    </div>`
  };

  // ===== AUTH (full screen split · left image / right form · fits screen, no scroll) =====
  const AuthShell = {
    components: { Logo, LangSwitch: VK_UI.LangSwitch, ThemeToggle: VK_UI.ThemeToggle },
    setup() { return { year: new Date().getFullYear(), VK }; },
    template: `
    <div class="flex h-[100dvh] min-h-[600px] bg-white dark:bg-slate-950">
      <div class="relative hidden w-1/2 p-3 lg:block">
        <div class="relative h-full overflow-hidden rounded-[5px]">
          <img src="/vk/img/banners/auth.jpg" class="absolute inset-0 h-full w-full object-cover" alt="">
          <div class="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/45 to-brand-900/10"></div>
          <span class="absolute left-8 top-7 inline-flex items-center gap-2 rounded-[5px] bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur"><i class="fa-solid fa-star text-[10px] text-brand-300"></i>{{ t('newArrival') }}</span>
          <div class="absolute bottom-0 max-w-lg p-10 text-white">
            <h2 class="text-[28px] font-semibold leading-tight">{{ t('authTitle') }}</h2>
            <p class="mt-2.5 text-[13.5px] leading-relaxed text-brand-100/90">{{ t('authDesc') }}</p>
            <div class="mt-6 flex flex-wrap gap-2 text-xs">
              <span class="rounded-[5px] bg-white/10 px-3 py-1.5 backdrop-blur"><i class="fa-solid fa-truck-fast mr-1.5 text-brand-300"></i>{{ t('fastDelivery') }}</span>
              <span class="rounded-[5px] bg-white/10 px-3 py-1.5 backdrop-blur"><i class="fa-solid fa-shield-halved mr-1.5 text-brand-300"></i>{{ t('securePay') }}</span>
              <span class="rounded-[5px] bg-white/10 px-3 py-1.5 backdrop-blur"><i class="fa-solid fa-certificate mr-1.5 text-brand-300"></i>{{ t('original') }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex w-full flex-col lg:w-1/2">
        <div class="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8">
          <router-link to="/" class="flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px] text-slate-500 hover:text-brand-600 transition"><i class="fa-solid fa-arrow-left text-xs"></i>{{ t('backHome') }}</router-link>
          <div class="flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
        </div>
        <div class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 pb-4 sm:px-8">
          <div class="w-full max-w-[410px] fade-up">
            <div class="mb-5 flex flex-col items-center text-center">
              <Logo class="justify-center" />
              <p class="mt-1.5 text-[12.5px] text-slate-500 dark:text-slate-400">{{ VK.tagline() }}</p>
            </div>
            <div class="rounded-[5px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><slot /></div>
            <slot name="after" />
          </div>
        </div>
        <p class="hidden shrink-0 pb-4 text-center text-[11.5px] text-slate-400 sm:block">© {{ year }} {{ S.settings.siteName }}. {{ t('rights') }}</p>
      </div>
    </div>`
  };

  const LoginPage = {
    components: { AuthShell, InputField: VK_UI.InputField },
    setup() {
      const router = VueRouter.useRouter(); const route = VueRouter.useRoute();
      const f = reactive({ email: '', password: '' }); const busy = ref(false); const remember = ref(true);
      const submit = async () => {
        busy.value = true;
        try {
          const u = await VK.login(f.email, f.password);
          VK.toast(t('loginOk') + ' — ' + u.name);
          const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
          router.push(redirect && (!redirect.startsWith('/admin') || u.role === 'admin') ? redirect : (u.role === 'admin' ? '/admin' : '/'));
        } catch (e) { VK.toast(t('wrongCreds'), 'error'); }
        busy.value = false;
      };
      const demo = () => { f.email = 'admin@vk.com'; f.password = 'admin123'; };
      return { f, busy, remember, submit, demo };
    },
    template: `
    <AuthShell>
      <div class="text-center"><h1 class="text-xl font-semibold">{{ t('welcomeBack') }} 👋</h1><p class="mt-1 text-[13px] text-slate-500">{{ t('loginDesc') }}</p></div>
      <form @submit.prevent="submit" class="mt-6 space-y-3.5">
        <InputField v-model="f.email" type="email" icon="fa-envelope" :label="t('email')" placeholder="you@email.com" autocomplete="email" required />
        <InputField v-model="f.password" type="password" icon="fa-lock" :label="t('password')" placeholder="••••••••" autocomplete="current-password" required />
        <div class="flex items-center justify-between text-[12.5px]"><label class="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300"><input type="checkbox" v-model="remember">{{ t('remember') }}</label><a href="#" @click.prevent class="text-brand-600 hover:underline">{{ t('forgot') }}</a></div>
        <button :disabled="busy" class="flex h-[42px] w-full items-center justify-center gap-2 rounded-[5px] bg-brand-700 text-[13.5px] font-medium text-white hover:bg-brand-800 active:scale-[.99] disabled:opacity-60 transition"><i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'"></i>{{ t('login') }}</button>
      </form>
      <button type="button" @click="demo" class="mt-4 flex w-full items-center gap-2.5 rounded-[5px] border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2.5 text-left text-xs transition hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30">
        <i class="fa-solid fa-user-shield text-brand-600"></i><span><b class="font-medium text-brand-700 dark:text-brand-300">{{ t('demoAdmin') }}:</b> admin@vk.com / admin123</span>
      </button>
      <p class="mt-5 text-center text-[13px] text-slate-500">{{ t('noAccount') }} <router-link to="/register" class="font-medium text-brand-600 hover:underline">{{ t('createAccount') }}</router-link></p>
    </AuthShell>`
  };

  const RegisterPage = {
    components: { AuthShell, InputField: VK_UI.InputField },
    setup() {
      const router = VueRouter.useRouter();
      const f = reactive({ name: '', email: '', phone: '', password: '', confirm: '' }); const busy = ref(false); const agree = ref(true);
      const strength = computed(() => { const p = f.password; let n = 0; if (p.length >= 6) n++; if (p.length >= 10) n++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++; return n; });
      const submit = async () => {
        if (f.password.length < 6) return VK.toast(t('passShort'), 'error');
        if (f.password !== f.confirm) return VK.toast(t('passMismatch'), 'error');
        if (!agree.value) return VK.toast(t('agreeTerms'), 'error');
        busy.value = true;
        try { await VK.register({ name: f.name, email: f.email, phone: f.phone, password: f.password }); VK.toast(t('registerOk')); router.push('/'); }
        catch (e) { VK.toast(e.status === 409 ? t('emailExists') : e.message, 'error'); }
        busy.value = false;
      };
      return { f, busy, agree, strength, submit };
    },
    template: `
    <AuthShell>
      <div class="text-center"><h1 class="text-xl font-semibold">{{ t('createAccount') }}</h1><p class="mt-1 text-[13px] text-slate-500">{{ t('registerDesc') }}</p></div>
      <form @submit.prevent="submit" class="mt-5 grid gap-3 sm:grid-cols-2">
        <InputField class="sm:col-span-2" v-model="f.name" icon="fa-user" :label="t('name')" autocomplete="name" required />
        <InputField v-model="f.email" type="email" icon="fa-envelope" :label="t('email')" autocomplete="email" required />
        <InputField v-model="f.phone" type="tel" icon="fa-phone" :label="t('phone')" placeholder="012 345 678" autocomplete="tel" />
        <InputField v-model="f.password" type="password" icon="fa-lock" :label="t('password')" autocomplete="new-password" required />
        <InputField v-model="f.confirm" type="password" icon="fa-shield-halved" :label="t('confirmPassword')" autocomplete="new-password" required />
        <div class="flex gap-1 sm:col-span-2"><span v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors duration-300" :class="strength >= i ? (strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-brand-500') : 'bg-slate-200 dark:bg-slate-700'"></span></div>
        <label class="flex cursor-pointer items-start gap-2 text-[12.5px] text-slate-600 dark:text-slate-300 sm:col-span-2"><input type="checkbox" v-model="agree" class="mt-0.5">{{ t('agreeTerms') }}</label>
        <button :disabled="busy" class="flex h-[42px] items-center justify-center gap-2 rounded-[5px] bg-brand-700 text-[13.5px] font-medium text-white hover:bg-brand-800 active:scale-[.99] disabled:opacity-60 transition sm:col-span-2"><i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : 'fa-user-plus'"></i>{{ t('register') }}</button>
      </form>
      <p class="mt-4 text-center text-[13px] text-slate-500">{{ t('haveAccount') }} <router-link to="/login" class="font-medium text-brand-600 hover:underline">{{ t('login') }}</router-link></p>
    </AuthShell>`
  };

  // ===== ACCOUNT (profile with photo, orders, favorites) =====
  const AccountPage = {
    components: { ProductCard },
    setup() {
      const route = VueRouter.useRoute(); const router = VueRouter.useRouter();
      const tab = computed({ get: () => route.query.tab || 'orders', set: (v) => router.replace({ path: '/account', query: { tab: v } }) });
      const mine = computed(() => S.orders.filter((o) => S.user && o.userId === S.user.id));
      const spent = computed(() => mine.value.filter((o) => o.status !== 'cancelled').reduce((a, b) => a + b.total, 0));
      const favs = computed(() => S.wishlist.map(VK.productById).filter(Boolean));
      const f = reactive({ name: S.user.name, email: S.user.email, phone: S.user.phone || '', password: '', confirm: '' });
      const saving = ref(false); const uploading = ref(false);
      const save = async () => {
        if (f.password && f.password.length < 6) return VK.toast(t('passShort'), 'error');
        if (f.password !== f.confirm) return VK.toast(t('passMismatch'), 'error');
        saving.value = true;
        try { await VK.updateProfile({ name: f.name, email: f.email, phone: f.phone, password: f.password || undefined }); f.password = f.confirm = ''; VK.toast(t('saved')); }
        catch (e) { VK.toast(e.status === 409 ? t('emailExists') : e.message, 'error'); }
        saving.value = false;
      };
      const changeAvatar = async (e) => {
        const file = e.target.files[0]; e.target.value = ''; if (!file) return;
        uploading.value = true;
        try { const url = await VK.readFileAsDataURL(file, 320); await VK.updateProfile({ avatar: url }); VK.toast(t('photoUpdated')); } catch (err) { VK.toast(err.message, 'error'); }
        uploading.value = false;
      };
      const removeAvatar = async () => { try { await VK.updateProfile({ avatar: '' }); VK.toast(t('photoUpdated')); } catch (e) { VK.toast(e.message, 'error'); } };
      const clearFavs = async () => { if (await VK.askConfirm({ title: t('removeAll') + ' (' + S.wishlist.length + ')' })) VK.clearWish(); };
      const logout = () => { VK.logout(); router.push('/'); };
      const stCls = (s) => ({ pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' }[s]);
      const tabs = [['orders', 'fa-box', 'myOrders'], ['favorites', 'fa-heart', 'favorites'], ['profile', 'fa-user-pen', 'profile']];
      return { tab, tabs, mine, spent, favs, f, saving, uploading, save, changeAvatar, removeAvatar, clearFavs, logout, stCls, VK, inputCls };
    },
    template: `
    <div class="mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-8">
      <div class="grid gap-5 lg:grid-cols-[290px_1fr] lg:gap-8">
        <aside class="self-start lg:sticky lg:top-24">
          <div class="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div class="relative h-20 bg-gradient-to-r from-brand-600 to-brand-800"><i class="fa-solid fa-leaf absolute -bottom-3 right-4 text-6xl text-white/10"></i></div>
            <div class="-mt-11 px-5 pb-5 text-center">
              <div class="relative mx-auto h-[88px] w-[88px]">
                <img v-if="S.user.avatar" :src="S.user.avatar" class="h-full w-full rounded-full object-cover ring-4 ring-white dark:ring-slate-900">
                <span v-else class="grid h-full w-full place-items-center rounded-full bg-brand-600 text-3xl font-medium text-white ring-4 ring-white dark:ring-slate-900">{{ S.user.name[0] }}</span>
                <label class="absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-brand-600 shadow-md ring-2 ring-white hover:scale-105 transition dark:bg-slate-800 dark:ring-slate-900" :title="t('changePhoto')">
                  <i class="fa-solid text-xs" :class="uploading ? 'fa-spinner fa-spin' : 'fa-camera'"></i><input type="file" accept="image/*" class="hidden" @change="changeAvatar">
                </label>
              </div>
              <p class="mt-3 font-medium">{{ S.user.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ S.user.email }}</p>
              <p v-if="S.user.createdAt" class="mt-1 text-[11px] text-slate-400">{{ t('memberSince') }} {{ VK.fmtDate(S.user.createdAt) }}</p>
              <div class="mt-4 grid grid-cols-3 gap-2 text-center">
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 py-2"><p class="font-medium">{{ mine.length }}</p><p class="text-[10px] text-slate-500 truncate px-1">{{ t('orders') }}</p></div>
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 py-2"><p class="font-medium">{{ S.wishlist.length }}</p><p class="text-[10px] text-slate-500 truncate px-1">{{ t('favorites') }}</p></div>
                <div class="rounded-xl bg-slate-50 dark:bg-slate-800 py-2"><p class="font-medium text-[13px]">{{ VK.money(spent) }}</p><p class="text-[10px] text-slate-500 truncate px-1">{{ t('spent') }}</p></div>
              </div>
            </div>
            <nav class="no-scrollbar flex gap-1 overflow-x-auto border-t border-slate-100 dark:border-slate-800 p-2 lg:block lg:space-y-1">
              <button v-for="x in tabs" :key="x[0]" @click="tab=x[0]" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition lg:w-full" :class="tab===x[0] ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-800'"><i class="fa-solid w-4" :class="x[1]"></i>{{ t(x[2]) }}</button>
              <router-link v-if="S.user.role==='admin'" to="/admin" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 lg:w-full"><i class="fa-solid fa-gauge w-4"></i>{{ t('dashboard') }}</router-link>
              <button @click="logout" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 lg:w-full"><i class="fa-solid fa-arrow-right-from-bracket w-4"></i>{{ t('logout') }}</button>
            </nav>
          </div>
        </aside>

        <section class="min-w-0">
          <Transition name="page" mode="out-in">
            <div v-if="tab==='orders'" key="o">
              <h2 class="mb-4 text-xl font-semibold">{{ t('myOrders') }}</h2>
              <div v-if="!mine.length" class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center text-slate-500"><i class="fa-solid fa-box-open mb-3 block text-4xl text-brand-200"></i>{{ t('noOrders') }}<br><router-link to="/shop" class="mt-4 inline-block rounded-full bg-brand-700 px-5 py-2.5 text-sm text-white">{{ t('continueShopping') }}</router-link></div>
              <div class="space-y-3">
                <div v-for="o in mine" :key="o.id" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div class="flex items-center justify-between gap-3"><div><p class="font-medium">{{ o.id }}</p><p class="text-xs text-slate-500">{{ VK.fmtDate(o.createdAt, true) }} · {{ o.items.length }} {{ t('items') }}</p></div><span class="rounded-full px-3 py-1 text-xs font-medium" :class="stCls(o.status)">{{ t(o.status) }}</span></div>
                  <div class="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div class="flex -space-x-3"><img v-for="i in o.items.slice(0,4)" :key="i.id" :src="i.image" class="h-11 w-11 rounded-xl border-2 border-white dark:border-slate-900 object-cover"></div>
                    <div class="flex items-center gap-3"><span class="font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(o.total) }}</span><router-link :to="'/receipt/'+o.id" class="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs sm:text-sm hover:border-brand-500"><i class="fa-solid fa-receipt sm:mr-1"></i><span class="hidden sm:inline">{{ t('viewReceipt') }}</span></router-link></div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="tab==='favorites'" key="f">
              <div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-semibold">{{ t('favorites') }} <span class="text-slate-400">({{ favs.length }})</span></h2><button v-if="favs.length" @click="clearFavs" class="text-sm text-red-500"><i class="fa-regular fa-trash-can mr-1"></i>{{ t('removeAll') }}</button></div>
              <div v-if="!favs.length" class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center text-slate-500"><i class="fa-regular fa-heart mb-3 block text-4xl text-red-300"></i>{{ t('noFavorites') }}</div>
              <TransitionGroup name="list" tag="div" class="relative grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                <ProductCard v-for="p in favs" :key="p.id" :p="p" />
              </TransitionGroup>
            </div>

            <form v-else key="p" @submit.prevent="save" class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7">
              <h2 class="text-xl font-semibold">{{ t('profile') }}</h2>
              <div class="mt-5 flex flex-wrap items-center gap-4">
                <img v-if="S.user.avatar" :src="S.user.avatar" class="h-16 w-16 rounded-full object-cover"><span v-else class="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-2xl text-white">{{ S.user.name[0] }}</span>
                <label class="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition"><i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-camera'"></i>{{ t('changePhoto') }}<input type="file" accept="image/*" class="hidden" @change="changeAvatar"></label>
                <button v-if="S.user.avatar" type="button" @click="removeAvatar" class="h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm text-red-500">{{ t('remove') }}</button>
              </div>
              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <div><label class="mb-1.5 block text-sm font-medium">{{ t('name') }}</label><input v-model="f.name" required :class="inputCls"></div>
                <div><label class="mb-1.5 block text-sm font-medium">{{ t('email') }}</label><input v-model="f.email" type="email" required :class="inputCls"></div>
                <div><label class="mb-1.5 block text-sm font-medium">{{ t('phone') }}</label><input v-model="f.phone" :class="inputCls"></div>
                <div class="hidden sm:block"></div>
                <div><label class="mb-1.5 block text-sm font-medium">{{ t('newPassword') }}</label><input v-model="f.password" type="password" autocomplete="new-password" :placeholder="t('leaveBlank')" :class="inputCls"></div>
                <div><label class="mb-1.5 block text-sm font-medium">{{ t('confirmPassword') }}</label><input v-model="f.confirm" type="password" autocomplete="new-password" :class="inputCls"></div>
              </div>
              <button :disabled="saving" class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60 transition sm:w-auto sm:px-8"><i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>{{ t('updateProfile') }}</button>
            </form>
          </Transition>
        </section>
      </div>
    </div>`
  };

  // ===== FAVORITES =====
  const FavoritesPage = {
    components: { ProductCard },
    setup() {
      const favs = computed(() => S.wishlist.map(VK.productById).filter(Boolean));
      const clear = async () => { if (await VK.askConfirm({ title: t('removeAll') + ' (' + S.wishlist.length + ')' })) VK.clearWish(); };
      const addAll = () => favs.value.filter((p) => p.stock > 0).forEach((p) => VK.addToCart(p));
      return { favs, clear, addAll };
    },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h1 class="text-2xl sm:text-3xl font-semibold"><i class="fa-solid fa-heart mr-2 text-red-500"></i>{{ t('favorites') }}</h1><p class="mt-1 text-sm text-slate-500">{{ favs.length }} {{ t('products') }}</p></div>
        <div v-if="favs.length" class="flex gap-2">
          <button @click="addAll" class="flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"><i class="fa-solid fa-cart-plus"></i><span class="hidden sm:inline">{{ t('addToCart') }}</span></button>
          <button @click="clear" class="flex h-10 items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 px-4 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition"><i class="fa-regular fa-trash-can"></i>{{ t('removeAll') }}</button>
        </div>
      </div>
      <div v-if="!favs.length" class="mt-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 py-20 text-center">
        <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-50 dark:bg-red-950/30"><i class="fa-regular fa-heart text-3xl text-red-400"></i></div>
        <p class="mt-4 text-slate-500">{{ t('noFavorites') }}</p>
        <router-link to="/shop" class="mt-6 inline-block rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-white hover:bg-brand-800">{{ t('continueShopping') }}</router-link>
      </div>
      <TransitionGroup v-else name="list" tag="div" class="relative mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in favs" :key="p.id" :p="p" />
      </TransitionGroup>
    </div>`
  };

  const AboutPage = {
    setup() { return { stats: computed(() => [[S.products.length + '+', t('products')], [S.orders.length + '+', t('orders')], ['24/7', t('support')], ['100%', t('original')]]) }; },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div class="fade-up"><p class="text-sm font-medium uppercase tracking-widest text-brand-600">{{ t('about') }}</p><h1 class="mt-2 text-4xl font-semibold">{{ t('aboutTitle') }}</h1><p class="mt-5 leading-relaxed text-slate-600 dark:text-slate-300">{{ VK.L(S.settings.about) || t('aboutText') }}</p>
          <div class="mt-8 grid grid-cols-2 gap-4"><div v-for="s in stats" :key="s[1]" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5"><p class="text-3xl font-semibold text-brand-600">{{ s[0] }}</p><p class="text-sm text-slate-500">{{ s[1] }}</p></div></div>
        </div>
        <img src="/vk/img/banners/promo.jpg" class="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" alt="">
      </div>
    </div>`
  };

  const ContactPage = {
    components: { MapPicker },
    setup() { const f = reactive({ name: '', email: '', message: '' }); const send = () => { VK.toast(t('messageSent')); f.name = f.email = f.message = ''; }; return { f, send, inputCls }; },
    template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <h1 class="text-4xl font-semibold">{{ t('contactTitle') }}</h1>
      <div class="mt-8 grid gap-8 lg:grid-cols-2">
        <form @submit.prevent="send" class="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <input v-model="f.name" required :placeholder="t('name')" :class="inputCls"><input v-model="f.email" type="email" required :placeholder="t('email')" :class="inputCls">
          <textarea v-model="f.message" required rows="5" :placeholder="t('message')" :class="inputCls"></textarea>
          <button class="h-12 w-full rounded-xl bg-brand-700 text-sm font-medium text-white hover:bg-brand-800"><i class="fa-solid fa-paper-plane mr-2"></i>{{ t('send') }}</button>
          <div class="grid gap-3 pt-2 text-sm sm:grid-cols-2"><p><i class="fa-solid fa-phone mr-2 text-brand-600"></i>{{ S.settings.phone }}</p><p><i class="fa-solid fa-envelope mr-2 text-brand-600"></i>{{ S.settings.email }}</p><p class="sm:col-span-2"><i class="fa-solid fa-location-dot mr-2 text-brand-600"></i>{{ S.settings.address }}</p></div>
        </form>
        <MapPicker :editable="false" :lat="S.settings.storeLat" :lng="S.settings.storeLng" height="460px" />
      </div>
    </div>`
  };

  window.VK_PAGES = { ProductPage, ProductAbout, CartPage, CheckoutPage, ReceiptPage, LoginPage, RegisterPage, AccountPage, FavoritesPage, AboutPage, ContactPage, NotFound, KhqrModal, Gallery, StarPicker };
})();
