<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { endpoints, ping } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { date } from '@/lib/format'

const { t } = useI18n()

// No backend: these check the browser database (IndexedDB) that stores all data
const targets = [
  { key: 'health', label: 'DB · status', path: endpoints.health },
  { key: 'store', label: 'DB · store data', path: endpoints.store },
  { key: 'auth', label: 'DB · session', path: endpoints.auth },
]
const results = reactive(Object.fromEntries(targets.map((x) => [x.key, { history: [], last: null }])))
const auto = ref(true)
const checking = ref(false)
let timer = null

async function checkAll() {
  checking.value = true
  await Promise.all(targets.map(async (x) => {
    const r = { ...(await ping(x.path)), at: new Date() }
    const slot = results[x.key]
    slot.last = r
    slot.history.push(r)
    if (slot.history.length > 30) slot.history.shift()
  }))
  checking.value = false
}

const stateOf = (r) => (!r ? 'pending' : !r.ok ? 'down' : r.ms > 300 ? 'degraded' : 'operational')
const overall = computed(() => {
  const states = targets.map((x) => stateOf(results[x.key].last))
  return states.includes('down') ? 'down' : states.includes('degraded') ? 'degraded' : states.includes('pending') ? 'pending' : 'operational'
})
const uptime = (key) => {
  const h = results[key].history
  return h.length ? Math.round((h.filter((r) => r.ok).length / h.length) * 100) : 0
}
const maxMs = (key) => Math.max(100, ...results[key].history.map((r) => r.ms))

function schedule() {
  clearInterval(timer)
  if (auto.value) timer = setInterval(checkAll, 10000)
}
watch(auto, schedule)
onMounted(() => { checkAll(); schedule() })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="space-y-6">
    <div class="card card-pad flex flex-wrap items-center gap-4">
      <span class="pulse-dot grid h-4 w-4 place-items-center rounded-full" :class="overall === 'operational' ? 'bg-brand-500 text-brand-500' : overall === 'down' ? 'bg-red-500 text-red-500' : 'bg-amber-500 text-amber-500'"></span>
      <div class="flex-1">
        <p class="text-lg font-semibold">{{ overall === 'pending' ? t('loading') : t(overall) }}</p>
        <p class="text-xs muted">{{ t('autoRefresh') }}: 10s</p>
      </div>
      <label class="flex items-center gap-2 text-sm"><input v-model="auto" type="checkbox" />{{ t('autoRefresh') }}</label>
      <button class="btn-outline" :disabled="checking" @click="checkAll">
        <i class="fa-solid fa-rotate" :class="checking && 'fa-spin'"></i>{{ t('refresh') }}
      </button>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div v-for="x in targets" :key="x.key" class="card card-pad">
        <div class="flex items-center justify-between gap-2">
          <p class="truncate font-mono text-[13px]">{{ x.label }}</p>
          <StatusBadge :status="stateOf(results[x.key].last)">{{ results[x.key].last ? t(stateOf(results[x.key].last)) : '…' }}</StatusBadge>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded bg-slate-50 py-2 dark:bg-slate-800"><p class="font-semibold">{{ results[x.key].last?.ms ?? '–' }}<small class="text-xs muted"> ms</small></p><p class="text-[11px] muted">{{ t('latency') }}</p></div>
          <div class="rounded bg-slate-50 py-2 dark:bg-slate-800"><p class="font-semibold">{{ results[x.key].last?.status ?? '–' }}</p><p class="text-[11px] muted">{{ t('status') }}</p></div>
          <div class="rounded bg-slate-50 py-2 dark:bg-slate-800"><p class="font-semibold">{{ uptime(x.key) }}%</p><p class="text-[11px] muted">{{ t('uptime') }}</p></div>
        </div>
        <!-- latency history -->
        <div class="mt-4 flex h-14 items-end gap-[3px]">
          <span
            v-for="(r, i) in results[x.key].history"
            :key="i"
            class="flex-1 rounded-sm transition-all"
            :class="r.ok ? (r.ms > 300 ? 'bg-amber-400' : 'bg-brand-500') : 'bg-red-500'"
            :style="{ height: Math.max(8, (r.ms / maxMs(x.key)) * 100) + '%' }"
            :title="r.ms + ' ms'"
          ></span>
        </div>
        <p class="mt-2 text-[11px] muted">{{ t('lastCheck') }}: {{ results[x.key].last ? date(results[x.key].last.at, true) : '–' }} · {{ results[x.key].history.length }} {{ t('checks') }}</p>
      </div>
    </div>
  </div>
</template>
