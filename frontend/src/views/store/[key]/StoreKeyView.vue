<script setup>
// Dynamic store page: /store/:key  ->  products | categories | orders | reviews | settings
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { api, endpoints } from '@/lib/api'
import { useAsync } from '@/lib/useAsync'
import { useI18n } from '@/lib/i18n'
import { downloadFile, loc, money, date } from '@/lib/format'
import { storage } from '@/lib/storage'

// `key` is reserved in Vue, so the route param :key is passed in as `collection`
const props = defineProps({ collection: { type: String, required: true } })
const { t } = useI18n()
const router = useRouter()

const KEYS = [
  { key: 'products', icon: 'fa-box' },
  { key: 'categories', icon: 'fa-layer-group' },
  { key: 'orders', icon: 'fa-receipt' },
  { key: 'reviews', icon: 'fa-comments' },
  { key: 'settings', icon: 'fa-gear' },
]
const known = computed(() => KEYS.some((k) => k.key === props.collection))

const { data, loading, error, run } = useAsync(() => api(endpoints.store), { initial: {} })
const value = computed(() => data.value?.[props.collection])
const isList = computed(() => Array.isArray(value.value))

const q = ref('')
const view = ref(storage.get('vk_fe_view') || 'table')
const page = ref(1)
const size = 10
watch(view, (v) => storage.set('vk_fe_view', v))
watch(() => props.collection, () => { q.value = ''; page.value = 1 })
watch(q, () => { page.value = 1 })

const rows = computed(() => {
  if (!isList.value) return []
  const s = q.value.trim().toLowerCase()
  return s ? value.value.filter((r) => JSON.stringify(r).toLowerCase().includes(s)) : value.value
})
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / size)))
const paged = computed(() => rows.value.slice((page.value - 1) * size, page.value * size))

// columns: primitive top-level fields (+ image / localized name), max 6
const columns = computed(() => {
  const sample = value.value?.[0]
  if (!sample) return []
  return Object.keys(sample)
    .filter((k) => !['images', 'image', 'details', 'features', 'specs', 'inBox', 'items', 'avatar'].includes(k))
    .filter((k) => sample[k] === null || ['string', 'number', 'boolean'].includes(typeof sample[k]) || (typeof sample[k] === 'object' && 'en' in sample[k]) || k === 'customer')
    .slice(0, 6)
})
const thumb = (r) => r.images?.[0] || r.image || r.items?.[0]?.image || null
function cell(r, k) {
  const v = r[k]
  if (v === null || v === undefined) return '—'
  if (k === 'customer') return v.name
  if (typeof v === 'object') return loc(v)
  if (typeof v === 'boolean') return v ? '✓' : '✗'
  if (['price', 'total', 'subtotal'].includes(k)) return money(v)
  if (k === 'createdAt') return date(v, true)
  return String(v)
}
const COL = {
  id: 'colId', name: 'name', brand: 'colBrand', category: 'categories', price: 'colPrice', discount: 'colDiscount', stock: 'colStock', sold: 'colSold',
  rating: 'rating', reviews: 'reviews', short: 'colShort', featured: 'colFeatured', icon: 'colIcon', customer: 'colCustomer', subtotal: 'colSubtotal',
  shipping: 'colShipping', total: 'colTotal', payment: 'colPayment', paid: 'paid', status: 'status', createdAt: 'colDate', productId: 'product',
  userId: 'colUser', text: 'yourReview', role: 'role', email: 'email', phone: 'phone',
}
const colLabel = (k) => (COL[k] ? t(COL[k]) : k)
const titleOf = (r) => r.name ? loc(r.name) : r.id

function exportJson() {
  downloadFile(`${props.collection}.json`, JSON.stringify(isList.value ? rows.value : value.value, null, 2))
}
</script>

<template>
  <div class="space-y-5">
    <!-- collection tabs -->
    <div class="no-scrollbar flex gap-2 overflow-x-auto">
      <button
        v-for="k in KEYS"
        :key="k.key"
        class="btn shrink-0"
        :class="k.key === props.collection ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900'"
        @click="router.push('/store/' + k.key)"
      >
        <i class="fa-solid" :class="k.icon"></i>{{ t(k.key) }}
        <span v-if="Array.isArray(data?.[k.key])" class="rounded bg-black/10 px-1.5 text-[11px]">{{ data[k.key].length }}</span>
      </button>
    </div>

    <EmptyState v-if="!known" icon="fa-circle-question" :text="t('notFound') + ': ' + props.collection" />

    <div v-else class="card">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <div>
          <p class="font-medium">{{ t(props.collection) }}</p>
          <p class="font-mono text-[11.5px] muted">IndexedDB · vk_etn_db → {{ props.collection }}</p>
        </div>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <div v-if="isList" class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
            <input v-model="q" :placeholder="t('search')" class="input h-10 w-52 pl-8" />
          </div>
          <div v-if="isList" class="flex h-10 rounded border border-slate-200 p-1 dark:border-slate-700">
            <button class="rounded px-3 text-xs" :class="view === 'table' ? 'bg-brand-600 text-white' : 'muted'" @click="view = 'table'"><i class="fa-solid fa-table-list"></i> {{ t('table') }}</button>
            <button class="rounded px-3 text-xs" :class="view === 'cards' ? 'bg-brand-600 text-white' : 'muted'" @click="view = 'cards'"><i class="fa-solid fa-grip"></i> {{ t('cards') }}</button>
          </div>
          <button class="btn-outline" @click="run"><i class="fa-solid fa-rotate" :class="loading && 'fa-spin'"></i></button>
          <button class="btn-outline" :disabled="!value" @click="exportJson"><i class="fa-solid fa-file-export"></i>{{ t('exportJson') }}</button>
        </div>
      </div>

      <div v-if="loading && !value" class="space-y-3 p-4"><div v-for="i in 5" :key="i" class="shimmer h-12 rounded"></div></div>
      <EmptyState v-else-if="error" icon="fa-triangle-exclamation" :text="error.message"><button class="btn-outline" @click="run">{{ t('retry') }}</button></EmptyState>
      <EmptyState v-else-if="value === undefined || (isList && !rows.length)" :text="t('noData')" />

      <!-- list: table -->
      <div v-else-if="isList && view === 'table'" class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead class="bg-slate-50 text-left text-[11px] uppercase text-slate-500 dark:bg-slate-800/50">
            <tr><th class="px-4 py-3"></th><th v-for="c in columns" :key="c" class="px-4 py-3 font-medium">{{ colLabel(c) }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in paged" :key="r.id || i" class="border-t border-slate-100 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40">
              <td class="w-14 px-4 py-2.5"><img v-if="thumb(r)" :src="thumb(r)" class="h-9 w-9 rounded object-cover" alt="" /></td>
              <td v-for="c in columns" :key="c" class="max-w-[240px] truncate px-4 py-2.5">
                <StatusBadge v-if="c === 'status' || c === 'role'" :status="r[c]" />
                <template v-else>{{ cell(r, c) }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- list: cards -->
      <div v-else-if="isList" class="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="(r, i) in paged" :key="r.id || i" class="rounded border border-slate-200 p-4 transition hover:shadow-soft dark:border-slate-800">
          <div class="flex items-center gap-3">
            <img v-if="thumb(r)" :src="thumb(r)" class="h-12 w-12 rounded object-cover" alt="" />
            <div class="min-w-0"><p class="truncate font-medium">{{ titleOf(r) }}</p><p class="truncate font-mono text-[11px] muted">{{ r.id }}</p></div>
          </div>
          <dl class="mt-3 space-y-1 text-[12.5px]">
            <div v-for="c in columns.filter((x) => x !== 'id' && x !== 'name')" :key="c" class="flex justify-between gap-3">
              <dt class="muted">{{ colLabel(c) }}</dt><dd class="truncate text-right">{{ cell(r, c) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- object (settings) -->
      <div v-else class="grid gap-2 p-4 sm:grid-cols-2">
        <div v-for="(v, k) in value" :key="k" class="rounded bg-slate-50 p-3 dark:bg-slate-800/60">
          <p class="text-[11px] font-medium uppercase tracking-wider muted">{{ k }}</p>
          <pre v-if="typeof v === 'object' && v !== null" class="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11.5px]">{{ JSON.stringify(v, null, 2) }}</pre>
          <p v-else class="mt-0.5 break-all text-[13px]">{{ String(v).startsWith('data:image') ? '[image]' : v }}</p>
        </div>
      </div>

      <div v-if="isList && rows.length" class="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[13px] dark:border-slate-800">
        <span class="muted">{{ rows.length }} {{ t('results') }}</span>
        <div class="flex items-center gap-1">
          <button class="btn-outline h-8 w-8 px-0" :disabled="page <= 1" @click="page--"><i class="fa-solid fa-chevron-left text-xs"></i></button>
          <span class="px-3 muted">{{ page }} / {{ pages }}</span>
          <button class="btn-outline h-8 w-8 px-0" :disabled="page >= pages" @click="page++"><i class="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>
