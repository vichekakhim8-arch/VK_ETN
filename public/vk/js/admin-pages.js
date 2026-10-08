/* VK_ETN — admin management pages */
(function () {
  const { ref, reactive, computed, watch, onMounted } = Vue;
  const { S, t } = VK;
  const { Modal, DateRange, ExportMenu, ViewSwitch, Pager, AnimatedNumber, MapPicker, KhqrCard, Stars, ImageLibrary } = VK_UI;
  const { useList, Card, StatCard, SearchBox, SelectionBar, PageHead, Empty } = VK_ADMIN;

  const inp = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition';
  const sel = 'select-chevron h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-9 text-sm outline-none transition duration-200 hover:border-brand-400 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';
  const btnPrimary = 'flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 transition shadow-sm';
  const thCls = 'px-4 py-3 font-medium';
  const common = { Modal, DateRange, ExportMenu, ViewSwitch, Pager, AnimatedNumber, Card, StatCard, SearchBox, SelectionBar, PageHead, Empty, Stars, ImageLibrary };
  const stCls = (s) => ({ pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', completed: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' }[s]);
  let saveTimer = {};
  const saveLater = (key) => { clearTimeout(saveTimer[key]); saveTimer[key] = setTimeout(() => VK.save(key), 600); };

  async function removeItems(key, ids, L, all) {
    const count = ids.length;
    if (!count) return;
    const ok = await VK.askConfirm({ title: (all ? t('deleteAll') : t('deleteSelected')) + ' (' + count + ')', text: t('cannotUndo') });
    if (!ok) return;
    S[key] = S[key].filter((x) => !ids.includes(x.id));
    if (L) L.selected.value = L.selected.value.filter((id) => !ids.includes(id));
    if (await VK.save(key)) VK.toast(t('deleted'));
  }

  // ================= PRODUCTS =================
  const AdminProducts = {
    components: common,
    setup() {
      const route = VueRouter.useRoute();
      const cat = ref('all'); const stockF = ref('all');
      const low = () => Number(S.settings.lowStock) || 5;
      const L = useList(() => S.products, {
        key: 'products', text: (p) => p.name + ' ' + p.brand + ' ' + p.category + ' ' + p.id,
        filter: (p) => (cat.value === 'all' || p.category === cat.value) && (stockF.value === 'all' || (stockF.value === 'in' && p.stock > low()) || (stockF.value === 'low' && p.stock > 0 && p.stock <= low()) || (stockF.value === 'out' && p.stock <= 0))
      });
      if (route.query.q) L.q.value = route.query.q;
      const show = ref(false); const editing = ref(null); const newImg = ref('');
      const blank = () => ({ name: '', brand: '', category: '', price: 0, discount: 0, stock: 0, sold: 0, rating: 4.5, reviews: 0, featured: false, images: [], short: '', details: '', featuresText: '', specsText: '', inBoxText: '' });
      const form = reactive(blank());
      const open = (p) => {
        editing.value = p ? p.id : null;
        Object.assign(form, blank(), p ? Object.assign(VK.clone(p), { featuresText: (p.features || []).join('\n'), specsText: (p.specs || []).map((s) => s.k + ': ' + s.v).join('\n'), inBoxText: (p.inBox || []).join('\n') }) : {});
        newImg.value = ''; show.value = true;
      };
      const addImg = () => { if (newImg.value.trim()) { form.images.push(newImg.value.trim()); newImg.value = ''; } };
      const upload = async (e) => { for (const f of e.target.files) form.images.push(await VK.readFileAsDataURL(f)); e.target.value = ''; };
      const save = async () => {
        if (!form.name || !form.category || !S.categories.some((c) => c.id === form.category)) return VK.toast(t('fillRequired'), 'error');
        if (!form.images.length) form.images.push('/vk/img/banners/hero.jpg');
        const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
        const p = {
          name: form.name, brand: form.brand, category: form.category, price: +form.price || 0, discount: Math.min(95, Math.max(0, +form.discount || 0)), stock: Math.max(0, parseInt(form.stock) || 0),
          sold: +form.sold || 0, rating: +form.rating || 0, reviews: +form.reviews || 0, featured: !!form.featured, images: [...form.images], short: form.short, details: form.details,
          features: lines(form.featuresText), specs: lines(form.specsText).map((l) => { const i = l.indexOf(':'); return i > -1 ? { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() } : { k: l, v: '' }; }), inBox: lines(form.inBoxText)
        };
        if (editing.value) { const i = S.products.findIndex((x) => x.id === editing.value); S.products[i] = Object.assign({}, S.products[i], p); }
        else S.products.unshift(Object.assign({ id: 'p' + Date.now().toString(36) }, p));
        if (await VK.save('products')) { VK.toast(t('saved')); show.value = false; }
      };
      const exportRows = computed(() => L.filtered.value.map((p) => ({ id: p.id, name: p.name, brand: p.brand, category: VK.catName(p.category), price: p.price.toFixed(2), discount: VK.discountOf(p) + '%', final: VK.priceOf(p).toFixed(2), stock: p.stock, sold: p.sold || 0 })));
      const exportCols = computed(() => [{ key: 'id', label: 'ID' }, { key: 'name', label: t('name') }, { key: 'brand', label: t('brand') }, { key: 'category', label: t('category') }, { key: 'price', label: t('price') }, { key: 'discount', label: t('discount') }, { key: 'final', label: t('total') }, { key: 'stock', label: t('stock') }, { key: 'sold', label: t('sold') }]);
      const stockBadge = (p) => p.stock <= 0 ? ['bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300', t('outOfStock')] : p.stock <= low() ? ['bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', t('lowStock')] : ['bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', t('inStock')];
      const lib = ref(false);
      return { lib, L, cat, stockF, show, editing, form, open, save, newImg, addImg, upload, exportRows, exportCols, stockBadge, removeItems, VK, inp, sel, btnPrimary, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('products')" :sub="S.products.length + ' ' + t('products')">
        <ExportMenu :rows="exportRows" :columns="exportCols" filename="products" title="Products" />
        <button :class="btnPrimary" @click="open()"><i class="fa-solid fa-plus"></i>{{ t('addProduct') }}</button>
      </PageHead>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <select v-model="cat" :class="sel"><option value="all">{{ t('category') }}: {{ t('all') }}</option><option v-for="c in S.categories" :key="c.id" :value="c.id">{{ c.name[S.lang] || c.name.en }}</option></select>
          <select v-model="stockF" :class="sel"><option value="all">{{ t('stock') }}: {{ t('all') }}</option><option value="in">{{ t('inStock') }}</option><option value="low">{{ t('lowStock') }}</option><option value="out">{{ t('outOfStock') }}</option></select>
          <SelectionBar :count="L.selected.value.length" :total="L.filtered.value.length" @clear="L.selected.value=[]" @delete="removeItems('products', [...L.selected.value], L)" @deleteAll="removeItems('products', L.filtered.value.map(x=>x.id), L, true)" />
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr>
                <th class="w-10 px-4 py-3"><input type="checkbox" :checked="L.allOnPage.value" @change="L.toggleAll"></th>
                <th :class="thCls">{{ t('productName') }}</th><th :class="thCls">{{ t('category') }}</th><th :class="thCls">{{ t('price') }}</th><th :class="thCls">{{ t('stock') }}</th><th :class="thCls">{{ t('sold') }}</th><th :class="thCls">{{ t('status') }}</th><th :class="thCls" class="text-right">{{ t('actions') }}</th>
              </tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="p in L.paged.value" :key="p.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40 transition-colors" :class="L.isSel(p) && 'bg-brand-50/60 dark:bg-brand-950/30'">
                  <td class="px-4 py-3"><input type="checkbox" :checked="L.isSel(p)" @change="L.toggle(p)"></td>
                  <td class="px-4 py-3"><div class="flex items-center gap-3"><img :src="p.images[0]" class="h-12 w-12 rounded-xl object-cover"><div class="min-w-0"><p class="font-medium truncate max-w-[220px]">{{ p.name }}</p><p class="text-xs text-slate-500">{{ p.brand }} · {{ p.id }}</p></div></div></td>
                  <td class="px-4 py-3 text-slate-500">{{ VK.catName(p.category) }}</td>
                  <td class="px-4 py-3"><p class="font-medium">{{ VK.money(VK.priceOf(p)) }}</p><p v-if="VK.discountOf(p)" class="text-xs text-slate-400"><s>{{ VK.money(p.price) }}</s> <span class="text-red-500">-{{ VK.discountOf(p) }}%</span></p></td>
                  <td class="px-4 py-3 font-medium">{{ p.stock }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ p.sold || 0 }}</td>
                  <td class="px-4 py-3"><span class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium" :class="stockBadge(p)[0]">{{ stockBadge(p)[1] }}</span></td>
                  <td class="px-4 py-3"><div class="flex justify-end gap-1">
                    <router-link :to="'/product/'+p.id" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" :title="t('view')"><i class="fa-regular fa-eye"></i></router-link>
                    <button @click="open(p)" class="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800" :title="t('edit')"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button @click="removeItems('products',[p.id],L)" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" :title="t('delete')"><i class="fa-regular fa-trash-can"></i></button>
                  </div></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              <div v-for="p in L.paged.value" :key="p.id" class="group overflow-hidden rounded-2xl border transition hover:shadow-soft" :class="L.isSel(p) ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200 dark:border-slate-800'">
                <div class="relative aspect-[4/3] bg-brand-50 dark:bg-slate-800">
                  <img :src="p.images[0]" class="h-full w-full object-cover">
                  <input type="checkbox" class="absolute left-3 top-3 h-5 w-5" :checked="L.isSel(p)" @change="L.toggle(p)">
                  <span class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium" :class="stockBadge(p)[0]">{{ p.stock }} · {{ stockBadge(p)[1] }}</span>
                </div>
                <div class="p-4">
                  <p class="text-xs text-slate-500">{{ VK.catName(p.category) }}</p><p class="font-medium truncate">{{ p.name }}</p>
                  <p class="mt-1"><b class="text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }}</b> <s v-if="VK.discountOf(p)" class="text-xs text-slate-400">{{ VK.money(p.price) }}</s></p>
                  <div class="mt-3 grid grid-cols-3 gap-2">
                    <router-link :to="'/product/'+p.id" class="grid h-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-500"><i class="fa-regular fa-eye"></i></router-link>
                    <button @click="open(p)" class="h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-brand-600 hover:border-brand-500"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button @click="removeItems('products',[p.id],L)" class="h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:border-red-400"><i class="fa-regular fa-trash-can"></i></button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>

      <Modal :show="show" :title="editing ? t('edit') + ' — ' + form.name : t('addProduct')" size="max-w-3xl" @close="show=false">
        <form @submit.prevent="save" id="pform" class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2"><label class="mb-1 block text-sm font-medium">{{ t('productName') }} *</label><input v-model="form.name" required :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('brand') }}</label><input v-model="form.brand" :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('category') }} *</label><select v-model="form.category" required :class="inp"><option value="" disabled hidden>{{ t('category') }} *</option><option v-for="c in S.categories" :key="c.id" :value="c.id">{{ c.name[S.lang] || c.name.en }}</option></select></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('price') }} ($)</label><input v-model.number="form.price" type="number" step="0.01" min="0" :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('discount') }} (%)</label><input v-model.number="form.discount" type="number" min="0" max="95" :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('stock') }}</label><input v-model.number="form.stock" type="number" min="0" :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('rating') }}</label><input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" :class="inp"></div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-sm font-medium">{{ t('images') }}</label>
            <div class="flex flex-wrap gap-3">
              <TransitionGroup name="pop">
                <div v-for="(im,i) in form.images" :key="im+i" class="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img :src="im" class="h-full w-full object-cover"><span v-if="i===0" class="absolute bottom-0 inset-x-0 bg-brand-600 text-center text-[10px] text-white">{{ t('mainImage') }}</span>
                  <button type="button" @click="form.images.splice(i,1)" class="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100 transition"><i class="fa-solid fa-xmark"></i></button>
                </div>
              </TransitionGroup>
              <label class="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-brand-500 hover:text-brand-600 transition"><span class="text-center text-xs"><i class="fa-solid fa-cloud-arrow-up text-lg"></i><br>{{ t('upload') }}</span><input type="file" accept="image/*" multiple class="hidden" @change="upload"></label>
            </div>
            <div class="mt-2 flex gap-2"><input v-model="newImg" :placeholder="t('addImage')" :class="inp" @keydown.enter.prevent="addImg"><button type="button" @click="addImg" class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm hover:border-brand-500"><i class="fa-solid fa-plus"></i></button></div>
            <div class="mt-2"><button type="button" @click="lib=true" class="flex h-9 items-center gap-1.5 rounded-[5px] border border-slate-200 px-3 text-xs font-medium hover:border-brand-500 hover:text-brand-700 dark:border-slate-700"><i class="fa-regular fa-folder-open"></i>{{ t('chooseFromFolder') }}</button></div>
            <ImageLibrary :show="lib" @close="lib=false" @pick="p => form.images.push(p)" />
          </div>
          <div class="sm:col-span-2"><label class="mb-1 block text-sm font-medium">{{ t('shortDesc') }}</label><input v-model="form.short" :class="inp"></div>
          <div class="sm:col-span-2"><label class="mb-1 block text-sm font-medium">{{ t('longDesc') }}</label><textarea v-model="form.details" rows="4" :class="inp"></textarea></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('features') }} <span class="text-xs text-slate-400">(1 / line)</span></label><textarea v-model="form.featuresText" rows="4" :class="inp"></textarea></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('specs') }} <span class="text-xs text-slate-400">(Key: Value)</span></label><textarea v-model="form.specsText" rows="4" :class="inp"></textarea></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('inBox') }} <span class="text-xs text-slate-400">(1 / line)</span></label><textarea v-model="form.inBoxText" rows="3" :class="inp"></textarea></div>
          <label class="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" v-model="form.featured"> {{ t('featuredFlag') }}</label>
        </form>
        <template #footer>
          <button @click="show=false" class="h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-5 text-sm">{{ t('cancel') }}</button>
          <button type="submit" form="pform" :class="btnPrimary"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
        </template>
      </Modal>
    </div>`
  };

  // ================= ORDERS =================
  const AdminOrders = {
    components: Object.assign({ MapPicker }, common),
    setup() {
      const route = VueRouter.useRoute();
      const range = ref({ preset: 'all', from: '', to: '' });
      const status = ref('all'); const pay = ref('all');
      const r = computed(() => VK_UTIL.getRange(range.value.preset, range.value));
      const L = useList(() => S.orders, {
        key: 'orders', text: (o) => o.id + ' ' + o.customer.name + ' ' + o.customer.phone,
        filter: (o) => { const d = new Date(o.createdAt); return d >= r.value.from && d <= r.value.to && (status.value === 'all' || o.status === status.value) && (pay.value === 'all' || o.payment === pay.value); }
      });
      if (route.query.q) L.q.value = route.query.q;
      const detail = ref(null);
      const setStatus = async (o, s) => { o.status = s; if (s === 'completed') o.paid = true; if (await VK.save('orders')) VK.toast(t('saved')); };
      const markPaid = async (o) => { o.paid = true; if (o.status === 'pending') o.status = 'processing'; if (await VK.save('orders')) VK.toast(t('saved')); };
      const totals = computed(() => ({ count: L.filtered.value.length, rev: L.filtered.value.filter((o) => o.status !== 'cancelled').reduce((a, b) => a + b.total, 0), pending: L.filtered.value.filter((o) => o.status === 'pending').length, paid: L.filtered.value.filter((o) => o.paid).length }));
      const cards = computed(() => [
        { label: 'totalOrders', icon: 'fa-receipt', value: totals.value.count, fmt: 'int', color: 'from-sky-500 to-sky-700' },
        { label: 'revenue', icon: 'fa-sack-dollar', value: totals.value.rev, fmt: 'money', color: 'from-brand-500 to-brand-700' },
        { label: 'pending', icon: 'fa-hourglass-half', value: totals.value.pending, fmt: 'int', color: 'from-amber-500 to-orange-600' },
        { label: 'paid', icon: 'fa-circle-check', value: totals.value.paid, fmt: 'int', color: 'from-violet-500 to-violet-700' }
      ]);
      const exportRows = computed(() => L.filtered.value.map((o) => ({ id: o.id, date: VK.fmtDate(o.createdAt, true), customer: o.customer.name, phone: o.customer.phone, items: o.items.map((i) => i.name + ' x' + i.qty).join('; '), total: o.total.toFixed(2), payment: o.payment.toUpperCase(), paid: o.paid ? 'Paid' : 'Unpaid', status: o.status })));
      const exportCols = computed(() => [{ key: 'id', label: t('orderNo') }, { key: 'date', label: t('date') }, { key: 'customer', label: t('customer') }, { key: 'phone', label: t('phone') }, { key: 'items', label: t('items') }, { key: 'total', label: t('total') }, { key: 'payment', label: t('payment') }, { key: 'paid', label: t('paid') }, { key: 'status', label: t('status') }]);
      return { L, range, status, pay, detail, setStatus, markPaid, totals, cards, exportRows, exportCols, stCls, removeItems, VK, sel, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('orders')" :sub="totals.count + ' ' + t('orders') + ' · ' + VK.money(totals.rev)">
        <DateRange v-model="range" />
        <ExportMenu :rows="exportRows" :columns="exportCols" filename="orders" title="Orders" />
      </PageHead>
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in cards" :key="s.label" :icon="s.icon" :label="t(s.label)" :value="s.value" :fmt="s.fmt" :color="s.color" />
      </div>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <select v-model="status" :class="sel"><option value="all">{{ t('allStatus') }}</option><option v-for="s in ['pending','processing','completed','cancelled']" :key="s" :value="s">{{ t(s) }}</option></select>
          <select v-model="pay" :class="sel"><option value="all">{{ t('payment') }}: {{ t('all') }}</option><option value="khqr">KHQR</option><option value="cod">COD</option></select>
          <SelectionBar :count="L.selected.value.length" :total="L.filtered.value.length" @clear="L.selected.value=[]" @delete="removeItems('orders', [...L.selected.value], L)" @deleteAll="removeItems('orders', L.filtered.value.map(x=>x.id), L, true)" />
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr>
                <th class="w-10 px-4 py-3"><input type="checkbox" :checked="L.allOnPage.value" @change="L.toggleAll"></th>
                <th :class="thCls">{{ t('orderNo') }}</th><th :class="thCls">{{ t('customer') }}</th><th :class="thCls">{{ t('date') }}</th><th :class="thCls">{{ t('items') }}</th><th :class="thCls">{{ t('total') }}</th><th :class="thCls">{{ t('payment') }}</th><th :class="thCls">{{ t('status') }}</th><th :class="thCls" class="text-right">{{ t('actions') }}</th>
              </tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="o in L.paged.value" :key="o.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40" :class="L.isSel(o) && 'bg-brand-50/60 dark:bg-brand-950/30'">
                  <td class="px-4 py-3"><input type="checkbox" :checked="L.isSel(o)" @change="L.toggle(o)"></td>
                  <td class="px-4 py-3 font-medium">{{ o.id }}</td>
                  <td class="px-4 py-3"><p class="font-medium">{{ o.customer.name }}</p><p class="text-xs text-slate-500">{{ o.customer.phone }}</p></td>
                  <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ VK.fmtDate(o.createdAt, true) }}</td>
                  <td class="px-4 py-3"><div class="flex -space-x-2"><img v-for="i in o.items.slice(0,3)" :key="i.id" :src="i.image" class="h-8 w-8 rounded-lg border-2 border-white dark:border-slate-900 object-cover"></div></td>
                  <td class="px-4 py-3 font-medium">{{ VK.money(o.total) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap"><span class="inline-flex items-center gap-2"><span v-if="o.payment==='khqr'" class="rounded bg-khqr-red px-1.5 py-0.5 text-[10px] font-extrabold text-white">KHQR</span><span v-else class="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold">COD</span><span class="inline-flex min-w-[72px] items-center justify-center rounded px-2.5 py-1 text-center text-[11px] font-semibold" :class="o.paid ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'">{{ o.paid ? t('paid') : t('unpaid') }}</span></span></td>
                  <td class="px-4 py-3"><select :value="o.status" @change="setStatus(o, $event.target.value)" class="select-chevron cursor-pointer appearance-none rounded-full border-0 py-1 pl-3 pr-7 text-xs font-medium outline-none transition duration-200 hover:ring-2 hover:ring-brand-500/20 focus:ring-4 focus:ring-brand-500/10" :class="stCls(o.status)"><option v-for="s in ['pending','processing','completed','cancelled']" :key="s" :value="s" class="bg-white text-slate-800">{{ t(s) }}</option></select></td>
                  <td class="px-4 py-3"><div class="flex justify-end gap-1">
                    <button @click="detail=o" class="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800" :title="t('details')"><i class="fa-regular fa-eye"></i></button>
                    <router-link :to="'/receipt/'+o.id" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" :title="t('receipt')"><i class="fa-solid fa-receipt"></i></router-link>
                    <button @click="removeItems('orders',[o.id],L)" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-regular fa-trash-can"></i></button>
                  </div></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="o in L.paged.value" :key="o.id" class="rounded-2xl border p-4 transition hover:shadow-soft" :class="L.isSel(o) ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200 dark:border-slate-800'">
                <div class="flex items-start justify-between"><label class="flex items-center gap-2"><input type="checkbox" :checked="L.isSel(o)" @change="L.toggle(o)"><b>{{ o.id }}</b></label><span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="stCls(o.status)">{{ t(o.status) }}</span></div>
                <p class="mt-3 font-medium">{{ o.customer.name }}</p><p class="text-xs text-slate-500">{{ o.customer.phone }} · {{ VK.fmtDate(o.createdAt, true) }}</p>
                <div class="mt-3 flex items-center justify-between"><div class="flex -space-x-2"><img v-for="i in o.items.slice(0,4)" :key="i.id" :src="i.image" class="h-9 w-9 rounded-lg border-2 border-white dark:border-slate-900 object-cover"></div><p class="text-lg font-semibold text-brand-700 dark:text-brand-400">{{ VK.money(o.total) }}</p></div>
                <div class="mt-3 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <span class="inline-flex items-center gap-2">
                    <span v-if="o.payment==='khqr'" class="rounded bg-khqr-red px-1.5 py-0.5 font-extrabold text-white">KHQR</span><span v-else class="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 font-semibold">COD</span>
                    <span class="inline-flex min-w-[72px] items-center justify-center rounded px-2.5 py-1 text-center text-[11px] font-semibold" :class="o.paid ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'">{{ o.paid ? t('paid') : t('unpaid') }}</span>
                  </span>
                  <div class="ml-auto flex gap-1"><button @click="detail=o" class="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-eye"></i></button><router-link :to="'/receipt/'+o.id" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><i class="fa-solid fa-receipt"></i></router-link><button @click="removeItems('orders',[o.id],L)" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-regular fa-trash-can"></i></button></div>
                </div>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>

      <Modal :show="!!detail" :title="detail ? t('orderNo') + ' ' + detail.id : ''" size="max-w-3xl" @close="detail=null">
        <div v-if="detail" class="grid gap-6 md:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase text-slate-400">{{ t('customer') }}</p>
            <p class="mt-1 font-medium">{{ detail.customer.name }}</p><p class="text-sm text-slate-500">{{ detail.customer.phone }}</p><p class="mt-1 text-sm">{{ detail.customer.address }}</p>
            <div class="mt-3"><MapPicker :key="detail.id" :editable="false" :lat="detail.customer.lat" :lng="detail.customer.lng" height="200px" /></div>
            <p v-if="detail.note" class="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm"><i class="fa-regular fa-note-sticky mr-1"></i>{{ detail.note }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-slate-400">{{ t('items') }}</p>
            <div class="mt-2 space-y-2"><div v-for="i in detail.items" :key="i.id" class="flex items-center gap-3"><img :src="i.image" class="h-11 w-11 rounded-xl object-cover"><p class="flex-1 text-sm">{{ i.name }} <span class="text-slate-400">× {{ i.qty }}</span></p><b class="text-sm">{{ VK.money(i.price*i.qty) }}</b></div></div>
            <div class="mt-4 space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">{{ t('subtotal') }}</span><span>{{ VK.money(detail.subtotal) }}</span></div>
              <div v-if="detail.discount" class="flex justify-between"><span class="text-slate-500">{{ t('discount') }}</span><span>-{{ VK.money(detail.discount) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">{{ t('shipping') }}</span><span>{{ VK.money(detail.shipping) }}</span></div>
              <div class="flex justify-between text-lg font-semibold"><span>{{ t('total') }}</span><span class="text-brand-700 dark:text-brand-400">{{ VK.money(detail.total) }}</span></div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <select :value="detail.status" @change="setStatus(detail, $event.target.value)" :class="sel"><option v-for="s in ['pending','processing','completed','cancelled']" :key="s" :value="s">{{ t(s) }}</option></select>
              <button v-if="!detail.paid" @click="markPaid(detail)" class="h-10 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><i class="fa-solid fa-check mr-1"></i>{{ t('markPaid') }}</button>
              <router-link :to="'/receipt/'+detail.id" class="flex h-10 items-center rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-sm"><i class="fa-solid fa-receipt mr-2"></i>{{ t('receipt') }}</router-link>
            </div>
          </div>
        </div>
      </Modal>
    </div>`
  };

  // ================= CUSTOMERS =================
  const AdminCustomers = {
    components: common,
    setup() {
      const users = ref([]); const loading = ref(true); const role = ref('all');
      const load = async () => { loading.value = true; try { users.value = (await VK.api('/api/users')).users; } catch (e) { VK.toast(e.message, 'error'); } loading.value = false; };
      onMounted(load);
      const L = useList(() => users.value, { key: 'customers', text: (u) => u.name + ' ' + u.email + ' ' + u.phone, filter: (u) => role.value === 'all' || u.role === role.value });
      const stat = (u) => { const os = S.orders.filter((o) => o.userId === u.id); return { n: os.length, spent: os.filter((o) => o.status !== 'cancelled').reduce((a, b) => a + b.total, 0) }; };
      const del = async (ids, all) => {
        ids = ids.filter((id) => { const u = users.value.find((x) => x.id === id); return u && u.role !== 'admin'; });
        if (!ids.length) return;
        if (!(await VK.askConfirm({ title: (all ? t('deleteAll') : t('deleteSelected')) + ' (' + ids.length + ')' }))) return;
        try { await VK.api('/api/users', { method: 'DELETE', body: { ids } }); users.value = users.value.filter((u) => !ids.includes(u.id)); L.selected.value = []; VK.toast(t('deleted')); } catch (e) { VK.toast(e.message, 'error'); }
      };
      const exportRows = computed(() => L.filtered.value.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, joined: VK.fmtDate(u.createdAt), orders: stat(u).n, spent: stat(u).spent.toFixed(2) })));
      const exportCols = computed(() => [{ key: 'id', label: 'ID' }, { key: 'name', label: t('name') }, { key: 'email', label: t('email') }, { key: 'phone', label: t('phone') }, { key: 'role', label: t('role') }, { key: 'joined', label: t('joined') }, { key: 'orders', label: t('ordersCount') }, { key: 'spent', label: t('spent') }]);
      return { users, loading, role, L, stat, del, exportRows, exportCols, VK, sel, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('customers')" :sub="users.length + ' ' + t('customers')"><ExportMenu :rows="exportRows" :columns="exportCols" filename="customers" title="Customers" /></PageHead>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <select v-model="role" :class="sel"><option value="all">{{ t('role') }}: {{ t('all') }}</option><option value="customer">Customer</option><option value="admin">Admin</option></select>
          <SelectionBar :count="L.selected.value.length" :total="L.filtered.value.filter(u=>u.role!=='admin').length" @clear="L.selected.value=[]" @delete="del([...L.selected.value])" @deleteAll="del(L.filtered.value.map(x=>x.id), true)" />
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <div v-if="loading" class="space-y-3 p-4"><div v-for="i in 4" :key="i" class="shimmer h-14 rounded-xl"></div></div>
        <Transition v-else name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th class="w-10 px-4 py-3"><input type="checkbox" :checked="L.allOnPage.value" @change="L.toggleAll"></th><th :class="thCls">{{ t('name') }}</th><th :class="thCls">{{ t('phone') }}</th><th :class="thCls">{{ t('role') }}</th><th :class="thCls">{{ t('ordersCount') }}</th><th :class="thCls">{{ t('spent') }}</th><th :class="thCls">{{ t('joined') }}</th><th :class="thCls" class="text-right">{{ t('actions') }}</th></tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="u in L.paged.value" :key="u.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3"><input type="checkbox" :disabled="u.role==='admin'" :checked="L.isSel(u)" @change="L.toggle(u)"></td>
                  <td class="px-4 py-3"><div class="flex items-center gap-3"><img v-if="u.avatar" :src="u.avatar" class="h-10 w-10 rounded-full object-cover"><span v-else class="grid h-10 w-10 place-items-center rounded-full bg-brand-100 dark:bg-brand-900 font-semibold text-brand-700 dark:text-brand-300">{{ u.name[0] }}</span><div><p class="font-medium">{{ u.name }}</p><p class="text-xs text-slate-500">{{ u.email }}</p></div></div></td>
                  <td class="px-4 py-3 text-slate-500">{{ u.phone || '—' }}</td>
                  <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="u.role==='admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'">{{ u.role }}</span></td>
                  <td class="px-4 py-3 font-medium">{{ stat(u).n }}</td><td class="px-4 py-3 font-medium text-brand-700 dark:text-brand-400">{{ VK.money(stat(u).spent) }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ VK.fmtDate(u.createdAt) }}</td>
                  <td class="px-4 py-3 text-right"><button v-if="u.role!=='admin'" @click="del([u.id])" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto"><i class="fa-regular fa-trash-can"></i></button></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div v-for="u in L.paged.value" :key="u.id" class="rounded-2xl border p-5 text-center transition hover:shadow-soft" :class="L.isSel(u) ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200 dark:border-slate-800'">
                <div class="flex justify-between"><input type="checkbox" :disabled="u.role==='admin'" :checked="L.isSel(u)" @change="L.toggle(u)"><button v-if="u.role!=='admin'" @click="del([u.id])" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button></div>
                <img v-if="u.avatar" :src="u.avatar" class="mx-auto h-16 w-16 rounded-full object-cover"><span v-else class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 dark:bg-brand-900 text-xl font-semibold text-brand-700 dark:text-brand-300">{{ u.name[0] }}</span>
                <p class="mt-3 font-medium">{{ u.name }}</p><p class="text-xs text-slate-500">{{ u.email }}</p>
                <div class="mt-4 grid grid-cols-2 gap-2 text-sm"><div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><b>{{ stat(u).n }}</b><p class="text-xs text-slate-500">{{ t('ordersCount') }}</p></div><div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-2"><b>{{ VK.money(stat(u).spent) }}</b><p class="text-xs text-slate-500">{{ t('spent') }}</p></div></div>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>
    </div>`
  };

  // ================= CATEGORIES =================
  const AdminCategories = {
    components: common,
    setup() {
      const L = useList(() => S.categories, { key: 'cats', text: (c) => c.id + ' ' + c.name.en + ' ' + c.name.km, size: 20 });
      const show = ref(false); const editing = ref(null);
      const form = reactive({ en: '', km: '', icon: 'fa-tag', image: '' });
      const icons = ['fa-mobile-screen-button', 'fa-laptop', 'fa-headphones', 'fa-clock', 'fa-gamepad', 'fa-tablet-screen-button', 'fa-plug', 'fa-camera', 'fa-tv', 'fa-keyboard', 'fa-computer-mouse', 'fa-tag'];
      const open = (c) => { editing.value = c ? c.id : null; Object.assign(form, c ? { en: c.name.en, km: c.name.km, icon: c.icon, image: c.image } : { en: '', km: '', icon: 'fa-tag', image: '' }); show.value = true; };
      const upload = async (e) => { const f = e.target.files[0]; if (f) form.image = await VK.readFileAsDataURL(f, 600); };
      const save = async () => {
        if (!form.en) return VK.toast(t('fillRequired'), 'error');
        const data = { name: { en: form.en, km: form.km || form.en }, icon: form.icon, image: form.image || '/vk/img/banners/hero.jpg' };
        if (editing.value) Object.assign(S.categories.find((c) => c.id === editing.value), data);
        else { let id = form.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat'; while (S.categories.some((c) => c.id === id)) id += '-1'; S.categories.push(Object.assign({ id }, data)); }
        if (await VK.save('categories')) { VK.toast(t('saved')); show.value = false; }
      };
      const count = (id) => S.products.filter((p) => p.category === id).length;
      const exportRows = computed(() => L.filtered.value.map((c) => ({ id: c.id, en: c.name.en, km: c.name.km, products: count(c.id) })));
      const exportCols = [{ key: 'id', label: 'ID' }, { key: 'en', label: 'English' }, { key: 'km', label: 'Khmer' }, { key: 'products', label: 'Products' }];
      const lib = ref(false);
      return { lib, L, show, editing, form, icons, open, upload, save, count, exportRows, exportCols, removeItems, inp, btnPrimary, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('categories')" :sub="S.categories.length + ' ' + t('categories')">
        <ExportMenu :rows="exportRows" :columns="exportCols" filename="categories" title="Categories" />
        <button :class="btnPrimary" @click="open()"><i class="fa-solid fa-plus"></i>{{ t('addCategory') }}</button>
      </PageHead>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <SelectionBar :count="L.selected.value.length" :total="L.filtered.value.length" @clear="L.selected.value=[]" @delete="removeItems('categories', [...L.selected.value], L)" @deleteAll="removeItems('categories', L.filtered.value.map(x=>x.id), L, true)" />
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th class="w-10 px-4 py-3"><input type="checkbox" :checked="L.allOnPage.value" @change="L.toggleAll"></th><th :class="thCls">{{ t('name') }}</th><th :class="thCls">{{ t('nameKm') }}</th><th :class="thCls">{{ t('icon') }}</th><th :class="thCls">{{ t('products') }}</th><th :class="thCls" class="text-right">{{ t('actions') }}</th></tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="c in L.paged.value" :key="c.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3"><input type="checkbox" :checked="L.isSel(c)" @change="L.toggle(c)"></td>
                  <td class="px-4 py-3"><div class="flex items-center gap-3"><img :src="c.image" class="h-11 w-11 rounded-xl object-cover"><div><p class="font-medium">{{ c.name.en }}</p><p class="text-xs text-slate-500">{{ c.id }}</p></div></div></td>
                  <td class="px-4 py-3 font-khmer">{{ c.name.km }}</td>
                  <td class="px-4 py-3"><span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600"><i class="fa-solid" :class="c.icon"></i></span></td>
                  <td class="px-4 py-3 font-medium">{{ count(c.id) }}</td>
                  <td class="px-4 py-3"><div class="flex justify-end gap-1"><button @click="open(c)" class="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-pen-to-square"></i></button><button @click="removeItems('categories',[c.id],L)" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-regular fa-trash-can"></i></button></div></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div v-for="c in L.paged.value" :key="c.id" class="overflow-hidden rounded-2xl border transition hover:shadow-soft" :class="L.isSel(c) ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200 dark:border-slate-800'">
                <div class="relative aspect-video"><img :src="c.image" class="h-full w-full object-cover"><input type="checkbox" class="absolute left-3 top-3 h-5 w-5" :checked="L.isSel(c)" @change="L.toggle(c)"><span class="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow"><i class="fa-solid" :class="c.icon"></i></span></div>
                <div class="flex items-center justify-between p-4"><div><p class="font-medium">{{ c.name[S.lang] || c.name.en }}</p><p class="text-xs text-slate-500">{{ count(c.id) }} {{ t('products') }}</p></div><div class="flex gap-1"><button @click="open(c)" class="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800"><i class="fa-regular fa-pen-to-square"></i></button><button @click="removeItems('categories',[c.id],L)" class="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-regular fa-trash-can"></i></button></div></div>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>
      <Modal :show="show" :title="editing ? t('edit') : t('addCategory')" size="max-w-lg" @close="show=false">
        <form @submit.prevent="save" id="cform" class="space-y-4">
          <div><label class="mb-1 block text-sm font-medium">{{ t('nameEn') }} *</label><input v-model="form.en" required :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('nameKm') }}</label><input v-model="form.km" :class="inp"></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('icon') }}</label><div class="grid grid-cols-6 gap-2"><button v-for="i in icons" :key="i" type="button" @click="form.icon=i" class="grid h-11 place-items-center rounded-xl border transition" :class="form.icon===i ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-brand-500'"><i class="fa-solid" :class="i"></i></button></div></div>
          <div><label class="mb-1 block text-sm font-medium">{{ t('image') }}</label><div class="flex gap-3"><img v-if="form.image" :src="form.image" class="h-16 w-16 rounded-xl object-cover"><div class="flex-1 space-y-2"><input v-model="form.image" placeholder="/vk/img/categories/name.jpg" :class="inp"><div class="flex flex-wrap items-center gap-3"><label class="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-600"><i class="fa-solid fa-cloud-arrow-up"></i>{{ t('upload') }}<input type="file" accept="image/*" class="hidden" @change="upload"></label><button type="button" @click="lib=true" class="flex h-9 items-center gap-1.5 rounded-[5px] border border-slate-200 px-3 text-xs font-medium hover:border-brand-500 hover:text-brand-700 dark:border-slate-700"><i class="fa-regular fa-folder-open"></i>{{ t('chooseFromFolder') }}</button></div><ImageLibrary :show="lib" @close="lib=false" @pick="p => form.image = p" /></div></div></div>
        </form>
        <template #footer><button @click="show=false" class="h-10 rounded-xl border border-slate-200 dark:border-slate-700 px-5 text-sm">{{ t('cancel') }}</button><button type="submit" form="cform" :class="btnPrimary"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button></template>
      </Modal>
    </div>`
  };

  // ================= STOCK =================
  const AdminStock = {
    components: common,
    setup() {
      const f = ref('all');
      const low = () => Number(S.settings.lowStock) || 5;
      const L = useList(() => [...S.products].sort((a, b) => a.stock - b.stock), { key: 'stock', text: (p) => p.name + ' ' + p.brand, filter: (p) => f.value === 'all' || (f.value === 'low' && p.stock > 0 && p.stock <= low()) || (f.value === 'out' && p.stock <= 0) || (f.value === 'in' && p.stock > low()) });
      const sum = computed(() => ({ units: S.products.reduce((a, p) => a + p.stock, 0), value: S.products.reduce((a, p) => a + p.stock * p.price, 0), low: S.products.filter((p) => p.stock > 0 && p.stock <= low()).length, out: S.products.filter((p) => p.stock <= 0).length }));
      const adjust = (p, d) => { p.stock = Math.max(0, (parseInt(p.stock) || 0) + d); saveLater('products'); };
      const setVal = (p, v) => { p.stock = Math.max(0, parseInt(v) || 0); saveLater('products'); };
      const saveThreshold = () => saveLater('settings');
      const exportRows = computed(() => L.filtered.value.map((p) => ({ name: p.name, category: VK.catName(p.category), stock: p.stock, sold: p.sold || 0, value: (p.stock * p.price).toFixed(2), status: p.stock <= 0 ? 'Out' : p.stock <= low() ? 'Low' : 'OK' })));
      const exportCols = computed(() => [{ key: 'name', label: t('name') }, { key: 'category', label: t('category') }, { key: 'stock', label: t('stock') }, { key: 'sold', label: t('sold') }, { key: 'value', label: 'Value ($)' }, { key: 'status', label: t('status') }]);
      return { f, L, sum, adjust, setVal, saveThreshold, exportRows, exportCols, low, VK, sel, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('stock')" :sub="t('lowStock') + ': ' + sum.low + ' · ' + t('outOfStock') + ': ' + sum.out">
        <div class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"><i class="fa-solid fa-triangle-exclamation text-amber-500"></i>{{ t('threshold') }}<input type="number" min="0" v-model.number="S.settings.lowStock" @change="saveThreshold" class="w-14 bg-transparent font-medium outline-none"></div>
        <ExportMenu :rows="exportRows" :columns="exportCols" filename="stock" title="Stock report" />
      </PageHead>
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in [['fa-cubes',t('units'),sum.units,'int','from-brand-500 to-brand-700'],['fa-sack-dollar',t('stockValue'),sum.value,'money','from-sky-500 to-sky-700'],['fa-triangle-exclamation',t('lowStock'),sum.low,'int','from-amber-500 to-orange-600'],['fa-ban',t('outOfStock'),sum.out,'int','from-red-500 to-red-700']]" :key="s[1]" :icon="s[0]" :label="s[1]" :value="s[2]" :fmt="s[3]" :color="s[4]" />
      </div>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <div class="flex h-10 rounded-xl border border-slate-200 dark:border-slate-700 p-1 text-xs font-medium">
            <button v-for="x in [['all','all'],['in','inStock'],['low','lowStock'],['out','outOfStock']]" :key="x[0]" @click="f=x[0]" class="rounded-lg px-3 transition" :class="f===x[0] ? 'bg-brand-600 text-white' : 'text-slate-500'">{{ t(x[1]) }}</button>
          </div>
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th :class="thCls">{{ t('productName') }}</th><th :class="thCls">{{ t('category') }}</th><th :class="thCls" class="w-56">{{ t('stock') }}</th><th :class="thCls">{{ t('sold') }}</th><th :class="thCls">{{ t('adjust') }}</th></tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="p in L.paged.value" :key="p.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-3"><div class="flex items-center gap-3"><img :src="p.images[0]" class="h-11 w-11 rounded-xl object-cover"><p class="font-medium">{{ p.name }}</p></div></td>
                  <td class="px-4 py-3 text-slate-500">{{ VK.catName(p.category) }}</td>
                  <td class="px-4 py-3"><div class="flex items-center gap-3"><b class="w-8" :class="p.stock<=0 ? 'text-red-500' : p.stock<=low() ? 'text-amber-500' : ''">{{ p.stock }}</b><div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full transition-all duration-500" :class="p.stock<=0 ? 'bg-red-500' : p.stock<=low() ? 'bg-amber-500' : 'bg-brand-500'" :style="{width: Math.min(100, p.stock/50*100)+'%'}"></div></div></div></td>
                  <td class="px-4 py-3 text-slate-500">{{ p.sold || 0 }}</td>
                  <td class="px-4 py-3"><div class="flex items-center gap-1">
                    <button @click="adjust(p,-1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-500"><i class="fa-solid fa-minus text-xs"></i></button>
                    <input type="number" :value="p.stock" @change="setVal(p, $event.target.value)" class="h-8 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-center outline-none focus:border-brand-500">
                    <button @click="adjust(p,1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600"><i class="fa-solid fa-plus text-xs"></i></button>
                    <button @click="adjust(p,10)" class="h-8 rounded-lg bg-brand-50 dark:bg-brand-950 px-2 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100">+10</button>
                  </div></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="p in L.paged.value" :key="p.id" class="flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <img :src="p.images[0]" class="h-20 w-20 rounded-xl object-cover">
                <div class="flex-1"><p class="font-medium">{{ p.name }}</p><p class="text-xs text-slate-500">{{ VK.catName(p.category) }}</p>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full transition-all duration-500" :class="p.stock<=0 ? 'bg-red-500' : p.stock<=low() ? 'bg-amber-500' : 'bg-brand-500'" :style="{width: Math.min(100, p.stock/50*100)+'%'}"></div></div>
                  <div class="mt-3 flex items-center gap-1"><button @click="adjust(p,-1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700"><i class="fa-solid fa-minus text-xs"></i></button><input type="number" :value="p.stock" @change="setVal(p, $event.target.value)" class="h-8 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-center outline-none"><button @click="adjust(p,1)" class="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700"><i class="fa-solid fa-plus text-xs"></i></button><button @click="adjust(p,10)" class="h-8 rounded-lg bg-brand-50 dark:bg-brand-950 px-2 text-xs font-medium text-brand-700 dark:text-brand-300">+10</button></div>
                </div>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>
    </div>`
  };

  // ================= DISCOUNTS =================
  const AdminDiscounts = {
    components: common,
    setup() {
      const g = computed(() => S.settings.discount);
      const nc = reactive({ code: '', percent: 10 });
      const q = ref('');
      const saveGlobal = async () => { const d = S.settings.discount; d.percent = Math.min(95, Math.max(0, +d.percent || 0)); if (await VK.save('settings')) VK.toast(t('saved')); };
      const applyAll = async () => { const pc = +S.settings.discount.percent; if (!(await VK.askConfirm({ title: t('applyAll') + ' (' + pc + '%)', text: S.products.length + ' ' + t('products'), danger: false }))) return; S.products.forEach((p) => { p.discount = pc; }); if (await VK.save('products')) VK.toast(t('saved')); };
      const clearAll = async () => { if (!(await VK.askConfirm({ title: t('clearAll') }))) return; S.products.forEach((p) => { p.discount = 0; }); S.settings.discount.active = false; await VK.save('settings'); if (await VK.save('products')) VK.toast(t('saved')); };
      const addCoupon = async () => { const code = nc.code.trim().toUpperCase(); if (!code) return; if (S.settings.coupons.some((c) => c.code === code)) return VK.toast(code + ' exists', 'error'); S.settings.coupons.unshift({ code, percent: Math.min(95, Math.max(1, +nc.percent || 0)), active: true }); nc.code = ''; if (await VK.save('settings')) VK.toast(t('saved')); };
      const delCoupon = async (codes) => { if (!codes.length || !(await VK.askConfirm({ title: t('delete') + ' (' + codes.length + ')' }))) return; S.settings.coupons = S.settings.coupons.filter((c) => !codes.includes(c.code)); if (await VK.save('settings')) VK.toast(t('deleted')); };
      const toggleCoupon = (c) => { c.active = !c.active; saveLater('settings'); };
      const setDisc = (p, v) => { p.discount = Math.min(95, Math.max(0, parseInt(v) || 0)); saveLater('products'); };
      const list = computed(() => S.products.filter((p) => p.name.toLowerCase().includes(q.value.toLowerCase())));
      return { g, nc, q, saveGlobal, applyAll, clearAll, addCoupon, delCoupon, toggleCoupon, setDisc, list, VK, inp, btnPrimary, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('discounts')" :sub="t('globalDiscount')" />
      <div class="grid gap-6 xl:grid-cols-3">
        <Card class="relative overflow-hidden p-6 xl:col-span-2">
          <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10"></div>
          <div class="relative flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4"><span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl text-white shadow-lg"><i class="fa-solid fa-percent"></i></span><div><h3 class="font-medium">{{ t('globalDiscount') }}</h3><p class="text-sm text-slate-500">{{ g.active ? g.label + ' · -' + g.percent + '%' : '—' }}</p></div></div>
            <button @click="g.active=!g.active; saveGlobal()" class="keep-round relative h-8 w-14 rounded-full transition-colors duration-300" :class="g.active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'"><span class="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-300" :class="g.active ? 'left-7' : 'left-1'"></span></button>
          </div>
          <div class="relative mt-6 grid gap-4 sm:grid-cols-2">
            <div><label class="mb-1 block text-sm font-medium">{{ t('percent') }}: <b class="text-brand-600">{{ g.percent }}%</b></label><input type="range" min="0" max="90" v-model.number="g.percent" class="w-full"><div class="flex justify-between text-xs text-slate-400"><span>0%</span><span>90%</span></div></div>
            <div><label class="mb-1 block text-sm font-medium">{{ t('label') }}</label><input v-model="g.label" :class="inp"></div>
          </div>
          <div class="relative mt-5 flex flex-wrap gap-2">
            <button @click="saveGlobal" :class="btnPrimary"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
            <button @click="applyAll" class="flex h-10 items-center gap-2 rounded-xl border border-brand-600 px-4 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white transition"><i class="fa-solid fa-wand-magic-sparkles"></i>{{ t('applyAll') }}</button>
            <button @click="clearAll" class="flex h-10 items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 px-4 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white transition"><i class="fa-solid fa-eraser"></i>{{ t('clearAll') }}</button>
          </div>
        </Card>
        <Card class="p-6">
          <div class="flex items-center justify-between"><h3 class="font-medium"><i class="fa-solid fa-ticket mr-2 text-brand-600"></i>{{ t('coupons') }}</h3><button v-if="S.settings.coupons.length" @click="delCoupon(S.settings.coupons.map(c=>c.code))" class="text-xs font-medium text-red-500">{{ t('deleteAll') }}</button></div>
          <form @submit.prevent="addCoupon" class="mt-4 flex gap-2"><input v-model="nc.code" :placeholder="t('code')" class="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm uppercase outline-none focus:border-brand-500"><input v-model.number="nc.percent" type="number" min="1" max="95" class="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-2 text-sm outline-none"><button class="grid w-10 place-items-center rounded-xl bg-brand-600 text-white"><i class="fa-solid fa-plus"></i></button></form>
          <TransitionGroup name="row" tag="div" class="mt-4 space-y-2">
            <div v-for="c in S.settings.coupons" :key="c.code" class="flex items-center gap-3 rounded-xl border border-dashed p-3" :class="c.active ? 'border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30' : 'border-slate-200 dark:border-slate-700 opacity-60'">
              <span class="font-mono font-semibold tracking-wider">{{ c.code }}</span><span class="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">-{{ c.percent }}%</span>
              <button @click="toggleCoupon(c)" class="keep-round ml-auto relative h-6 w-11 rounded-full transition-colors" :class="c.active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" :class="c.active ? 'left-[22px]' : 'left-0.5'"></span></button>
              <button @click="delCoupon([c.code])" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </TransitionGroup>
        </Card>
      </div>
      <Card class="mt-6">
        <div class="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 p-4"><h3 class="font-medium">{{ t('perProduct') }}</h3><SearchBox v-model="q" class="ml-auto max-w-xs" /></div>
        <div class="overflow-x-auto"><table class="w-full text-sm">
          <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th :class="thCls">{{ t('productName') }}</th><th :class="thCls">{{ t('price') }}</th><th :class="thCls">{{ t('discount') }} (%)</th><th :class="thCls">{{ t('total') }}</th></tr></thead>
          <tbody><tr v-for="p in list" :key="p.id" class="border-t border-slate-100 dark:border-slate-800">
            <td class="px-4 py-3"><div class="flex items-center gap-3"><img :src="p.images[0]" class="h-10 w-10 rounded-xl object-cover"><span class="font-medium">{{ p.name }}</span></div></td>
            <td class="px-4 py-3">{{ VK.money(p.price) }}</td>
            <td class="px-4 py-3"><input type="number" min="0" max="95" :value="p.discount" @change="setDisc(p, $event.target.value)" class="h-9 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-center outline-none focus:border-brand-500"><span v-if="g.active && g.percent > p.discount" class="ml-2 text-xs text-brand-600">({{ t('globalDiscount').split(' ')[0] }} {{ g.percent }}%)</span></td>
            <td class="px-4 py-3 font-medium text-brand-700 dark:text-brand-400">{{ VK.money(VK.priceOf(p)) }}</td>
          </tr></tbody>
        </table></div>
      </Card>
    </div>`
  };

  // ================= SETTINGS =================
  const AdminSettings = {
    components: Object.assign({ MapPicker, KhqrCard }, common),
    setup() {
      const route = VueRouter.useRoute();
      const tab = ref(route.query.tab || 'site');
      const form = reactive(VK.clone(S.settings));
      const ready = ref(false); const showToken = ref(false);
      onMounted(async () => { await VK.load(); Object.assign(form, VK.clone(S.settings)); ready.value = true; });
      const me = reactive({ name: S.user.name, email: S.user.email, phone: S.user.phone || '', avatar: S.user.avatar || '', password: '', confirm: '' });
      const uploadLogo = async (e) => { const f = e.target.files[0]; if (f) form.logo = await VK.readFileAsDataURL(f, 256); };
      const uploadAvatar = async (e) => { const f = e.target.files[0]; if (f) me.avatar = await VK.readFileAsDataURL(f, 256); };
      const saveSite = async () => {
        const next = VK.clone(form); delete next.khqr.hasToken;
        const prev = VK.clone(S.settings);
        S.settings = Object.assign(S.settings, next);
        if (await VK.save('settings')) { VK.toast(t('saved')); document.title = S.settings.siteName + ' — Technology Store'; } else Object.assign(S.settings, prev);
      };
      const saveMe = async () => {
        if (me.password && me.password !== me.confirm) return VK.toast(t('passMismatch'), 'error');
        try { await VK.updateProfile({ name: me.name, email: me.email, phone: me.phone, avatar: me.avatar, password: me.password || undefined }); me.password = me.confirm = ''; VK.toast(t('saved')); } catch (e) { VK.toast(e.message, 'error'); }
      };
      const tabs = [['site', 'fa-globe', 'siteProfile'], ['hero', 'fa-images', 'heroBanner'], ['khqr', 'fa-qrcode', 'khqrSettings'], ['data', 'fa-database', 'dataTab'], ['admin', 'fa-user-shield', 'adminProfile']];
      const libTarget = ref(null);
      const pickLib = (p) => { if (libTarget.value) libTarget.value.image = p; libTarget.value = null; };
      // ---- Data & backup (browser database) ----
      const usage = ref('');
      const refreshUsage = async () => { try { const e = await navigator.storage.estimate(); usage.value = (e.usage / 1048576).toFixed(2) + ' MB / ' + (e.quota / 1048576).toFixed(0) + ' MB'; } catch (err) { usage.value = '—'; } };
      watch(tab, (v) => { if (v === 'data') refreshUsage(); }, { immediate: true });
      const exportData = async () => {
        const data = await VK_DB.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vk-etn-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        VK.toast(t('exportData') + ' ✓');
      };
      const importData = async (e) => {
        const file = e.target.files[0]; e.target.value = ''; if (!file) return;
        let data; try { data = JSON.parse(await file.text()); } catch (err) { return VK.toast(t('invalidFile'), 'error'); }
        if (!data || !Array.isArray(data.products)) return VK.toast(t('invalidFile'), 'error');
        if (!(await VK.askConfirm({ title: t('importData'), text: t('importConfirm') }))) return;
        await VK_DB.importAll(data); await VK.load(); Object.assign(form, VK.clone(S.settings)); refreshUsage(); VK.toast(t('dataImported'));
      };
      const resetData = async () => {
        if (!(await VK.askConfirm({ title: t('resetData'), text: t('resetConfirm') }))) return;
        await VK_DB.resetAll(); await VK.load(); Object.assign(form, VK.clone(S.settings)); refreshUsage(); VK.toast(t('dataReset'));
      };
      // ---- Hero slides & promo banner (dynamic home page) ----
      const editLang = ref('en');
      const ensure = () => {
        if (!Array.isArray(form.hero)) form.hero = [];
        form.hero.forEach((h) => { ['title1', 'title2', 'desc', 'button'].forEach((k) => { if (!h[k] || typeof h[k] !== 'object') h[k] = { en: h[k] || '', km: '' }; }); });
        if (!form.promo) form.promo = VK.clone(VK_DATA.settings.promo);
        ['label', 'title', 'subtitle', 'desc', 'button'].forEach((k) => { if (!form.promo[k] || typeof form.promo[k] !== 'object') form.promo[k] = { en: form.promo[k] || '', km: '' }; });
        if (!form.about || typeof form.about !== 'object') form.about = { en: '', km: '' };
      };
      watch(ready, (v) => { if (v) ensure(); });
      const addSlide = () => { ensure(); form.hero.push({ id: 'h' + Date.now().toString(36), active: true, image: '/vk/img/banners/hero.jpg', link: '/shop', title1: { en: 'New title', km: '' }, title2: { en: 'second line', km: '' }, desc: { en: '', km: '' }, button: { en: 'Shop now', km: 'ទិញឥឡូវ' } }); };
      const moveSlide = (i, d) => { const j = i + d; if (j < 0 || j >= form.hero.length) return; const x = form.hero.splice(i, 1)[0]; form.hero.splice(j, 0, x); };
      const delSlide = async (i) => { if (await VK.askConfirm({ title: t('delete') + ' ' + t('slide') + ' ' + (i + 1) })) form.hero.splice(i, 1); };
      const uploadTo = async (e, obj) => { const f = e.target.files[0]; e.target.value = ''; if (f) obj.image = await VK.readFileAsDataURL(f, 1600); };
      return { tab, tabs, form, ready, showToken, me, uploadLogo, uploadAvatar, saveSite, saveMe, inp, btnPrimary, editLang, addSlide, moveSlide, delSlide, uploadTo, libTarget, pickLib, usage, exportData, importData, resetData };
    },
    template: `
    <div>
      <PageHead :title="t('settings')" :sub="S.settings.siteName" />
      <ImageLibrary :show="!!libTarget" @close="libTarget=null" @pick="pickLib" />
      <div class="mb-6 flex flex-wrap gap-2">
        <button v-for="x in tabs" :key="x[0]" @click="tab=x[0]" class="flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium transition" :class="tab===x[0] ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-500'"><i class="fa-solid" :class="x[1]"></i>{{ t(x[2]) }}</button>
      </div>
      <div v-if="!ready" class="space-y-3"><div v-for="i in 3" :key="i" class="shimmer h-20 rounded-2xl"></div></div>
      <Transition v-else name="page" mode="out-in">
        <form v-if="tab==='site'" key="site" @submit.prevent="saveSite" class="grid gap-6 xl:grid-cols-3">
          <Card class="p-6 xl:col-span-2">
            <h3 class="mb-5 font-medium">{{ t('siteProfile') }}</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2 flex items-center gap-4">
                <div class="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-brand-50 dark:bg-slate-800"><img v-if="form.logo" :src="form.logo" class="h-full w-full object-cover"><i v-else class="fa-solid fa-bag-shopping text-2xl text-brand-600"></i></div>
                <div class="space-y-2"><p class="text-sm font-medium">{{ t('logo') }}</p><div class="flex gap-2"><label class="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white"><i class="fa-solid fa-cloud-arrow-up"></i>{{ t('upload') }}<input type="file" accept="image/*" class="hidden" @change="uploadLogo"></label><button v-if="form.logo" type="button" @click="form.logo=''" class="h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs text-red-500">{{ t('remove') }}</button></div></div>
              </div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('siteName') }}</label><input v-model="form.siteName" required :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('tagline') }}</label><input v-model="form.tagline" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('phone') }}</label><input v-model="form.phone" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('email') }}</label><input v-model="form.email" :class="inp"></div>
              <div class="sm:col-span-2"><label class="mb-1 block text-sm font-medium">{{ t('address') }}</label><input v-model="form.address" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('shippingFee') }} ($)</label><input v-model.number="form.shippingFee" type="number" step="0.5" min="0" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('freeShipping') }} ($)</label><input v-model.number="form.freeShippingOver" type="number" min="0" :class="inp"></div>
            </div>
            <h3 class="mb-3 mt-8 font-medium">{{ t('socials') }}</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-for="s in [['facebook','fa-facebook-f'],['telegram','fa-telegram'],['youtube','fa-youtube'],['tiktok','fa-tiktok']]" :key="s[0]" class="relative"><i class="fa-brands absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :class="s[1]"></i><input v-model="form[s[0]]" :class="inp" class="pl-10"></div>
            </div>
          </Card>
          <div class="space-y-6">
            <Card class="p-6"><h3 class="mb-3 font-medium"><i class="fa-solid fa-store mr-2 text-brand-600"></i>{{ t('storeLocation') }}</h3><MapPicker :lat="form.storeLat" :lng="form.storeLng" @update="p => { form.storeLat = p.lat; form.storeLng = p.lng }" height="240px" /></Card>
            <button :class="btnPrimary" class="w-full justify-center h-12"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
          </div>
        </form>

        <form v-else-if="tab==='khqr'" key="khqr" @submit.prevent="saveSite" class="grid gap-6 xl:grid-cols-3">
          <Card class="p-6 xl:col-span-2">
            <div class="mb-5 flex items-center gap-3"><span class="rounded-lg bg-khqr-red px-3 py-1.5 text-sm font-extrabold text-white">KHQR</span><h3 class="font-medium">{{ t('khqrSettings') }}</h3></div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div><label class="mb-1 block text-sm font-medium">{{ t('accountId') }}</label><input v-model="form.khqr.accountId" placeholder="name@bank" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('merchantName') }}</label><input v-model="form.khqr.merchantName" maxlength="25" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('city') }}</label><input v-model="form.khqr.city" maxlength="15" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('currency') }}</label><select v-model="form.khqr.currency" :class="inp"><option value="USD">USD ($)</option><option value="KHR">KHR (៛)</option></select></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('expiresIn') }} (s)</label><input v-model.number="form.khqr.expire" type="number" min="30" :class="inp"></div>
              <div class="sm:col-span-2"><label class="mb-1 block text-sm font-medium">{{ t('token') }}</label>
                <div class="relative"><i class="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i><input v-model="form.khqr.token" :type="showToken ? 'text' : 'password'" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." :class="inp" class="pl-10 pr-20 font-mono"><button type="button" @click="showToken=!showToken" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800">{{ showToken ? t('hide') : t('show') }}</button></div>
                <p class="mt-2 text-xs text-slate-500"><i class="fa-solid fa-circle-info mr-1"></i>{{ t('tokenHint') }}</p>
              </div>
            </div>
            <button :class="btnPrimary" class="mt-6"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
          </Card>
          <Card class="grid place-items-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6">
            <p class="mb-4 text-sm font-medium text-slate-500">{{ t('preview') }} · $25.00</p>
            <KhqrCard :amount="25" bill-number="PREVIEW" :cfg="form.khqr" />
          </Card>
        </form>

        <form v-else-if="tab==='hero'" key="hero" @submit.prevent="saveSite" class="space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex h-10 rounded-[5px] border border-slate-200 bg-white p-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">
              <button type="button" @click="editLang='en'" class="rounded-[5px] px-3 transition" :class="editLang==='en' ? 'bg-brand-600 text-white' : 'text-slate-500'">🇬🇧 English</button>
              <button type="button" @click="editLang='km'" class="rounded-[5px] px-3 transition" :class="editLang==='km' ? 'bg-brand-600 text-white' : 'text-slate-500'">🇰🇭 ខ្មែរ</button>
            </div>
            <div class="flex gap-2">
              <button type="button" @click="addSlide" class="flex h-10 items-center gap-2 rounded-[5px] border border-brand-600 px-4 text-sm font-medium text-brand-700 hover:bg-brand-600 hover:text-white transition dark:text-brand-300"><i class="fa-solid fa-plus"></i>{{ t('addSlide') }}</button>
              <button :class="btnPrimary"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
            </div>
          </div>
          <Card class="p-5 sm:p-6">
            <h3 class="mb-4 font-medium"><i class="fa-solid fa-images mr-2 text-brand-600"></i>{{ t('heroSlides') }} <span class="text-slate-400">({{ form.hero.length }})</span></h3>
            <TransitionGroup name="row" tag="div" class="space-y-4">
              <div v-for="(h,i) in form.hero" :key="h.id || i" class="grid gap-4 rounded-[5px] border border-slate-200 p-4 dark:border-slate-800 lg:grid-cols-[300px_1fr]" :class="h.active===false && 'opacity-60'">
                <div>
                  <div class="relative aspect-[16/9] overflow-hidden rounded-[5px] bg-brand-50 dark:bg-slate-800">
                    <img :src="h.image" class="h-full w-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent p-3 dark:from-slate-950/90 dark:via-slate-950/50">
                      <p class="text-sm font-semibold leading-tight text-slate-900 dark:text-white">{{ h.title1[editLang] || h.title1.en }}<br><span class="text-brand-600">{{ h.title2[editLang] || h.title2.en }}</span></p>
                      <span class="mt-2 inline-block rounded-[5px] bg-brand-700 px-2 py-1 text-[10px] text-white">{{ h.button[editLang] || h.button.en || t('discover') }}</span>
                    </div>
                    <span class="absolute right-2 top-2 rounded-[5px] bg-black/50 px-2 py-0.5 text-[10px] text-white">{{ t('slide') }} {{ i+1 }}</span>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <label class="flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-brand-600 text-xs font-medium text-white hover:bg-brand-700"><i class="fa-solid fa-cloud-arrow-up"></i>{{ t('upload') }}<input type="file" accept="image/*" class="hidden" @change="uploadTo($event, h)"></label>
                    <button type="button" @click="libTarget=h" class="grid h-9 w-9 place-items-center rounded-[5px] border border-slate-200 hover:border-brand-500 dark:border-slate-700" :title="t('chooseFromFolder')"><i class="fa-regular fa-folder-open text-xs"></i></button>
                    <button type="button" @click="moveSlide(i,-1)" :disabled="i===0" class="grid h-9 w-9 place-items-center rounded-[5px] border border-slate-200 disabled:opacity-40 dark:border-slate-700" :title="t('moveUp')"><i class="fa-solid fa-arrow-up text-xs"></i></button>
                    <button type="button" @click="moveSlide(i,1)" :disabled="i===form.hero.length-1" class="grid h-9 w-9 place-items-center rounded-[5px] border border-slate-200 disabled:opacity-40 dark:border-slate-700" :title="t('moveDown')"><i class="fa-solid fa-arrow-down text-xs"></i></button>
                    <button type="button" @click="delSlide(i)" class="grid h-9 w-9 place-items-center rounded-[5px] border border-red-200 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-900"><i class="fa-regular fa-trash-can text-xs"></i></button>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('title') }} ({{ editLang.toUpperCase() }})</label><input v-model="h.title1[editLang]" :class="inp"></div>
                  <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('titleLine2') }} ({{ editLang.toUpperCase() }})</label><input v-model="h.title2[editLang]" :class="inp"></div>
                  <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('description') }} ({{ editLang.toUpperCase() }})</label><textarea v-model="h.desc[editLang]" rows="2" :class="inp"></textarea></div>
                  <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('buttonText') }} ({{ editLang.toUpperCase() }})</label><input v-model="h.button[editLang]" :class="inp"></div>
                  <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('link') }}</label><input v-model="h.link" placeholder="/shop?cat=phones" :class="inp"></div>
                  <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('image') }} URL</label><input v-model="h.image" :class="inp"></div>
                  <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="h.active!==false" @change="h.active=$event.target.checked">{{ t('active') }}</label>
                </div>
              </div>
            </TransitionGroup>
            <p v-if="!form.hero.length" class="rounded-[5px] border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700">{{ t('noData') }}</p>
          </Card>
          <Card class="p-5 sm:p-6">
            <div class="mb-4 flex items-center justify-between"><h3 class="font-medium"><i class="fa-solid fa-rectangle-ad mr-2 text-brand-600"></i>{{ t('promoBanner') }}</h3><label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="form.promo.active!==false" @change="form.promo.active=$event.target.checked">{{ t('active') }}</label></div>
            <div class="grid gap-4 lg:grid-cols-[300px_1fr]">
              <div>
                <div class="aspect-[16/9] overflow-hidden rounded-[5px] bg-brand-50 dark:bg-slate-800"><img :src="form.promo.image" class="h-full w-full object-cover"></div>
                <label class="mt-2 flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-brand-600 text-xs font-medium text-white hover:bg-brand-700"><i class="fa-solid fa-cloud-arrow-up"></i>{{ t('upload') }}<input type="file" accept="image/*" class="hidden" @change="uploadTo($event, form.promo)"></label>
                <div class="mt-2"><button type="button" @click="libTarget=form.promo" class="flex h-9 items-center gap-1.5 rounded-[5px] border border-slate-200 px-3 text-xs font-medium hover:border-brand-500 hover:text-brand-700 dark:border-slate-700"><i class="fa-regular fa-folder-open"></i>{{ t('chooseFromFolder') }}</button></div>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('label') }} ({{ editLang.toUpperCase() }})</label><input v-model="form.promo.label[editLang]" :class="inp"></div>
                <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('title') }} ({{ editLang.toUpperCase() }})</label><input v-model="form.promo.title[editLang]" :class="inp"></div>
                <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('titleLine2') }} ({{ editLang.toUpperCase() }})</label><input v-model="form.promo.subtitle[editLang]" :class="inp"></div>
                <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('description') }} ({{ editLang.toUpperCase() }})</label><textarea v-model="form.promo.desc[editLang]" rows="2" :class="inp"></textarea></div>
                <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('buttonText') }} ({{ editLang.toUpperCase() }})</label><input v-model="form.promo.button[editLang]" :class="inp"></div>
                <div><label class="mb-1 block text-xs font-medium text-slate-500">{{ t('link') }}</label><input v-model="form.promo.link" :class="inp"></div>
              </div>
            </div>
          </Card>
          <Card class="p-5 sm:p-6">
            <h3 class="mb-3 font-medium"><i class="fa-solid fa-circle-info mr-2 text-brand-600"></i>{{ t('aboutContent') }} ({{ editLang.toUpperCase() }})</h3>
            <textarea v-model="form.about[editLang]" rows="4" :placeholder="t('aboutText')" :class="inp"></textarea>
          </Card>
        </form>

        <div v-else-if="tab==='data'" key="data" class="grid gap-6 xl:grid-cols-3">
          <Card class="p-6 xl:col-span-2">
            <h3 class="font-medium"><i class="fa-solid fa-database mr-2 text-brand-600"></i>{{ t('dataTab') }}</h3>
            <p class="mt-2 text-sm text-slate-500">{{ t('dataDesc') }}</p>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" @click="exportData" class="flex h-11 items-center justify-center gap-2 rounded-[5px] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><i class="fa-solid fa-download"></i>{{ t('exportData') }}</button>
              <label class="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[5px] border border-slate-200 px-4 text-sm font-medium hover:border-brand-500 dark:border-slate-700"><i class="fa-solid fa-upload"></i>{{ t('importData') }}<input type="file" accept="application/json,.json" class="hidden" @change="importData"></label>
              <button type="button" @click="resetData" class="flex h-11 items-center justify-center gap-2 rounded-[5px] border border-red-200 px-4 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white dark:border-red-900"><i class="fa-solid fa-rotate-left"></i>{{ t('resetData') }}</button>
            </div>
          </Card>
          <Card class="p-6">
            <p class="text-sm text-slate-500">{{ t('storageUsed') }}</p>
            <p class="mt-1 text-xl font-semibold">{{ usage || '…' }}</p>
            <div class="mt-4 space-y-1.5 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">{{ t('products') }}</span><b class="font-medium">{{ S.products.length }}</b></div>
              <div class="flex justify-between"><span class="text-slate-500">{{ t('categories') }}</span><b class="font-medium">{{ S.categories.length }}</b></div>
              <div class="flex justify-between"><span class="text-slate-500">{{ t('orders') }}</span><b class="font-medium">{{ S.orders.length }}</b></div>
              <div class="flex justify-between"><span class="text-slate-500">{{ t('reviewsTitle') }}</span><b class="font-medium">{{ S.reviews.length }}</b></div>
            </div>
            <p class="mt-4 font-mono text-[11px] text-slate-400">/vk/img/products · categories · banners · uploads</p>
          </Card>
        </div>

        <form v-else key="admin" @submit.prevent="saveMe" class="w-full">
          <Card class="p-6">
            <div class="mb-6 flex items-center gap-5">
              <div class="relative"><img v-if="me.avatar" :src="me.avatar" class="h-24 w-24 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900"><span v-else class="grid h-24 w-24 place-items-center rounded-full bg-brand-600 text-3xl font-semibold text-white ring-4 ring-brand-100 dark:ring-brand-900">{{ me.name[0] }}</span>
                <label class="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white dark:bg-slate-800 text-brand-600 shadow-lg"><i class="fa-solid fa-camera"></i><input type="file" accept="image/*" class="hidden" @change="uploadAvatar"></label></div>
              <div><h3 class="text-lg font-medium">{{ me.name }}</h3><p class="text-sm text-slate-500">{{ me.email }}</p><span class="mt-1 inline-block rounded-full bg-violet-100 dark:bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">admin</span></div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div><label class="mb-1 block text-sm font-medium">{{ t('name') }}</label><input v-model="me.name" required :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('email') }}</label><input v-model="me.email" type="email" required :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('phone') }}</label><input v-model="me.phone" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('newPassword') }}</label><input v-model="me.password" type="password" :placeholder="t('leaveBlank')" :class="inp"></div>
              <div><label class="mb-1 block text-sm font-medium">{{ t('confirmPassword') }}</label><input v-model="me.confirm" type="password" :class="inp"></div>
            </div>
            <button :class="btnPrimary" class="mt-6"><i class="fa-solid fa-floppy-disk"></i>{{ t('save') }}</button>
          </Card>
        </form>
      </Transition>
    </div>`
  };

  // ================= REVIEWS / COMMENTS =================
  const AdminReviews = {
    components: common,
    setup() {
      const rating = ref('all'); const prod = ref('all');
      const L = useList(() => [...S.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), {
        key: 'reviews', text: (r) => r.name + ' ' + r.text + ' ' + ((VK.productById(r.productId) || {}).name || ''),
        filter: (r) => (rating.value === 'all' || r.rating === +rating.value) && (prod.value === 'all' || r.productId === prod.value)
      });
      const pname = (id) => (VK.productById(id) || { name: id }).name;
      const pimg = (id) => ((VK.productById(id) || {}).images || ['/vk/img/banners/hero.jpg'])[0];
      const avg = computed(() => S.reviews.length ? S.reviews.reduce((a, b) => a + b.rating, 0) / S.reviews.length : 0);
      const del = async (ids, all) => {
        if (!ids.length) return;
        if (!(await VK.askConfirm({ title: (all ? t('deleteAll') : t('deleteSelected')) + ' (' + ids.length + ')' }))) return;
        try { await VK.deleteReviews(ids); L.selected.value = L.selected.value.filter((id) => !ids.includes(id)); VK.toast(t('deleted')); } catch (e) { VK.toast(e.message, 'error'); }
      };
      const exportRows = computed(() => L.filtered.value.map((r) => ({ date: VK.fmtDate(r.createdAt, true), product: pname(r.productId), customer: r.name, rating: r.rating, comment: r.text })));
      const exportCols = computed(() => [{ key: 'date', label: t('date') }, { key: 'product', label: t('product') }, { key: 'customer', label: t('customer') }, { key: 'rating', label: t('rating') }, { key: 'comment', label: t('comments') }]);
      return { L, rating, prod, pname, pimg, avg, del, exportRows, exportCols, VK, sel, thCls };
    },
    template: `
    <div>
      <PageHead :title="t('reviewsTitle')" :sub="S.reviews.length + ' ' + t('comments')"><ExportMenu :rows="exportRows" :columns="exportCols" filename="reviews" title="Reviews" /></PageHead>
      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="fa-comments" :label="t('comments')" :value="S.reviews.length" fmt="int" color="from-brand-500 to-brand-700" />
        <StatCard icon="fa-star" :label="t('rating')" :value="avg" fmt="decimal" color="from-amber-500 to-orange-600"><template #sub><span class="text-amber-500">★</span></template></StatCard>
        <StatCard icon="fa-face-smile" label="5 ★" :value="S.reviews.filter(r=>r.rating===5).length" fmt="int" color="from-sky-500 to-sky-700" />
        <StatCard icon="fa-face-frown" label="≤ 2 ★" :value="S.reviews.filter(r=>r.rating<=2).length" fmt="int" color="from-red-500 to-red-700" />
      </div>
      <Card>
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchBox v-model="L.q.value" />
          <select v-model="rating" :class="sel"><option value="all">{{ t('rating') }}: {{ t('all') }}</option><option v-for="n in [5,4,3,2,1]" :key="n" :value="n">{{ n }} ★</option></select>
          <select v-model="prod" :class="sel" class="max-w-[180px]"><option value="all">{{ t('product') }}: {{ t('all') }}</option><option v-for="p in S.products" :key="p.id" :value="p.id">{{ p.name }}</option></select>
          <SelectionBar :count="L.selected.value.length" :total="L.filtered.value.length" @clear="L.selected.value=[]" @delete="del([...L.selected.value])" @deleteAll="del(L.filtered.value.map(x=>x.id), true)" />
          <ViewSwitch v-model="L.view.value" class="ml-auto" />
        </div>
        <Transition name="fade" mode="out-in">
          <div v-if="L.view.value==='table'" key="t" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500"><tr><th class="w-10 px-4 py-3"><input type="checkbox" :checked="L.allOnPage.value" @change="L.toggleAll"></th><th :class="thCls">{{ t('product') }}</th><th :class="thCls">{{ t('customer') }}</th><th :class="thCls">{{ t('rating') }}</th><th :class="thCls">{{ t('comments') }}</th><th :class="thCls">{{ t('date') }}</th><th :class="thCls" class="text-right">{{ t('actions') }}</th></tr></thead>
              <TransitionGroup name="row" tag="tbody">
                <tr v-for="r in L.paged.value" :key="r.id" class="border-t border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40" :class="L.isSel(r) && 'bg-brand-50/60 dark:bg-brand-950/30'">
                  <td class="px-4 py-3"><input type="checkbox" :checked="L.isSel(r)" @change="L.toggle(r)"></td>
                  <td class="px-4 py-3"><router-link :to="'/product/'+r.productId" class="flex items-center gap-3 hover:text-brand-600"><img :src="pimg(r.productId)" class="h-10 w-10 rounded-xl object-cover"><span class="max-w-[160px] truncate font-medium">{{ pname(r.productId) }}</span></router-link></td>
                  <td class="px-4 py-3">{{ r.name }}</td>
                  <td class="px-4 py-3 whitespace-nowrap"><Stars :value="r.rating" /></td>
                  <td class="px-4 py-3"><p class="max-w-[320px] line-clamp-2 text-slate-600 dark:text-slate-300">{{ r.text }}</p></td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-500">{{ VK.fmtDate(r.createdAt) }}</td>
                  <td class="px-4 py-3 text-right"><button @click="del([r.id])" class="ml-auto grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><i class="fa-regular fa-trash-can"></i></button></td>
                </tr>
              </TransitionGroup>
            </table>
            <Empty v-if="!L.paged.value.length" />
          </div>
          <div v-else key="c" class="p-4">
            <TransitionGroup name="row" tag="div" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="r in L.paged.value" :key="r.id" class="rounded-2xl border p-4 transition hover:shadow-soft" :class="L.isSel(r) ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-200 dark:border-slate-800'">
                <div class="flex items-center gap-3"><input type="checkbox" :checked="L.isSel(r)" @change="L.toggle(r)"><img :src="pimg(r.productId)" class="h-10 w-10 rounded-xl object-cover"><div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ pname(r.productId) }}</p><p class="text-xs text-slate-500">{{ r.name }} · {{ VK.fmtDate(r.createdAt) }}</p></div><button @click="del([r.id])" class="text-red-500"><i class="fa-regular fa-trash-can"></i></button></div>
                <div class="mt-3"><Stars :value="r.rating" /></div>
                <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{{ r.text }}</p>
              </div>
            </TransitionGroup>
            <Empty v-if="!L.paged.value.length" />
          </div>
        </Transition>
        <Pager v-model:page="L.page.value" v-model:size="L.size.value" :pages="L.pages.value" :total="L.filtered.value.length" />
      </Card>
    </div>`
  };

  window.VK_ADMIN_PAGES = { AdminProducts, AdminOrders, AdminCustomers, AdminCategories, AdminStock, AdminDiscounts, AdminSettings, AdminReviews };
})();
