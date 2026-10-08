<script setup>
import { ref, watchEffect } from 'vue'
import { qrDataUrl } from '@/lib/khqr'

const props = defineProps({
  payload: { type: String, required: true },
  merchantName: { type: String, default: 'VK ETN' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
})

const src = ref('')
watchEffect(async () => {
  src.value = props.payload ? await qrDataUrl(props.payload) : ''
})
</script>

<template>
  <div class="khqr-card">
    <div class="khqr-head"><span class="text-[21px] font-bold tracking-wider text-white">KHQR</span></div>
    <div class="px-6 pt-4">
      <p class="text-[13px] text-neutral-700">{{ merchantName }}</p>
      <p class="mt-0.5 text-[23px] font-semibold">
        {{ currency === 'KHR' ? Math.round(amount).toLocaleString('en-US') : Number(amount || 0).toFixed(2) }}
        <small class="ml-1 text-[13px] font-medium">{{ currency }}</small>
      </p>
      <div class="khqr-sep"></div>
    </div>
    <div class="relative grid place-items-center px-5 pb-5 pt-4">
      <img v-if="src" :src="src" alt="KHQR" class="w-full [image-rendering:pixelated]" />
      <div v-else class="shimmer aspect-square w-full rounded"></div>
      <span class="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-black text-lg font-semibold text-white">
        {{ currency === 'KHR' ? '៛' : '$' }}
      </span>
    </div>
  </div>
</template>
