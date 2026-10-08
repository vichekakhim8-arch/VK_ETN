<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/lib/i18n'
import { useClickOutside } from '@/lib/useClickOutside'

const { lang, setLang, t } = useI18n()
const open = ref(false)
const root = ref(null)
useClickOutside(root, () => (open.value = false))

const langs = [
  { code: 'en', flag: '🇬🇧', label: 'English', short: 'EN' },
  { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្មែរ', short: 'ខ្មែរ' },
]
const current = computed(() => langs.find((l) => l.code === lang.value))
const pick = (code) => { setLang(code); open.value = false }
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" :title="t('language')" class="flex h-10 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 text-xs font-medium transition hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900" @click="open = !open">
      <span class="text-[15px] leading-none">{{ current.flag }}</span>{{ current.short }}
      <i class="fa-solid fa-chevron-down text-[9px] text-slate-400 transition" :class="open && 'rotate-180'"></i>
    </button>
    <Transition name="pop">
      <div v-if="open" class="absolute right-0 top-12 z-50 w-40 rounded border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <button
          v-for="l in langs"
          :key="l.code"
          type="button"
          class="flex w-full items-center gap-2.5 rounded px-3 py-2 text-[13px] transition"
          :class="lang === l.code ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800'"
          @click="pick(l.code)"
        >
          <span class="text-base leading-none">{{ l.flag }}</span><span class="flex-1 text-left">{{ l.label }}</span>
          <i v-if="lang === l.code" class="fa-solid fa-check text-[11px]"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>
