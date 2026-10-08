<script setup>
import { ref } from 'vue'
import { storage } from '@/lib/storage'

const dark = ref(document.documentElement.classList.contains('dark'))
function toggle() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  storage.set('vk_theme', dark.value ? 'dark' : 'light')
}
</script>

<template>
  <button type="button" class="grid h-10 w-10 place-items-center rounded border border-slate-200 bg-white transition hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900" @click="toggle">
    <i class="fa-solid" :class="dark ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600'"></i>
  </button>
</template>
