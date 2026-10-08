<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import KhqrCard from '@/components/khqr/KhqrCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { api, endpoints } from '@/lib/api'
import { buildKhqr, downloadKhqrPng } from '@/lib/khqr'
import { useAsync } from '@/lib/useAsync'
import { useI18n } from '@/lib/i18n'
import { toast } from '@/lib/toast'

const { t } = useI18n()

// merchant settings come from the existing store settings (public, token is never exposed)
const { data: store } = useAsync(() => api(endpoints.store, { auth: false }), { initial: {} })
const merchant = computed(() => ({ accountId: 'vk_etn@aclb', merchantName: 'VK ETN', city: 'Phnom Penh', currency: 'USD', expire: 180, ...(store.value?.settings?.khqr || {}) }))

const form = reactive({ amount: 25, currency: '', bill: 'VK' + String(Date.now()).slice(-6) })
const payload = ref('')
const left = ref(0)
const result = ref(null) // { paid, demo, md5, message }
const checking = ref(false)
let timer = null

const currency = computed(() => form.currency || merchant.value.currency || 'USD')
const mmss = computed(() => `${String(Math.floor(left.value / 60)).padStart(2, '0')}:${String(left.value % 60).padStart(2, '0')}`)

function generate() {
  const m = merchant.value
  payload.value = buildKhqr({ ...m, currency: currency.value, amount: Number(form.amount) || 0, billNumber: form.bill, storeLabel: 'VK_ETN' })
  result.value = null
  left.value = Number(m.expire) || 180
  clearInterval(timer)
  timer = setInterval(() => { if (--left.value <= 0) clearInterval(timer) }, 1000)
}

async function check() {
  if (!payload.value) return
  checking.value = true
  try {
    result.value = await api(endpoints.khqrCheck, { method: 'POST', body: { qr: payload.value }, auth: false })
  } catch (e) {
    toast(e.message, 'error')
  } finally {
    checking.value = false
  }
}

function download() {
  downloadKhqrPng({ payload: payload.value, merchantName: merchant.value.merchantName, amount: Number(form.amount) || 0, currency: currency.value, fileName: `KHQR-${form.bill || 'payment'}.png` })
    .then(() => toast(t('downloadQr') + ' ✓'))
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
    <!-- form + result -->
    <div class="space-y-6">
      <form class="card card-pad grid gap-4 sm:grid-cols-3" @submit.prevent="generate">
        <BaseInput v-model.number="form.amount" type="number" icon="fa-dollar-sign" :label="t('amount')" required />
        <label class="block">
          <span class="label">{{ t('currency') }}</span>
          <select v-model="form.currency" class="input">
            <option value="">{{ merchant.currency }} (default)</option>
            <option value="USD">USD ($)</option>
            <option value="KHR">KHR (៛)</option>
          </select>
        </label>
        <BaseInput v-model="form.bill" icon="fa-hashtag" :label="t('billNumber')" />
        <div class="flex flex-wrap gap-2 sm:col-span-3">
          <button class="btn-primary"><i class="fa-solid fa-qrcode"></i>{{ t('generate') }}</button>
          <button type="button" class="btn-outline" :disabled="!payload || checking" @click="check">
            <i class="fa-solid" :class="checking ? 'fa-spinner fa-spin' : 'fa-magnifying-glass-dollar'"></i>{{ t('checkPayment') }}
          </button>
          <button type="button" class="btn-outline" :disabled="!payload" @click="download"><i class="fa-solid fa-download"></i>{{ t('downloadQr') }}</button>
        </div>
      </form>

      <Transition name="fade">
        <div v-if="result" class="card card-pad flex items-start gap-3" :class="result.paid ? 'border-brand-300' : ''">
          <i class="fa-solid mt-0.5 text-xl" :class="result.paid ? 'fa-circle-check text-brand-600' : result.demo ? 'fa-flask text-amber-500' : 'fa-hourglass-half text-slate-400'"></i>
          <div class="min-w-0">
            <p class="font-medium">{{ result.paid ? t('paid') : result.demo ? t('demoMode') : t('notPaid') }}</p>
            <p class="mt-1 break-all font-mono text-[11.5px] muted">hash: {{ result.hash || result.md5 }}</p>
            <p v-if="result.message" class="text-xs muted">{{ result.message }}</p>
          </div>
        </div>
      </Transition>

      <div v-if="payload" class="card card-pad">
        <p class="label">{{ t('payload') }}</p>
        <p class="break-all rounded bg-slate-50 p-3 font-mono text-[11.5px] dark:bg-slate-800">{{ payload }}</p>
      </div>
    </div>

    <!-- KHQR preview (light panel with padding) -->
    <div class="card grid place-items-center gap-4 bg-slate-50 p-6 dark:bg-slate-800/40">
      <template v-if="payload">
        <div class="rounded bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <KhqrCard :payload="payload" :merchant-name="merchant.merchantName" :amount="Number(form.amount) || 0" :currency="currency" />
        </div>
        <p class="text-center text-[13px] muted"><i class="fa-solid fa-mobile-screen-button mr-1.5 text-khqr-red"></i>{{ t('scanToPay') }}</p>
        <p class="text-sm">{{ t('expiresIn') }} <b class="font-mono" :class="left < 30 && 'text-red-500'">{{ mmss }}</b></p>
      </template>
      <div v-else class="py-16 text-center muted">
        <span class="mx-auto grid h-16 w-16 place-items-center rounded bg-khqr-red text-sm font-bold text-white">KHQR</span>
        <p class="mt-3 text-sm">{{ t('generate') }}</p>
      </div>
    </div>
  </div>
</template>
