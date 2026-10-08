<script setup>
defineProps({
  icon: { type: String, default: 'fa-inbox' },
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="py-14 text-center muted">
    <i class="fa-solid text-4xl text-brand-200 dark:text-brand-900" :class="icon"></i>
    <p class="mt-3 text-sm">{{ text }}</p>
    <div class="mt-4"><slot /></div>
  </div>
</template>
