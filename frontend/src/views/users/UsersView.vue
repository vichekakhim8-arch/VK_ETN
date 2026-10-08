<script setup>
import { computed, ref } from 'vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { api, endpoints } from '@/lib/api'
import { useAsync } from '@/lib/useAsync'
import { useI18n } from '@/lib/i18n'
import { date } from '@/lib/format'
import { toast } from '@/lib/toast'

const { t } = useI18n()
const { data, loading, error, run } = useAsync(() => api(endpoints.users), { initial: { users: [] } })

const q = ref('')
const role = ref('all')
const selected = ref([])

const users = computed(() => {
  const s = q.value.trim().toLowerCase()
  return (data.value?.users || [])
    .filter((u) => role.value === 'all' || u.role === role.value)
    .filter((u) => !s || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(s))
})
const toggle = (id) => { const i = selected.value.indexOf(id); i > -1 ? selected.value.splice(i, 1) : selected.value.push(id) }

async function removeSelected() {
  if (!selected.value.length || !confirm(t('confirmDelete'))) return
  try {
    await api(endpoints.users, { method: 'DELETE', body: { ids: selected.value } })
    selected.value = []
    toast(t('deleted'))
    await run()
  } catch (e) {
    toast(e.message, 'error')
  }
}
</script>

<template>
  <div class="card">
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
      <div class="relative min-w-[180px] flex-1">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
        <input v-model="q" :placeholder="t('search')" class="input h-10 pl-8" />
      </div>
      <select v-model="role" class="input h-10 w-auto">
        <option value="all">{{ t('role') }}: {{ t('all') }}</option>
        <option value="customer">customer</option>
        <option value="admin">admin</option>
      </select>
      <Transition name="pop">
        <button v-if="selected.length" class="btn-danger" @click="removeSelected"><i class="fa-regular fa-trash-can"></i>{{ t('deleteSelected') }} ({{ selected.length }})</button>
      </Transition>
      <button class="btn-outline" @click="run"><i class="fa-solid fa-rotate" :class="loading && 'fa-spin'"></i></button>
    </div>

    <div v-if="loading" class="space-y-3 p-4"><div v-for="i in 4" :key="i" class="shimmer h-14 rounded"></div></div>
    <EmptyState v-else-if="error" icon="fa-lock" :text="error.message"><button class="btn-outline" @click="run">{{ t('retry') }}</button></EmptyState>
    <EmptyState v-else-if="!users.length" :text="t('noData')" />
    <div v-else class="overflow-x-auto">
      <table class="w-full text-[13px]">
        <thead class="bg-slate-50 text-left text-[11px] uppercase text-slate-500 dark:bg-slate-800/50">
          <tr><th class="w-10 px-4 py-3"></th><th class="px-4 py-3">{{ t('name') }}</th><th class="px-4 py-3">{{ t('phone') }}</th><th class="px-4 py-3">{{ t('role') }}</th><th class="px-4 py-3">{{ t('joined') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t border-slate-100 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40">
            <td class="px-4 py-3"><input type="checkbox" :disabled="u.role === 'admin'" :checked="selected.includes(u.id)" @change="toggle(u.id)" /></td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img v-if="u.avatar" :src="u.avatar" class="h-9 w-9 rounded-full object-cover" alt="" />
                <span v-else class="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">{{ u.name[0] }}</span>
                <div><p class="font-medium">{{ u.name }}</p><p class="text-xs muted">{{ u.email }}</p></div>
              </div>
            </td>
            <td class="px-4 py-3 muted">{{ u.phone || '—' }}</td>
            <td class="px-4 py-3"><StatusBadge :status="u.role" /></td>
            <td class="px-4 py-3 muted">{{ date(u.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
