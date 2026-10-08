<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { toast } from '@/lib/toast'

const { t } = useI18n()
const { register } = useAuth()
const router = useRouter()

const form = reactive({ name: '', email: '', phone: '', password: '', confirm: '' })
const agree = ref(true)
const busy = ref(false)

const strength = computed(() => {
  const p = form.password
  let n = 0
  if (p.length >= 6) n++
  if (p.length >= 10) n++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++
  return n
})

async function submit() {
  if (form.password.length < 6) return toast(t('passShort'), 'error')
  if (form.password !== form.confirm) return toast(t('passMismatch'), 'error')
  if (!agree.value) return toast(t('agreeTerms'), 'error')
  busy.value = true
  try {
    await register(form)
    toast(t('registerOk'))
    router.push('/')
  } catch (e) {
    toast(e.status === 409 ? t('emailExists') : e.message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="text-center">
      <h1 class="text-xl font-semibold">{{ t('createAccount') }}</h1>
      <p class="mt-1 text-[13px] muted">{{ t('registerDesc') }}</p>
    </div>

    <form class="mt-5 grid gap-3 sm:grid-cols-2" @submit.prevent="submit">
      <BaseInput v-model="form.name" class="sm:col-span-2" icon="fa-user" :label="t('name')" autocomplete="name" required />
      <BaseInput v-model="form.email" type="email" icon="fa-envelope" :label="t('email')" autocomplete="email" required />
      <BaseInput v-model="form.phone" type="tel" icon="fa-phone" :label="t('phone')" placeholder="012 345 678" autocomplete="tel" />
      <BaseInput v-model="form.password" type="password" icon="fa-lock" :label="t('password')" autocomplete="new-password" required />
      <BaseInput v-model="form.confirm" type="password" icon="fa-shield-halved" :label="t('confirmPassword')" autocomplete="new-password" required />
      <div class="flex gap-1 sm:col-span-2">
        <span
          v-for="i in 4"
          :key="i"
          class="h-1 flex-1 rounded-full transition-colors"
          :class="strength >= i ? (strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-brand-500') : 'bg-slate-200 dark:bg-slate-700'"
        ></span>
      </div>
      <label class="flex cursor-pointer items-start gap-2 text-[12.5px] text-slate-600 dark:text-slate-300 sm:col-span-2">
        <input v-model="agree" type="checkbox" class="mt-0.5" />{{ t('agreeTerms') }}
      </label>
      <button :disabled="busy" class="btn-primary h-[42px] sm:col-span-2">
        <i class="fa-solid" :class="busy ? 'fa-spinner fa-spin' : 'fa-user-plus'"></i>{{ t('register') }}
      </button>
    </form>

    <p class="mt-4 text-center text-[13px] muted">
      {{ t('haveAccount') }}
      <RouterLink to="/login" class="font-medium text-brand-600 hover:underline">{{ t('login') }}</RouterLink>
    </p>
  </AuthShell>
</template>
