<script setup>
import AppLogo from '@/components/AppLogo.vue'
import { useI18n } from '@/lib/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="grid min-h-screen place-items-center p-6 text-center">
    <div>
      <AppLogo />
      <p class="mt-8 text-7xl font-semibold text-brand-600">404</p>
      <p class="mt-2 muted">{{ t('notFound') }}</p>
      <RouterLink to="/" class="btn-primary mt-6">{{ t('backHome') }}</RouterLink>
    </div>
  </div>
</template>
