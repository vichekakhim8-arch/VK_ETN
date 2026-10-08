<script setup>
import { toasts } from '@/lib/toast'

const icon = { success: 'fa-circle-check text-brand-600', error: 'fa-circle-xmark text-red-500', info: 'fa-circle-info text-sky-500' }
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-[92vw] max-w-sm flex-col gap-2">
    <TransitionGroup name="toast">
      <div v-for="item in toasts" :key="item.id" class="pointer-events-auto flex items-start gap-3 rounded border border-slate-200 bg-white/95 px-4 py-3 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <i class="fa-solid mt-0.5" :class="icon[item.type] || icon.info"></i>
        <p class="flex-1 text-[13.5px]">{{ item.message }}</p>
      </div>
    </TransitionGroup>
  </div>
</template>
