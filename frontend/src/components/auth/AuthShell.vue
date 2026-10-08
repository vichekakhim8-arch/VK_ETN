<script setup>
import AppLogo from '@/components/AppLogo.vue'
import LangSwitch from '@/components/ui/LangSwitch.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useI18n } from '@/lib/i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
const authImage = import.meta.env.BASE_URL + 'images/auth.jpg'
</script>

<template>
  <div class="flex h-[100dvh] min-h-[600px] bg-white dark:bg-slate-950">
    <!-- Left: image (desktop) -->
    <div class="relative hidden w-1/2 p-3 lg:block">
      <div class="relative h-full overflow-hidden rounded">
        <img :src="authImage" class="absolute inset-0 h-full w-full object-cover" alt="" />
        <div class="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/45 to-brand-900/10"></div>
        <div class="absolute bottom-0 max-w-lg p-10 text-white">
          <h2 class="text-[28px] font-semibold leading-tight">{{ t('authTitle') }}</h2>
          <p class="mt-2.5 text-[13.5px] leading-relaxed text-brand-100/90">{{ t('authDesc') }}</p>
        </div>
      </div>
    </div>

    <!-- Right: form -->
    <div class="flex w-full flex-col lg:w-1/2">
      <div class="flex h-16 shrink-0 items-center justify-between px-4 sm:px-8">
        <a href="/" class="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] text-slate-500 transition hover:text-brand-600">
          <i class="fa-solid fa-arrow-left text-xs"></i>{{ t('backHome') }}
        </a>
        <div class="flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
      </div>
      <div class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 pb-4 sm:px-8">
        <div class="w-full max-w-[410px]">
          <!-- single, centered logo -->
          <div class="mb-5 flex flex-col items-center text-center">
            <AppLogo to="/" />
            <p class="mt-1.5 text-[12.5px] muted">{{ t('tagline') }}</p>
          </div>
          <div class="card p-5 shadow-sm sm:p-7"><slot /></div>
        </div>
      </div>
      <p class="hidden shrink-0 pb-4 text-center text-[11.5px] text-slate-400 sm:block">© {{ year }} VK_ETN</p>
    </div>
  </div>
</template>
