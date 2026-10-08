<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { toast } from '@/lib/toast'

const { t } = useI18n()
const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const remember = ref(true)
const busy = ref(false)

async function submit() {
  busy.value = true
  try {
    const user = await login(form.email, form.password)
    toast(`${t('loginOk')} — ${user.name}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    router.push(redirect.startsWith('/') && (!redirect.startsWith('/users') || user.role === 'admin') ? redirect : '/')
  } catch {
    toast(t('wrongCreds'), 'error')
  } finally {
    busy.value = false
  }
}

function fillDemo() {
  form.email = 'admin@vk.com'
  form.password = 'admin123'
}
</script>

<template>
  <AuthShell>
    <div class="text-center">
      <h1 class="text-xl font-semibold">{{ t('welcomeBack') }} 👋</h1>
      <p class="mt-1 text-[13px] muted">{{ t('loginDesc') }}</p>
    </div>

    <form class="mt-6 space-y-3.5" @submit.prevent="submit">
      <BaseInput v-model="form.email" type="email" icon="fa-envelope" :label="t('email')" placeholder="you@email.com" autocomplete="email" required />
      <BaseInput v-model="form.password" type="password" icon="fa-lock" :label="t('password')" placeholder="••••••••" autocomplete="current-password" required />
      <div class="flex items-center justify-between text-[12.5px]">
        <label class="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300"><input v-model="remember" type="checkbox" />{{ t('remember') }}</label>
        <a href="#" class="text-brand-600 hover:underline" @click.prevent>{{ t('forgot') }}</a>
      </div>
      <button :disabled="busy" class="btn-primary h-[42px] w-full">
        <i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'"></i>{{ t('login') }}
      </button>
    </form>

    <button type="button" class="mt-4 flex w-full items-center gap-2.5 rounded border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2.5 text-left text-xs transition hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30" @click="fillDemo">
      <i class="fa-solid fa-user-shield text-brand-600"></i>
      <span><b class="font-medium text-brand-700 dark:text-brand-300">{{ t('demoAdmin') }}:</b> admin@vk.com / admin123</span>
    </button>

    <p class="mt-5 text-center text-[13px] muted">
      {{ t('noAccount') }}
      <RouterLink to="/register" class="font-medium text-brand-600 hover:underline">{{ t('createAccount') }}</RouterLink>
    </p>
  </AuthShell>
</template>
