<script setup>
defineProps({
  light: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm | md | lg
  to: { type: String, default: '/' },
})
</script>

<template>
  <RouterLink :to="to" class="inline-flex shrink-0 items-center gap-2.5" aria-label="VK_ETN">
    <span
      class="grid place-items-center rounded bg-brand-600 text-white shadow-sm"
      :class="size === 'lg' ? 'h-12 w-12 text-xl' : size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'"
    >
      <i class="fa-solid fa-bag-shopping"></i>
    </span>
    <span class="font-semibold tracking-tight" :class="size === 'lg' ? 'text-[26px]' : size === 'sm' ? 'text-lg' : 'text-[22px]'">
      <span :class="light ? 'text-white' : 'text-slate-900 dark:text-white'">VK</span><span :class="light ? 'text-brand-300' : 'text-brand-600 dark:text-brand-400'">_ETN</span>
    </span>
  </RouterLink>
</template>
