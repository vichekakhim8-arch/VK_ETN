<script setup>
import { computed } from 'vue'
import { api, endpoints } from '@/lib/api'
import { useAsync } from '@/lib/useAsync'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

const { t } = useI18n()
const { user, isAdmin } = useAuth()
const { data, loading } = useAsync(() => api(endpoints.store, { auth: false }), { initial: {} })

const count = (k) => (Array.isArray(data.value?.[k]) ? data.value[k].length : 0)
const stats = computed(() => [
  { key: 'products', icon: 'fa-box', color: 'from-brand-500 to-brand-700' },
  { key: 'orders', icon: 'fa-receipt', color: 'from-sky-500 to-sky-700' },
  { key: 'categories', icon: 'fa-layer-group', color: 'from-violet-500 to-violet-700' },
  { key: 'reviews', icon: 'fa-comments', color: 'from-amber-500 to-orange-600' },
])

const modules = computed(() => [
  { to: '/health', icon: 'fa-heart-pulse', title: 'health', path: 'src/views/health' },
  { to: '/khqr/check', icon: 'fa-qrcode', title: 'khqrCheck', path: 'src/views/khqr/check' },
  { to: '/reviews', icon: 'fa-comments', title: 'reviews', path: 'src/views/reviews' },
  { to: '/store/products', icon: 'fa-database', title: 'store', path: 'src/views/store/[key]' },
  ...(isAdmin.value ? [{ to: '/users', icon: 'fa-users', title: 'users', path: 'src/views/users' }] : []),
  { to: user.value ? '/profile' : '/login', icon: 'fa-user-shield', title: user.value ? 'profile' : 'login', path: user.value ? 'src/views/users' : 'src/views/auth' },
])
</script>

<template>
  <div class="space-y-6">
    <div class="page-header">
      <h2 class="page-title">{{ t('hello') }}{{ user ? ', ' + user.name : '' }} 👋</h2>
      <p class="mt-1 text-sm muted">{{ t('overviewDesc') }}</p>
    </div>

    <div class="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink v-for="s in stats" :key="s.key" :to="'/store/' + s.key" class="card card-pad metric-card group transition hover:-translate-y-0.5 hover:shadow-soft">
        <div>
          <p class="text-sm muted">{{ t(s.key) }}</p>
          <p class="mt-1 text-2xl font-semibold">
            <span v-if="loading" class="shimmer inline-block h-7 w-12 rounded"></span>
            <span v-else>{{ count(s.key) }}</span>
          </p>
        </div>
        <span class="grid h-12 w-12 place-items-center rounded bg-gradient-to-br text-white shadow" :class="s.color"><i class="fa-solid" :class="s.icon"></i></span>
      </RouterLink>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink v-for="m in modules" :key="m.to" :to="m.to" class="card card-pad group transition hover:border-brand-400 hover:shadow-soft">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"><i class="fa-solid" :class="m.icon"></i></span>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ t(m.title) }}</p>
            <p class="truncate font-mono text-[11.5px] muted">{{ m.path }}</p>
          </div>
          <i class="fa-solid fa-arrow-right text-xs text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600"></i>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
