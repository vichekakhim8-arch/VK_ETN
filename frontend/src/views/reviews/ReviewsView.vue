<script setup>
import { computed, reactive, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { api, endpoints } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAsync } from '@/lib/useAsync'
import { useI18n } from '@/lib/i18n'
import { timeAgo } from '@/lib/format'
import { toast } from '@/lib/toast'

const { t } = useI18n()
const { user, isAdmin } = useAuth()
const { data, loading, error, run } = useAsync(() => api(endpoints.store, { auth: false }), { initial: {} })

const products = computed(() => data.value?.products || [])
const reviews = computed(() => data.value?.reviews || [])
const q = ref('')
const product = ref('all')
const rating = ref('all')
const form = reactive({ productId: '', rating: 5, text: '' })
const posting = ref(false)

const productName = (id) => products.value.find((p) => p.id === id)?.name || id
const productImg = (id) => products.value.find((p) => p.id === id)?.images?.[0]

const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  return reviews.value
    .filter((r) => (product.value === 'all' || r.productId === product.value) && (rating.value === 'all' || r.rating === Number(rating.value)))
    .filter((r) => !s || `${r.name} ${r.text} ${productName(r.productId)}`.toLowerCase().includes(s))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
const average = computed(() => (list.value.length ? list.value.reduce((n, r) => n + r.rating, 0) / list.value.length : 0))

async function post() {
  if (!form.productId || form.text.trim().length < 2) return
  posting.value = true
  try {
    await api(endpoints.reviews, { method: 'POST', body: { productId: form.productId, rating: form.rating, text: form.text.trim() } })
    form.text = ''
    toast(t('reviewPosted'))
    await run()
  } catch (e) {
    toast(e.message, 'error')
  } finally {
    posting.value = false
  }
}

async function remove(r) {
  if (!confirm(t('confirmDelete'))) return
  try {
    await api(endpoints.reviews, { method: 'DELETE', body: { ids: [r.id] } })
    toast(t('deleted'))
    await run()
  } catch (e) {
    toast(e.message, 'error')
  }
}
const canDelete = (r) => user.value && (isAdmin.value || r.userId === user.value.id)
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
    <div class="card">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <div class="relative min-w-[180px] flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
          <input v-model="q" :placeholder="t('search')" class="input h-10 pl-8" />
        </div>
        <select v-model="product" class="input h-10 w-auto max-w-[200px]">
          <option value="all">{{ t('product') }}: {{ t('all') }}</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-model="rating" class="input h-10 w-auto">
          <option value="all">{{ t('rating') }}: {{ t('all') }}</option>
          <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} ★</option>
        </select>
        <span class="chip bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">★ {{ average.toFixed(1) }} · {{ list.length }}</span>
      </div>

      <div v-if="loading" class="space-y-3 p-4"><div v-for="i in 4" :key="i" class="shimmer h-20 rounded"></div></div>
      <EmptyState v-else-if="error" icon="fa-triangle-exclamation" :text="t('error')"><button class="btn-outline" @click="run">{{ t('retry') }}</button></EmptyState>
      <EmptyState v-else-if="!list.length" :text="t('noData')" />
      <TransitionGroup v-else name="list" tag="div" class="relative divide-y divide-slate-100 dark:divide-slate-800">
        <article v-for="r in list" :key="r.id" class="flex w-full gap-3 p-4">
          <img v-if="productImg(r.productId)" :src="productImg(r.productId)" class="h-12 w-12 shrink-0 rounded object-cover" alt="" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 text-sm">
              <b class="font-medium">{{ r.name }}</b>
              <span class="text-amber-400">{{ '★'.repeat(r.rating) }}<span class="text-slate-300 dark:text-slate-600">{{ '★'.repeat(5 - r.rating) }}</span></span>
              <span class="text-xs muted">· {{ timeAgo(r.createdAt) }}</span>
            </div>
            <p class="truncate text-xs text-brand-700 dark:text-brand-400">{{ productName(r.productId) }}</p>
            <p class="mt-1 text-[13.5px] text-slate-600 dark:text-slate-300">{{ r.text }}</p>
          </div>
          <button v-if="canDelete(r)" class="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40" @click="remove(r)">
            <i class="fa-regular fa-trash-can text-sm"></i>
          </button>
        </article>
      </TransitionGroup>
    </div>

    <form class="card card-pad space-y-3 lg:sticky lg:top-24" @submit.prevent="post">
      <h3 class="font-medium">{{ t('writeReview') }}</h3>
      <template v-if="user">
        <select v-model="form.productId" class="input" required>
          <option value="" disabled>{{ t('product') }}</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <div>
          <span class="label">{{ t('yourRating') }}</span>
          <div class="flex gap-1">
            <button v-for="i in 5" :key="i" type="button" class="text-2xl transition hover:scale-110" @click="form.rating = i">
              <i class="fa-star" :class="form.rating >= i ? 'fa-solid text-amber-400' : 'fa-regular text-slate-300 dark:text-slate-600'"></i>
            </button>
          </div>
        </div>
        <textarea v-model="form.text" rows="3" maxlength="1000" :placeholder="t('yourReview')" class="input h-auto py-2.5" required></textarea>
        <button class="btn-primary w-full" :disabled="posting"><i class="fa-solid" :class="posting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>{{ t('post') }}</button>
      </template>
      <RouterLink v-else :to="{ name: 'login', query: { redirect: '/reviews' } }" class="btn-outline w-full">{{ t('loginToReview') }}</RouterLink>
    </form>
  </div>
</template>
